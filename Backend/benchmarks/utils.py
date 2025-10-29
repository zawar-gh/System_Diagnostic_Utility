#benchmarks/utils.py
import os, time, psutil, numpy as np, multiprocessing as mp, tempfile, threading
from typing import Dict, Optional
import wmi

# Optional GPU libs
try:
    import GPUtil
except:
    GPUtil = None

try:
    import pyopencl as cl
except:
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
    except:
        pass
    return None

def get_gpu_temp() -> Optional[float]:
    if GPUtil:
        try:
            gpus = GPUtil.getGPUs()
            if gpus and hasattr(gpus[0], "temperature"):
                return float(gpus[0].temperature)
        except:
            pass
    return None

# ----------------------------
# CPU STRESS TEST
# ----------------------------
def _cpu_worker(stop_event: mp.Event, op_counter: mp.Value, mat_size: int):
    import numpy as _np
    while not stop_event.is_set():
        a = _np.random.rand(mat_size, mat_size)
        b = _np.random.rand(mat_size, mat_size)
        _ = _np.dot(a, b)
        with op_counter.get_lock():
            op_counter.value += 1
        time.sleep(0.005)

def run_cpu_stress_test(duration_seconds=5, mat_size=100, cores=None) -> Dict[str, float]:
    cores = cores or max(1, psutil.cpu_count(logical=True)//2)
    stop_event = mp.Event()
    op_counter = mp.Value('L', 0)
    workers = []

    for _ in range(cores):
        p = mp.Process(target=_cpu_worker, args=(stop_event, op_counter, mat_size), daemon=True)
        p.start()
        workers.append(p)

    cpu_samples = []
    start = time.time()
    while time.time() - start < duration_seconds:
        cpu_samples.append(psutil.cpu_percent(interval=0.5))
    stop_event.set()
    for p in workers:
        p.join(timeout=1)
        if p.is_alive():
            p.terminate()

    elapsed = time.time() - start
    ops = op_counter.value
    score = round(ops / elapsed, 2)
    avg_cpu = round(sum(cpu_samples) / len(cpu_samples), 2) if cpu_samples else 0.0
    return {"cpu_score": score, "avg_cpu": avg_cpu, "duration": round(elapsed,2)}

# ----------------------------
# GPU STRESS TEST WITH OpenCL (robust)
# ----------------------------
def run_gpu_stress_test(duration_seconds=5, n=2_000_000) -> Dict[str, float]:
    avg_gpu_samples = []

    try:
        if cl:
            platforms = cl.get_platforms()
            if platforms:
                device = platforms[0].get_devices()[0]
                ctx = cl.Context([device])
                queue = cl.CommandQueue(ctx)
                mf = cl.mem_flags

                host_data = np.random.rand(n).astype(np.float32)
                buf = cl.Buffer(ctx, mf.READ_WRITE | mf.COPY_HOST_PTR, hostbuf=host_data)

                prg = cl.Program(ctx, """
                __kernel void stress(__global float *a) {
                    int gid = get_global_id(0);
                    a[gid] = a[gid] * sin(a[gid]);
                }
                """).build()

                start = time.time()
                while time.time() - start < duration_seconds:
                    prg.stress(queue, host_data.shape, None, buf)
                    cl.enqueue_copy(queue, host_data, buf)
                    if GPUtil:
                        gpus = GPUtil.getGPUs()
                        if gpus: avg_gpu_samples.append(gpus[0].load*100)
        else:
            raise Exception("OpenCL not available")
    except Exception:
        # Fallback CPU simulation
        start = time.time()
        while time.time() - start < duration_seconds:
            data = np.random.rand(n).astype(np.float32)
            _ = data * np.sin(data)
            if GPUtil:
                gpus = GPUtil.getGPUs()
                if gpus: avg_gpu_samples.append(gpus[0].load*100)

    avg_gpu = round(sum(avg_gpu_samples)/len(avg_gpu_samples),2) if avg_gpu_samples else 20.0
    gpu_score = round(avg_gpu * 10,2)
    return {"gpu_score": gpu_score, "avg_gpu": avg_gpu, "duration": duration_seconds}


# ----------------------------
# RAM STRESS TEST
# ----------------------------
def run_ram_stress_test(duration_seconds=5):
    import numpy as np, time, psutil

    # Allocate ~20% of total RAM but cap at 1 GB
    total_mem = psutil.virtual_memory().total
    size = min(int(total_mem * 0.2), 1_000_000_000)
    arr = np.random.rand(size // 8).astype(np.float64)

    start = time.time()
    ops = 0
    while time.time() - start < duration_seconds:
        # In-place modify and copy — simulates read+write traffic
        arr *= 1.0001
        arr2 = arr.copy()
        ops += 1

    elapsed = time.time() - start
    total_bytes = arr.nbytes * ops * 2  # read + write per loop
    ram_speed_gbps = (total_bytes / elapsed) / (1024 ** 3)
    return {"ram_speed_gbps": round(ram_speed_gbps, 2)}

# ----------------------------
# DISK STRESS TEST
# ----------------------------
def run_disk_stress_test(duration_seconds=5):
    path = os.path.join(tempfile.gettempdir(), "sdu_disk_stress.tmp")
    data = os.urandom(1024*512)
    start_total = time.time()
    read_speeds, write_speeds = [], []

    while time.time() - start_total < duration_seconds:
        start = time.time()
        with open(path,"wb") as f: f.write(data)
        write_speeds.append(len(data)/(time.time()-start)/1024/1024)

        start = time.time()
        with open(path,"rb") as f: f.read()
        read_speeds.append(len(data)/(time.time()-start)/1024/1024)

    try: os.remove(path)
    except: pass
    disk_speed = round((sum(read_speeds)/len(read_speeds) + sum(write_speeds)/len(write_speeds))/2, 2)
    return {"disk_speed": disk_speed}

# ----------------------------
# FULL SYSTEM HYBRID TEST (robust)
# ----------------------------
def run_hybrid_stress_test(duration_seconds=5):
    """
    True concurrent system stress test — CPU, GPU, RAM, and Disk.
    Each runs in a dedicated thread and returns combined metrics.
    Thread-safe and waits for all subsystems to complete.
    """
    results = {}
    lock = threading.Lock()

    def run_cpu():
        r = run_cpu_stress_test(duration_seconds)
        with lock:
            results["cpu"] = r

    def run_gpu():
        r = run_gpu_stress_test(duration_seconds)
        with lock:
            results["gpu"] = r

    def run_ram():
        r = run_ram_stress_test(duration_seconds)
        with lock:
            results["ram"] = r

    def run_disk():
        r = run_disk_stress_test(duration_seconds)
        with lock:
            results["disk"] = r

    threads = [
        threading.Thread(target=run_cpu),
        threading.Thread(target=run_gpu),
        threading.Thread(target=run_ram),
        threading.Thread(target=run_disk),
    ]

    # Start + join threads
    for t in threads: t.start()
    for t in threads: t.join()

    # Extract safely
    cpu = results.get("cpu", {})
    gpu = results.get("gpu", {})
    ram = results.get("ram", {})
    disk = results.get("disk", {})

    cpu_score = cpu.get("cpu_score", 0)
    gpu_score = gpu.get("gpu_score", 0)
    ram_speed = ram.get("ram_speed_gbps", 0)
    disk_speed = disk.get("disk_speed", 0)

    overall_score = round(cpu_score + gpu_score + ram_speed * 50 + disk_speed * 0.2, 2)

    return {
        "cpu_score": cpu_score,
        "gpu_score": gpu_score,
        "ram_speed_gbps": ram_speed,
        "disk_speed": disk_speed,
        "avg_cpu": cpu.get("avg_cpu", 0),
        "avg_gpu": gpu.get("avg_gpu", 0),
        "overall_score": overall_score,
        "duration": duration_seconds,
    }
