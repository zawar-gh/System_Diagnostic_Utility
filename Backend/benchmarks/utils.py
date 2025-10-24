# benchmarks/utils.py
import time
import psutil
from typing import List, Dict, Optional

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
                # choose first entry current temperature
                return round(temps[key][0].current, 2)
        # if any sensor present, pick the first temperature available:
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
        # load is 0..1 -> convert to percentage
        gpu_percent = round(gpu.load * 100, 2)
        vram_total = int(gpu.memoryTotal) if hasattr(gpu, "memoryTotal") and gpu.memoryTotal else None
        return {"gpu_percent": gpu_percent, "vram_total_mb": vram_total}
    except Exception:
        return {"gpu_percent": None, "vram_total_mb": None}

def run_samples(duration_seconds: int = 60, sample_count: int = 3, sample_interval: Optional[int] = None) -> List[Dict]:
    """
    Collect `sample_count` evenly spaced samples over duration_seconds.
    If sample_interval provided, uses that seconds between samples.
    Returns list of metrics objects: {"time": t, "cpu": cpu%, "gpu": gpu%, "temp": temp}
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
        # normalize None -> use 0 for usage (frontend expects numbers)
        metrics.append({
            "time": tpoint,
            "cpu": cpu if cpu is not None else 0.0,
            "gpu": gpu_percent if gpu_percent is not None else 0.0,
            "temp": temp if temp is not None else 0.0
        })
        if i < sample_count - 1:
            time.sleep(sample_interval)
    return metrics

import numpy as np

def run_cpu_stress_test(duration_seconds: int = 10) -> Dict[str, float]:
    """
    Run a CPU stress test for given duration.
    Performs repeated matrix multiplications to stress CPU cores.
    Returns performance score (operations/sec) and average CPU utilization.
    """
    start_time = time.time()
    operation_count = 0
    cpu_usage_samples = []

    while time.time() - start_time < duration_seconds:
        # Generate random matrices (size 300x300 for balanced stress)
        a = np.random.rand(300, 300)
        b = np.random.rand(300, 300)
        np.dot(a, b)
        operation_count += 1

        # Capture instantaneous CPU load
        cpu_usage_samples.append(psutil.cpu_percent(interval=0.1))

    elapsed = time.time() - start_time
    avg_cpu = round(sum(cpu_usage_samples) / len(cpu_usage_samples), 2)
    score = round(operation_count / elapsed, 2)

    return {
        "cpu_score": score,
        "avg_cpu": avg_cpu,
        "duration": round(elapsed, 2)
    }
def run_gpu_stress_test(duration_seconds: int = 10) -> Dict[str, float]:
    """
    Run a GPU stress test using OpenCL parallel computation.
    Returns GFLOPs/sec (approx) and average GPU utilization.
    Falls back to 0 if no OpenCL device is found.
    """
    if not GPUtil:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

    try:
        import pyopencl as cl
        import numpy as np
    except Exception:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

    try:
        # Initialize OpenCL context (use first available GPU)
        platforms = cl.get_platforms()
        devices = [d for p in platforms for d in p.get_devices(device_type=cl.device_type.GPU)]
        if not devices:
            return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}

        ctx = cl.Context(devices)
        queue = cl.CommandQueue(ctx)

        # Kernel: simple vector add (lightweight compute kernel)
        kernel_code = """
        __kernel void vec_add(__global const float *a, __global const float *b, __global float *c) {
            int gid = get_global_id(0);
            c[gid] = a[gid] + b[gid];
        }
        """
        program = cl.Program(ctx, kernel_code).build()

        n = 10_000_000  # vector length
        a_np = np.random.rand(n).astype(np.float32)
        b_np = np.random.rand(n).astype(np.float32)
        c_np = np.empty_like(a_np)

        mf = cl.mem_flags
        a_g = cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=a_np)
        b_g = cl.Buffer(ctx, mf.READ_ONLY | mf.COPY_HOST_PTR, hostbuf=b_np)
        c_g = cl.Buffer(ctx, mf.WRITE_ONLY, c_np.nbytes)

        # Run continuous vector adds for duration
        start_time = time.time()
        iterations = 0
        gpu_usage_samples = []

        while time.time() - start_time < duration_seconds:
            program.vec_add(queue, a_np.shape, None, a_g, b_g, c_g)
            queue.finish()
            iterations += 1

            # sample GPU usage using GPUtil
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu_usage_samples.append(gpus[0].load * 100)
            except Exception:
                pass

        elapsed = time.time() - start_time
        avg_gpu = round(sum(gpu_usage_samples) / len(gpu_usage_samples), 2) if gpu_usage_samples else 0.0

        # Each iteration ~ 2 * n operations (one add per element)
        gflops = (2 * n * iterations) / (elapsed * 1e9)
        return {"gpu_score": round(gflops, 4), "avg_gpu": avg_gpu, "duration": round(elapsed, 2)}

    except Exception:
        return {"gpu_score": 0.0, "avg_gpu": 0.0, "duration": duration_seconds}
