"""
diagnostics/utils/bottleneck_analyzer.py
Enhanced hardware bottleneck and upgrade suggestion system.
"""

from statistics import mean


def analyze_bottlenecks(metrics: dict) -> dict:
    """
    Analyze benchmark results + system specs and detect hardware bottlenecks.
    Designed for safe integration with frontend pie-chart visualizations.
    """

    results = {
        "overall_health": "Excellent",
        "issues": [],
        "recommendations": [],
        "component_scores": {},
        "likely_bottleneck": None,
    }

    # --- Extract metrics safely ---
    cpu_score = float(metrics.get("cpu_score", 0))
    gpu_score = float(metrics.get("gpu_score", 0))
    ram_speed = float(metrics.get("ram_speed_gbps", 0))
    disk_r = float(metrics.get("disk_read_speed", 0))
    disk_w = float(metrics.get("disk_write_speed", 0))
    disk_health = float(metrics.get("disk_health_percent", 100))
    ram_gb = float(metrics.get("total_ram_gb", 0))
    threads = int(metrics.get("cpu_threads", 4))
    vram = float(str(metrics.get("gpu_vram_gb", 0)).split()[0])
    temp = float(metrics.get("avg_temp", 0))

    # --- Component Scores ---
    comp_scores = {}
    if cpu_score > 0:
        comp_scores["CPU"] = cpu_score
    if gpu_score > 0:
        comp_scores["GPU"] = gpu_score
    if ram_speed > 0:
        comp_scores["RAM"] = ram_speed * 100  # normalize
    if disk_r and disk_w:
        comp_scores["Storage"] = mean([disk_r, disk_w])
    results["component_scores"] = comp_scores

    # Helper to lower health status only if it's not already worse
    def downgrade_health(level: str):
        order = ["Excellent", "Moderate", "Poor"]
        if order.index(level) > order.index(results["overall_health"]):
            results["overall_health"] = level

    # -----------------------------
    # CPU Analysis
    # -----------------------------
    if "CPU" in comp_scores:
        if threads <= 4:
            results["issues"].append("Limited threading capability (≤4 threads).")
            results["recommendations"].append("Upgrade to at least 6–8 cores for better multitasking.")
            downgrade_health("Moderate")
        if cpu_score < 2500:
            results["issues"].append(f"Low CPU benchmark score ({cpu_score}).")
            results["recommendations"].append("Consider upgrading CPU or check for thermal throttling.")
            downgrade_health("Moderate")

    # -----------------------------
    # GPU Analysis
    # -----------------------------
    if "GPU" in comp_scores:
        if gpu_score < 200:
            results["issues"].append("Low GPU performance detected.")
            results["recommendations"].append("Upgrade GPU or update to latest drivers.")
            downgrade_health("Moderate")
        if vram and vram < 4:
            results["issues"].append(f"Only {vram} GB VRAM available.")
            results["recommendations"].append("Upgrade to GPU with ≥6 GB VRAM for gaming or AI tasks.")
            downgrade_health("Moderate")

    # -----------------------------
    # RAM Analysis
    # -----------------------------
    if "RAM" in comp_scores:
        if ram_gb < 8:
            results["issues"].append(f"Limited RAM capacity ({ram_gb} GB).")
            results["recommendations"].append("Upgrade to at least 8–16 GB RAM.")
            downgrade_health("Moderate")
        if ram_speed < 10:
            results["issues"].append(f"Low RAM bandwidth ({ram_speed:.1f} GB/s).")
            results["recommendations"].append("Use dual-channel DDR4/DDR5 for higher throughput.")
            downgrade_health("Moderate")

    # -----------------------------
    # Storage Analysis
    # -----------------------------
    if "Storage" in comp_scores:
        avg_disk_speed = comp_scores["Storage"]
        if avg_disk_speed < 200:
            results["issues"].append(f"Low disk speed (R:{disk_r} MB/s, W:{disk_w} MB/s).")
            results["recommendations"].append("Upgrade to SSD or NVMe for faster data access.")
            downgrade_health("Moderate")
        if disk_health < 70:
            results["issues"].append(f"Storage health degraded ({disk_health}%).")
            results["recommendations"].append("Backup data and replace drive soon.")
            downgrade_health("Poor")

    # -----------------------------
    # Temperature Analysis
    # -----------------------------
    if temp:
        if temp > 85:
            results["issues"].append(f"High temperature detected ({temp}°C).")
            results["recommendations"].append("Clean fans, improve airflow, or replace thermal paste.")
            downgrade_health("Poor")
        elif 75 < temp <= 85:
            results["recommendations"].append("System running warm; monitor cooling efficiency.")
            downgrade_health("Moderate")

    # -----------------------------
    # Balance & Bottleneck Detection
    # -----------------------------
    if comp_scores:
        avg_score = mean(comp_scores.values())
        lowest_comp = min(comp_scores, key=comp_scores.get)
        lowest_score = comp_scores[lowest_comp]

        # Detect relative imbalance
        if lowest_score < avg_score * 0.75:
            results["likely_bottleneck"] = lowest_comp
            results["issues"].append(f"{lowest_comp} is likely the system bottleneck.")
            results["recommendations"].append(f"Upgrading {lowest_comp} will yield the biggest performance improvement.")
            downgrade_health("Moderate")

    # -----------------------------
    # Final Health Summary
    # -----------------------------
    if not results["issues"]:
        results["overall_health"] = "Excellent"
        results["recommendations"].append("System is well-balanced and performing optimally.")

    return results
