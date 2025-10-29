# benchmarks/utils.py
import os
import time
import tempfile
import threading
import multiprocessing as mp
from typing import Dict, Optional

import numpy as np
import psutil
import wmi

# Optional GPU libs
try:
    import GPUtil
except Exception:
    GPUtil = None

try:
    import pyopencl as cl
except Exception:
    cl = None

# ----------------------------
# SYSTEM METRICS HELPERS
# ----------------------------
def get_cpu_temp() -> Optional[float]:
    try:
        w = wmi.WMI(namespace="root\\wmi")
        temps = w.MSAcpi_ThermalZoneTemperature()
        if temps:
            return round((temps[0].CurrentTemperature / 10.0 - 273.15), 1)
    except Exception:
        pass
    return None

def get_gpu_temp() -> Optional[float]:
    if GPUtil:
        try:
            gpus = GPUtil.getGPUs()
            if gpus and hasattr(gpus[0], "temperature"):
                return float(gpus[0].temperature)
        except Exception:
            pass
    return None

# ----------------------------
# CPU STRESS TEST
# ----------------------------
def _cpu_worker(stop_event: mp.Event, op_counter: mp.Value, mat_size: int):
    import numpy as _np
    # Worker loop: heavy matrix multiply
    while not stop_event.is_set():
        a = _np.random.rand(mat_size, mat_size)
        b = _np.random.rand(mat_size, mat_size)
        _ = _np.dot(a, b)
        with op_counter.get_lock():
            op_counter.value += 1
        # tiny sleep yields so sampling is meaningful
        time.sleep(0.005)

