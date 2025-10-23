import psutil, platform, cpuinfo, wmi

def get_system_info():
    try:
        cpu_usage = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        system_info = {
            "os": {
                "name": platform.system(),
                "version": platform.version(),
                "build": platform.release()
            },
            "cpu": {
                "model": cpuinfo.get_cpu_info().get('brand_raw', 'Unknown'),
                "cores": psutil.cpu_count(logical=False),
                "threads": psutil.cpu_count(logical=True),
                "usage": cpu_usage
            },
            "gpu": {},  # will fill below
            "ram": {
                "total": round(ram.total / (1024 ** 3), 2),
                "usage": ram.percent,
                "speed": "Unknown"  # psutil cannot get speed; optional
            },
            "storage": {
                "type": "Unknown",  # Optional, could detect SSD/HDD
                "size": round(disk.total / (1024 ** 3), 2),
                "usage": disk.percent
            }
        }

        # GPU info (first GPU only)
        try:
            wmi_obj = wmi.WMI()
            gpu_list = wmi_obj.Win32_VideoController()
            if gpu_list:
                gpu = gpu_list[0]
                system_info["gpu"] = {
                    "model": gpu.Name,
                    "vram": round(int(gpu.AdapterRAM)/(1024**3),2) if gpu.AdapterRAM else None,
                    "utilization": 0  # real-time usage requires additional monitoring
                }
        except Exception as gpu_err:
            system_info["gpu"] = {"error": str(gpu_err)}

        return system_info
    except Exception as e:
        return {"error": str(e)}
