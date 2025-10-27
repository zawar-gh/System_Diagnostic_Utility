"""
diagnostics/utils/bottleneck_analyzer.py
Enhanced hardware bottleneck and upgrade suggestion system.
"""

import psutil
from statistics import mean


def analyze_bottlenecks(metrics: dict) -> dict:
    """
    Analyze benchmark results + system specs and detect real hardware bottlenecks.
    Pie-chart-safe: ignores untested components.
    """
    from statistics import mean

    results = {
        "overall_health": "Excellent",
        "issues": [],
        "recommendations": [],
        "component_scores": {},
        "likely_bottleneck": None,
    }

    # Extract metrics safely
    cpu_score = metrics.get("cpu_score", 0.0)
    gpu_score = metrics.get("gpu_score", 0.0)
    ram_speed = metrics.get("ram_speed_gbps", 0.0)
    disk_r = metrics.get("disk_read_speed", 0.0)
    disk_w = metrics.get("disk_write_speed", 0.0)
    disk_health = metrics.get("disk_health_percent", 100.0)
    ram_gb = metrics.get("total_ram_gb", 0.0)
    threads = metrics.get("cpu_threads", 4)
    vram = metrics.get("gpu_vram_gb", 0.0)
    temp = metrics.get("avg_temp", 0.0)
    try:
        vram = float(str(vram).split()[0])
    except Exception:
        vram = 0.0

    # -----------------------------
    # Component Scores (skip untested)
    # -----------------------------
    comp_scores = {}
    if cpu_score > 0:
        comp_scores["CPU"] = cpu_score
    if gpu_score > 0:
        comp_scores["GPU"] = gpu_score
    if ram_speed > 0:
        comp_scores["RAM"] = ram_speed * 100
    if disk_r and disk_w:
        comp_scores["Storage"] = mean([disk_r, disk_w])
    results["component_scores"] = comp_scores

    # -----------------------------
    # CPU Analysis
    # -----------------------------
    if "CPU" in comp_scores:
        if threads <= 4:
            results["issues"].append("CPU has limited threading capability (≤4 threads).")
            results["recommendations"].append("Upgrade to at least 6–8 cores for multitasking or gaming.")
            results["overall_health"] = "Moderate"
        elif cpu_score < 3000:
            results["issues"].append(f"Low CPU performance score ({cpu_score}).")
            results["recommendations"].append("Consider upgrading or checking thermal throttling.")
            results["overall_health"] = "Moderate"

    # -----------------------------
    # GPU Analysis
    # -----------------------------
    if "GPU" in comp_scores:
        if gpu_score < 50:
            results["issues"].append("Weak GPU performance detected.")
            results["recommendations"].append("Upgrade GPU or install latest drivers.")
            results["overall_health"] = "Moderate"
        if vram and vram < 4:
            results["issues"].append(f"Only {vram} GB VRAM available.")
            results["recommendations"].append("Upgrade to GPU with ≥6 GB VRAM for gaming or AI workloads.")

    # -----------------------------
    # RAM Analysis
    # -----------------------------
    if "RAM" in comp_scores:
        if ram_gb < 8:
            results["issues"].append(f"Only {ram_gb} GB RAM detected.")
            results["recommendations"].append("Upgrade to at least 8–16 GB.")
            results["overall_health"] = "Moderate"
        if ram_speed < 10:
            results["issues"].append(f"Low RAM bandwidth ({ram_speed} GB/s).")
            results["recommendations"].append("Use dual-channel DDR4/DDR5 for better throughput.")
            results["overall_health"] = "Moderate"

    # -----------------------------
    # Storage Analysis
    # -----------------------------
    if "Storage" in comp_scores:
        avg_disk_speed = comp_scores["Storage"]
        if avg_disk_speed < 200:
            results["issues"].append(f"Low disk speed (R:{disk_r} MB/s, W:{disk_w} MB/s).")
            results["recommendations"].append("Upgrade to SSD or NVMe for faster I/O.")
            results["overall_health"] = "Moderate"
        if disk_health < 70:
            results["issues"].append(f"Disk health degraded ({disk_health}%).")
            results["recommendations"].append("Backup and replace drive soon.")
            results["overall_health"] = "Poor"

    # -----------------------------
    # Temperature Analysis
    # -----------------------------
    if temp:
        if temp > 85:
            results["issues"].append(f"High system temperature detected ({temp}°C).")
            results["recommendations"].append("Clean fans, check airflow, or reapply thermal paste.")
            results["overall_health"] = "Poor"
        elif 75 < temp <= 85:
            results["recommendations"].append("System running warm; monitor cooling efficiency.")

    # -----------------------------
    # Balance Analysis (detect bottleneck)
    # -----------------------------
    if comp_scores:
        avg_score = mean(comp_scores.values())
        lowest_comp = min(comp_scores, key=comp_scores.get)
        lowest_score = comp_scores[lowest_comp]

        if lowest_score < avg_score * 0.75:
            results["likely_bottleneck"] = lowest_comp
            results["issues"].append(f"{lowest_comp} appears to be the current system bottleneck.")
            results["recommendations"].append(f"Upgrading {lowest_comp} will yield the largest performance gain.")
            results["overall_health"] = "Moderate"

    # -----------------------------
    # Summary
    # -----------------------------
    if not results["issues"]:
        results["overall_health"] = "Excellent"
        results["recommendations"].append("System is well-balanced and performing optimally.")

    return results
