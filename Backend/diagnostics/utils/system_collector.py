import psutil, platform, cpuinfo, wmi

def get_system_info():
    try:
        system_info = {
            "os": platform.system(),
            "os_version": platform.version(),
            "processor": cpuinfo.get_cpu_info().get('brand_raw', 'Unknown'),
            "cpu_cores": psutil.cpu_count(logical=False),
            "cpu_threads": psutil.cpu_count(logical=True),
            "total_ram_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "disk_total_gb": round(psutil.disk_usage('/').total / (1024 ** 3), 2),
            "gpu_info": [],
        }

        # Use WMI for GPU info (works on Windows for Intel, AMD, NVIDIA)
        try:
            w = wmi.WMI()
            for gpu in w.Win32_VideoController():
                system_info["gpu_info"].append({
                    "name": gpu.Name,
                    "driver_version": gpu.DriverVersion,
                    "video_processor": gpu.VideoProcessor,
                    "memory_gb": round(int(gpu.AdapterRAM) / (1024 ** 3), 2) if gpu.AdapterRAM else None,
                })
        except Exception as gpu_err:
            system_info["gpu_info"] = [{"error": str(gpu_err)}]

        return system_info
    except Exception as e:
        return {"error": str(e)}