def run_cpu_stress_test(duration_seconds=5, mat_size=100, cores=None) -> Dict[str, float]:
    """
    Spawns CPU worker processes and samples CPU utilization.
    Returns cpu_score (ops/sec), avg_cpu (%), cpu_temp (if available), duration.
    """
    cores = cores or max(1, psutil.cpu_count(logical=True) // 2)
    stop_event = mp.Event()
    op_counter = mp.Value('L', 0)
    workers = []

    for _ in range(cores):
        p = mp.Process(target=_cpu_worker, args=(stop_event, op_counter, mat_size), daemon=True)
        p.start()
        workers.append(p)

    cpu_samples = []

    # Warm-up to let processes ramp up and avoid low initial samples
    warmup = 0.6
    start = time.time()
    time.sleep(warmup)

    while time.time() - start < duration_seconds:
        # non-blocking sample then short sleep for responsiveness
        cpu_samples.append(psutil.cpu_percent(interval=0.35))

    stop_event.set()
    for p in workers:
        p.join(timeout=1)
        if p.is_alive():
            p.terminate()

    elapsed = time.time() - start
    ops = op_counter.value
    score = round(ops / elapsed, 2) if elapsed > 0 else 0.0
    avg_cpu = round(sum(cpu_samples) / len(cpu_samples), 2) if cpu_samples else 0.0
    cpu_temp = get_cpu_temp()

    return {
        "cpu_score": score,
        "avg_cpu": avg_cpu,
        "cpu_temp": cpu_temp,
        "duration": round(elapsed, 2),
    }

# ----------------------------
# GPU STRESS TEST WITH OpenCL/dGPU fallback
# ----------------------------
def run_gpu_stress_test(duration_seconds=5, n=2_000_000) -> Dict[str, float]:
    """
    Attempts:
     1) Use GPUtil to detect dedicated GPUs (NVIDIA/AMD). If GPUtil reports a dGPU, sample its load.
     2) If GPUtil is absent or reports an integrated GPU, if pyopencl is available try a small OpenCL kernel
        to actually exercise non-NVIDIA GPUs (AMD/Intel) and sample via GPUtil where available.
     3) If OpenCL/GPU sampling isn't available, approximate iGPU activity via CPU utilisation samples.
    Returns gpu_score (scaled), avg_gpu (%), integrated flag, duration, and optional error.
    """
    avg_gpu_samples = []
    avg_cpu_samples = []
    is_integrated = False
    cl_ctx_created = False
    cl_ctx_objects = None
    start = time.time()

    try:
        # Detect GPU type if GPUtil available
        if GPUtil:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_name = (gpus[0].name or "").lower()
                if any(x in gpu_name for x in ["intel", "vega", "radeon", "apu", "uhd", "iris"]):
                    is_integrated = True
                else:
                    is_integrated = False
            else:
                # No GPUtil-reported GPUs -> likely integrated or unsupported vendor
                is_integrated = True
        else:
            is_integrated = True

        # Prepare OpenCL context once (for non-NVIDIA dGPUs or Intel/AMD with OpenCL)
        if cl and not is_integrated:
            try:
                platforms = cl.get_platforms()
                if platforms:
                    dev = platforms[0].get_devices()[0]
                    ctx = cl.Context([dev])
                    queue = cl.CommandQueue(ctx)
                    # build small kernel once
                    prg = cl.Program(ctx, """
                    __kernel void stress(__global float *a) {
                        int gid = get_global_id(0);
                        a[gid] = a[gid] * sin(a[gid]);
                    }
                    """).build()
                    cl_ctx_created = True
                    cl_ctx_objects = (ctx, queue, prg)
            except Exception:
                cl_ctx_created = False
                cl_ctx_objects = None

        # --- Stress Loop ---
        while time.time() - start < duration_seconds:
            # quick local compute to keep loop active (non-blocking)
            _local = np.random.rand(min(n, 200_000)).astype(np.float32)
            _ = np.sin(_local) * np.sqrt(_local)

            if not is_integrated:
                # If we have OpenCL context, try to enqueue a kernel to exercise GPU
                if cl_ctx_created and cl_ctx_objects:
                    try:
                        ctx, queue, prg = cl_ctx_objects
                        big = np.random.rand(256_000).astype(np.float32)
                        mf = cl.mem_flags
                        buf = cl.Buffer(ctx, mf.READ_WRITE | mf.COPY_HOST_PTR, hostbuf=big)
                        prg.stress(queue, big.shape, None, buf)
                        cl.enqueue_copy(queue, big, buf)
                    except Exception:
                        pass

                # Sample dGPU utilization via GPUtil if possible
                if GPUtil:
                    try:
                        gpus = GPUtil.getGPUs()
                        if gpus:
                            avg_gpu_samples.append(gpus[0].load * 100)
                    except Exception:
                        pass

                # keep loop responsive
                time.sleep(0.05)
            else:
                # integrated GPU: approximate with quick CPU samples
                avg_cpu_samples.append(psutil.cpu_percent(interval=0.18))
                time.sleep(0.03)

        # --- Scoring ---
        if is_integrated:
            avg_cpu = sum(avg_cpu_samples) / len(avg_cpu_samples) if avg_cpu_samples else 20.0
            # heuristic: a portion of CPU stress maps to observable iGPU work
            avg_gpu = avg_cpu * 0.65
        else:
            avg_gpu = sum(avg_gpu_samples) / len(avg_gpu_samples) if avg_gpu_samples else 10.0

        gpu_score = round(float(avg_gpu) * 10.0, 2)
        elapsed = time.time() - start
        gpu_temp = get_gpu_temp()

        return {
            "gpu_score": gpu_score,
            "avg_gpu": round(avg_gpu, 2),
            "integrated": is_integrated,
            "gpu_temp": gpu_temp,
            "duration": round(elapsed, 2),
        }

    except Exception as e:
        elapsed = time.time() - start
        return {
            "gpu_score": 200.0,
            "avg_gpu": 20.0,
            "integrated": True,
            "error": str(e),
            "duration": round(elapsed, 2),
        }

# ----------------------------
# RAM STRESS TEST
# ----------------------------
def run_ram_stress_test(duration_seconds=5):
    """
    Allocates a fraction of available memory (safer than total) and performs repeated in-place ops and copies.
    Returns ram_speed_gbps (GB/s) and duration.
    """
    import numpy as _np

    available = psutil.virtual_memory().available
    # Use up to 15% of currently available memory, cap to ~800MB
    target_bytes = min(int(available * 0.15), 800_000_000)
    # Ensure we allocate at least a small buffer
    if target_bytes < 10_000_000:
        target_bytes = min(int(psutil.virtual_memory().total * 0.05), 10_000_000)

    arr = _np.random.rand(max(1, target_bytes // 8)).astype(_np.float64)

    start = time.time()
    ops = 0
    while time.time() - start < duration_seconds:
        arr *= 1.0001
        _ = arr.copy()
        ops += 1
        # small sleep to reduce thrash on low-memory systems
        time.sleep(0.02)

    elapsed = time.time() - start
    total_bytes = arr.nbytes * ops * 2  # read + write per loop
    ram_speed_gbps = (total_bytes / elapsed) / (1024 ** 3) if elapsed > 0 else 0.0

    return {
        "ram_speed_gbps": round(ram_speed_gbps, 2),
        "duration": round(elapsed, 2),
    }

# ----------------------------
# DISK STRESS TEST
# ----------------------------
def run_disk_stress_test(duration_seconds=5):
    """
    Repeated small writes and reads to a temp file.
    Use flush+fsync to measure on-disk write speed rather than just OS cache.
    """
    path = os.path.join(tempfile.gettempdir(), "sdu_disk_stress.tmp")
    # 512 KiB buffer; increases realism but keeps memory small
    data = os.urandom(1024 * 512)
    start_total = time.time()
    read_speeds, write_speeds = [], []

    while time.time() - start_total < duration_seconds:
        # Write + flush+fsync
        try:
            start = time.time()
            with open(path, "wb") as f:
                f.write(data)
                f.flush()
                try:
                    os.fsync(f.fileno())
                except Exception:
                    # fsync may not be permitted in some environments; ignore
                    pass
            write_speeds.append(len(data) / (time.time() - start) / 1024 / 1024)
        except Exception:
            # if write fails, still continue sampling
            pass

        # Read
        try:
            start = time.time()
            with open(path, "rb") as f:
                _ = f.read()
            read_speeds.append(len(data) / (time.time() - start) / 1024 / 1024)
        except Exception:
            pass

    try:
        os.remove(path)
    except Exception:
        pass

    avg_read = sum(read_speeds) / len(read_speeds) if read_speeds else 0.0
    avg_write = sum(write_speeds) / len(write_speeds) if write_speeds else 0.0
    disk_speed = round((avg_read + avg_write) / 2, 2)

    return {
        "disk_speed": disk_speed,
        "read_mbps": round(avg_read, 2),
        "write_mbps": round(avg_write, 2),
        "duration": round(time.time() - start_total, 2),
    }

# ----------------------------
# FULL SYSTEM HYBRID TEST (robust)
# ----------------------------
def run_hybrid_stress_test(duration_seconds=5):
    """
    Concurrently run CPU, GPU, RAM, and Disk tests in threads and combine results.
    Returns granular subsystem results plus an overall_score (normalized heuristic).
    """
    results = {}
    lock = threading.Lock()

    def run_cpu_thread():
        r = run_cpu_stress_test(duration_seconds)
        with lock:
            results["cpu"] = r

    def run_gpu_thread():
        r = run_gpu_stress_test(duration_seconds)
        with lock:
            results["gpu"] = r

    def run_ram_thread():
        r = run_ram_stress_test(duration_seconds)
        with lock:
            results["ram"] = r

    def run_disk_thread():
        r = run_disk_stress_test(duration_seconds)
        with lock:
            results["disk"] = r

    threads = [
        threading.Thread(target=run_cpu_thread),
        threading.Thread(target=run_gpu_thread),
        threading.Thread(target=run_ram_thread),
        threading.Thread(target=run_disk_thread),
    ]

    for t in threads:
        t.start()
    for t in threads:
        t.join()

    cpu = results.get("cpu", {})
    gpu = results.get("gpu", {})
    ram = results.get("ram", {})
    disk = results.get("disk", {})

    cpu_score = cpu.get("cpu_score", 0)
    gpu_score = gpu.get("gpu_score", 0)
    ram_speed = ram.get("ram_speed_gbps", 0)
    disk_speed = disk.get("disk_speed", 0)

    # Heuristic weights:
    # - Give dedicated GPU more weight if detected
    weight_gpu = 1.4 if not gpu.get("integrated", True) else 1.0
    # Normalize and combine — tune these multipliers as you like
    overall_score = round(cpu_score + gpu_score * weight_gpu + ram_speed * 45 + disk_speed * 0.2, 2)

    return {
        "cpu_score": cpu_score,
        "gpu_score": gpu_score,
        "ram_speed_gbps": ram_speed,
        "disk_speed": disk_speed,
        "avg_cpu": cpu.get("avg_cpu", 0),
        "avg_gpu": gpu.get("avg_gpu", 0),
        "integrated_gpu": gpu.get("integrated", None),
        "subsystem_details": {
            "cpu": cpu,
            "gpu": gpu,
            "ram": ram,
            "disk": disk,
        },
        "overall_score": overall_score,
        "duration": duration_seconds,
    }
