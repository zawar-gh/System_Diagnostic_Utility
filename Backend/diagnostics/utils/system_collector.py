#diagnostics/utils/system_collector.py
import psutil, platform, cpuinfo, wmi, pythoncom

def format_value(value, unit=None):
    """Helper to format numeric values with units or handle missing ones."""
    if value in (None, "", "Unknown", "Standard"):
        return "Standard"

    try:
        if isinstance(value, (int, float)):
            if unit:
                # Format floats with 2 decimals when needed
                return f"{value:.2f}{unit}" if isinstance(value, float) else f"{value}{unit}"
            return str(value)
        return str(value)
    except Exception:
        return "Standard"


def get_system_info():
    try:
        # Initialize COM for WMI safely
        pythoncom.CoInitialize()

        cpu_usage = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        system_info = {
            "os": {
                "name": platform.system() or "Standard",
                "version": platform.version() or "Standard",
                "build": platform.release() or "Standard",
            },
            "cpu": {
                "model": cpuinfo.get_cpu_info().get('brand_raw', 'Standard'),
                "cores": psutil.cpu_count(logical=False) or "Standard",
                "threads": psutil.cpu_count(logical=True) or "Standard",
                "usage": format_value(cpu_usage, "%"),
            },
            "gpu": {},
            "ram": {
                "total": format_value(round(ram.total / (1024 ** 3), 2), " GB") if ram.total else "Standard",
                "usage": format_value(ram.percent, "%"),
                "speed": "Standard",
            },
            "storage": {
                "type": "Standard",
                "size": format_value(round(disk.total / (1024 ** 3), 2), " GB") if disk.total else "Standard",
                "usage": format_value(disk.percent, "%"),
            },
        }

        # --- GPU Info (Safe WMI Call) ---
        try:
            wmi_obj = wmi.WMI()
            gpu_list = wmi_obj.Win32_VideoController()
            if gpu_list:
                gpu = gpu_list[0]

                def safe_get(attr):
                    val = getattr(gpu, attr, None)
                    return val if val not in (None, "", 0, "Unknown") else "Standard"

                vram_value = None
                try:
                    if getattr(gpu, "AdapterRAM", None):
                        vram_value = round(int(gpu.AdapterRAM) / (1024 ** 3), 2)
                except Exception:
                    vram_value = "Standard"

                system_info["gpu"] = {
                    "model": safe_get("Name"),
                    "vram": format_value(vram_value, " GB"),
                    "driver_version": safe_get("DriverVersion"),
                    "status": safe_get("Status"),
                    "utilization": format_value(0, "%"),
                }
            else:
                system_info["gpu"] = {
                    "model": "Integrated GPU",
                    "vram": "Standard",
                    "driver_version": "Standard",
                    "status": "Standard",
                    "utilization": format_value(0, "%"),
                }

        except Exception:
            system_info["gpu"] = {
                "model": "Integrated GPU",
                "vram": "Standard",
                "driver_version": "Standard",
                "status": "Standard",
                "utilization": format_value(0, "%"),
            }

        return system_info

    except Exception as e:
        return {"error": str(e)}

    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass
