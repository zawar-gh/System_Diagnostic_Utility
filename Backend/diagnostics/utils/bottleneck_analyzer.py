#diagnostics/util/bottleneck_calculator
def analyze_bottlenecks(system_info):
    """
    Analyze system specs and detect basic hardware bottlenecks.
    """

    results = {
        "overall_health": "Good",
        "issues": [],
        "recommendations": [],
    }

    cpu_threads = system_info.get("cpu_threads", 0)
    total_ram = system_info.get("total_ram_gb", 0)
    gpu_list = system_info.get("gpu_info", [])
    disk_total = system_info.get("disk_total_gb", 0)

    # --- CPU Analysis ---
    if cpu_threads <= 4:
        results["issues"].append("CPU has limited multithreading capability.")
        results["recommendations"].append("Consider upgrading to a 6+ core / 12-thread processor.")
        results["overall_health"] = "Moderate"

    # --- RAM Analysis ---
    if total_ram < 8:
        results["issues"].append(f"Only {total_ram} GB RAM detected.")
        results["recommendations"].append("Upgrade to at least 8 GB for general use or 16 GB for gaming/editing.")
        results["overall_health"] = "Moderate"

    # --- GPU Analysis ---
    if not gpu_list:
        results["issues"].append("No dedicated GPU detected.")
        results["recommendations"].append("Install a dedicated GPU for gaming, rendering or AI workloads.")
        results["overall_health"] = "Moderate"
    else:
        for gpu in gpu_list:
            mem = gpu.get("memory_gb", 0)
            name = gpu.get("name", "Unknown GPU")
            if mem and mem < 4:
                results["issues"].append(f"{name} has only {mem} GB VRAM.")
                results["recommendations"].append("Consider upgrading to a GPU with 6–8 GB VRAM.")
                results["overall_health"] = "Moderate"

    # --- Storage Analysis ---
    if disk_total < 128:
        results["issues"].append("Total storage below 128 GB.")
        results["recommendations"].append("Use an SSD or larger drive for better performance.")
        results["overall_health"] = "Poor"

    # --- Final Verdict ---
    if not results["issues"]:
        results["overall_health"] = "Excellent"

    return results
