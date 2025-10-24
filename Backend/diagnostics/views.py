#diagnostics/views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .utils.system_collector import get_system_info
from .utils.bottleneck_analyzer import analyze_bottlenecks

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # enforce JWT auth
def collect_system_info(request):
    # Fetch system info from collector
    system_data = get_system_info()
    if "error" in system_data:
        return Response({"status": "error", "message": system_data["error"]}, status=400)

    # Analyze bottlenecks if needed
    analysis = analyze_bottlenecks(system_data)

    # Return structured data for frontend
    return Response({
        "os": system_data.get("os", {}),
        "cpu": system_data.get("cpu", {}),
        "gpu": system_data.get("gpu", {}),
        "ram": system_data.get("ram", {}),
        "storage": system_data.get("storage", {}),
        "analysis": analysis
    })
