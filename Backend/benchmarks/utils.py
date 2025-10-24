# benchmarks/utils.py
import time
import psutil
from typing import List, Dict, Optional
import multiprocessing as mp

try:
    import GPUtil
except Exception:
    GPUtil = None

def get_cpu_percent() -> float:
    # short blocking read for a momentary percent
    return round(psutil.cpu_percent(interval=1), 2)

def get_cpu_temp() -> Optional[float]:
    try:
        temps = psutil.sensors_temperatures()
        # Choose a sensible sensor if available
        for key in ('coretemp', 'cpu-thermal', 'k10temp'):
            if key in temps and temps[key]:
                return round(temps[key][0].current, 2)
        if temps:
            first_key = next(iter(temps))
            if temps[first_key]:
                return round(temps[first_key][0].current, 2)
    except Exception:
        pass
    return None

def get_gpu_usage_and_vram() -> Dict[str, Optional[float]]:
    """Return dict { 'gpu_percent': float or None, 'vram_total_mb': int or None }."""
    if not GPUtil:
        return {"gpu_percent": None, "vram_total_mb": None}
    try:
        gpus = GPUtil.getGPUs()
        if not gpus:
            return {"gpu_percent": None, "vram_total_mb": None}
        gpu = gpus[0]
        gpu_percent = round(gpu.load * 100, 2)
        vram_total = int(gpu.memoryTotal) if hasattr(gpu, "memoryTotal") and gpu.memoryTotal else None
        return {"gpu_percent": gpu_percent, "vram_total_mb": vram_total}
    except Exception:
        return {"gpu_percent": None, "vram_total_mb": None}

