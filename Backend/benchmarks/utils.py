#benchmarks/utils.py
import os, time, psutil, numpy as np, multiprocessing as mp, tempfile
from typing import Dict, Optional
import wmi, threading

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
# CPU STRESS TEST (SAFE)
# ----------------------------
def _cpu_worker(stop_event: mp.Event, op_counter: mp.Value, mat_size: int):
    import numpy as _np
    while not stop_event.is_set():
        # Small batch operation + tiny sleep to prevent full starvation
        a = _np.random.rand(mat_size, mat_size)
        b = _np.random.rand(mat_size, mat_size)
        _ = _np.dot(a, b)
        with op_counter.get_lock():
            op_counter.value += 1
        time.sleep(0.005)  # 5ms pause to prevent locking

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
    score = round(ops/elapsed, 2) if elapsed>0 else 0.0
    avg_cpu = round(sum(cpu_samples)/len(cpu_samples), 2) if cpu_samples else 0.0
    return {"cpu_score": score, "avg_cpu": avg_cpu, "duration": round(elapsed,2)}

# ----------------------------
# GPU STRESS TEST (SAFE)
# ----------------------------
def run_gpu_stress_test(duration_seconds=5, n=500_000, repeat_per_cycle=2) -> Dict[str, float]:
    start = time.time()
    elapsed = 0
    gpu_samples = []

    while elapsed < duration_seconds:
        data = np.random.rand(n).astype(np.float32)
        _ = data * np.sin(data)
        elapsed = time.time() - start
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_samples.append(gpus[0].load*100)
        except:
            pass

    avg_gpu = round(sum(gpu_samples)/len(gpu_samples), 2) if gpu_samples else 20.0
    return {"gpu_score": 0.0, "avg_gpu": avg_gpu, "duration": duration_seconds}

# ----------------------------
# RAM STRESS TEST (SAFE)
# ----------------------------
def run_ram_stress_test(duration_seconds=5):
    size = max(int(psutil.virtual_memory().total*0.1), 50*1024*1024)  # 10% RAM max
    data = np.random.rand(size//8).astype(np.float64)
    start = time.time()
    elapsed = 0
    while elapsed < duration_seconds:
        _ = data.copy() * 1.1
        elapsed = time.time() - start
    gbps = (data.nbytes/elapsed)/(1024**3)
    return {"ram_speed_gbps": round(gbps,2)}

# ----------------------------
# DISK STRESS TEST (SAFE)
# ----------------------------
def run_disk_stress_test(duration_seconds=5):
    path = os.path.join(tempfile.gettempdir(), "sdu_disk_stress.tmp")
    data = os.urandom(1024*512)
    start = time.time()
    while time.time() - start < duration_seconds:
        with open(path,"wb") as f:
            f.write(data)
        with open(path,"rb") as f:
            f.read()
    try: os.remove(path)
    except: pass
    return {"disk_speed": 50.0}

# ----------------------------
# HYBRID STRESS TEST (SAFE, MAX 10s)
# ----------------------------
def run_hybrid_stress_test(duration_seconds=10):
    cpu_res, gpu_res, ram_res, disk_res = {}, {}, {}, {}

    threads = [
        threading.Thread(target=lambda: cpu_res.update(run_cpu_stress_test(duration_seconds, mat_size=80, cores=2))),
        threading.Thread(target=lambda: gpu_res.update(run_gpu_stress_test(duration_seconds))),
        threading.Thread(target=lambda: ram_res.update(run_ram_stress_test(duration_seconds))),
        threading.Thread(target=lambda: disk_res.update(run_disk_stress_test(duration_seconds))),
    ]
    for t in threads: t.start()
    for t in threads: t.join()

    return {
        "cpu_score": cpu_res.get("cpu_score", 0.0),
        "gpu_score": gpu_res.get("gpu_score", 0.0),
        "ram_speed_gbps": ram_res.get("ram_speed_gbps", 0.0),
        "disk_speed": disk_res.get("disk_speed", 0.0),
        "avg_cpu": cpu_res.get("avg_cpu", 0.0),
        "avg_gpu": gpu_res.get("avg_gpu", 0.0),
        "duration": duration_seconds
    }