def run_samples(duration_seconds: int = 60, sample_count: int = 3, sample_interval: Optional[int] = None) -> List[Dict]:
    """
    Collect `sample_count` evenly spaced samples over duration_seconds.
    Returns list of metrics: {"time": t, "cpu": cpu%, "gpu": gpu%, "temp": temp}
    """
    if sample_interval is None:
        if sample_count <= 1:
            sample_interval = 0
        else:
            sample_interval = max(1, duration_seconds // (sample_count - 1))

    metrics = []
    start = time.time()
    for i in range(sample_count):
        tpoint = int(round(time.time() - start))
        cpu = get_cpu_percent()
        gpu_info = get_gpu_usage_and_vram()
        gpu_percent = gpu_info.get("gpu_percent")
        temp = get_cpu_temp()
        metrics.append({
            "time": tpoint,
            "cpu": cpu if cpu is not None else 0.0,
            "gpu": gpu_percent if gpu_percent is not None else 0.0,
            "temp": temp if temp is not None else 0.0
        })
        if i < sample_count - 1:
            time.sleep(sample_interval)
    return metrics

# ---------------------------------------------------------
# CPU stress (multi-process) — uses all logical cores
# ---------------------------------------------------------
import numpy as np

def _cpu_worker(stop_event: mp.Event, op_counter: mp.Value, mat_size: int):
    """
    Worker process: continuously multiply matrices until stop_event is set.
    Increments op_counter for each completed multiplication.
    """
    # imports inside worker process
    import numpy as _np
    while not stop_event.is_set():
        a = _np.random.rand(mat_size, mat_size)
        b = _np.random.rand(mat_size, mat_size)
        _ = _np.dot(a, b)
        with op_counter.get_lock():
            op_counter.value += 1

def run_cpu_stress_test(duration_seconds: int = 10, mat_size: int = 300) -> Dict[str, float]:
    """
    Run a CPU stress test using one worker per logical core (multiprocessing).
    Returns:
      {
        "cpu_score": operations_per_sec,
        "avg_cpu": average_cpu_percent,
        "duration": elapsed_seconds
      }
    """
    cores = psutil.cpu_count(logical=True) or 1
    stop_event = mp.Event()
    op_counter = mp.Value('L', 0)  # unsigned long counter

    workers = []
    for _ in range(cores):
        p = mp.Process(target=_cpu_worker, args=(stop_event, op_counter, mat_size), daemon=True)
        p.start()
        workers.append(p)

    cpu_samples = []
    start = time.time()
    try:
        # sample CPU usage periodically while workers run
        while time.time() - start < duration_seconds:
            # sample over a short interval
            cpu_samples.append(psutil.cpu_percent(interval=0.5))
    finally:
        # stop workers
        stop_event.set()
        for p in workers:
            p.join(timeout=2)

    elapsed = time.time() - start
    ops = op_counter.value
    avg_cpu = round(sum(cpu_samples) / len(cpu_samples), 2) if cpu_samples else 0.0
    score = round(ops / elapsed, 2) if elapsed > 0 else 0.0

    return {"cpu_score": score, "avg_cpu": avg_cpu, "duration": round(elapsed, 2)}

# ---------------------------------------------------------
# GPU stress (OpenCL) — larger/chunked workload + repeats
# ---------------------------------------------------------
def run_gpu_stress_test(duration_seconds: int = 10, chunk_n: int = 8_000_000, repeat_per_cycle: int = 4) -> Dict[str, float]:
    """
    Run a GPU stress test with OpenCL vector additions in repeated cycles.
    - chunk_n: vector length per buffer (tune based on GPU memory)
    - repeat_per_cycle: how many kernel launches per cycle to increase load
    Returns:
      {
        "gpu_score": approx_gflops,
        "avg_gpu": avg_gpu_percent,
        "duration": elapsed_seconds
      }
    Falls back cleanly if no OpenCL or GPUtil present.
    """
    if not GPUtil:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

    try:
        import pyopencl as cl
        import numpy as _np
    except Exception:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

    try:
        platforms = cl.get_platforms()
        devices = [d for p in platforms for d in p.get_devices(device_type=cl.device_type.GPU)]
        if not devices:
            return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

        ctx = cl.Context(devices)
        queue = cl.CommandQueue(ctx)

        kernel_code = """
        __kernel void vec_add(__global const float *a, __global const float *b, __global float *c) {
            int gid = get_global_id(0);
            c[gid] = a[gid] + b[gid];
        }
        """
        program = cl.Program(ctx, kernel_code).build()

        # allocate smaller chunks to avoid exhausting GPU memory on small cards
        n = chunk_n
        a_np = _np.random.rand(n).astype(_np.float32)
        b_np = _np.random.rand(n).astype(_np.float32)
        c_np = _np.empty_like(a_np)

        mf = cl.mem_flags
        a_g = cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=a_np)
        b_g = cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=b_np)
        c_g = cl.Buffer(ctx, mf.WRITE_ONLY, c_np.nbytes)

        start = time.time()
        iterations = 0
        gpu_samples = []

        # choose global size aligned to vector length
        global_size = (n,)
        while time.time() - start < duration_seconds:
            # call the kernel multiple times per loop to keep GPU busy
            for _ in range(repeat_per_cycle):
                program.vec_add(queue, global_size, None, a_g, b_g, c_g)
            queue.finish()
            iterations += repeat_per_cycle

            # sample GPU utilization (GPUtil)
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu_samples.append(gpus[0].load * 100)
            except Exception:
                pass

        elapsed = time.time() - start
        avg_gpu = round(sum(gpu_samples) / len(gpu_samples), 2) if gpu_samples else 0.0

        # Each kernel does ~ n additions -> n ops per kernel (we count add as 1 op)
        # We approximate operations as 1 * n * iterations, but count both read+write ~2 ops:
        ops = 2 * n * iterations
        gflops = (ops / elapsed) / 1e9 if elapsed > 0 else 0.0
        return {"gpu_score": round(gflops, 4), "avg_gpu": avg_gpu, "duration": round(elapsed, 2)}

    except Exception:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}
