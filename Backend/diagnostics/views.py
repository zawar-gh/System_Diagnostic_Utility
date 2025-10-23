#diagnostics.py/views
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils.system_collector import get_system_info
from .utils.bottleneck_analyzer import analyze_bottlenecks

@api_view(['GET'])
def collect_system_info(request):
    system_data = get_system_info()
    if "error" in system_data:
        return Response({"status": "error", "message": system_data["error"]})

    analysis = analyze_bottlenecks(system_data)

    return Response({
        "status": "success",
        "data": {
            "system_info": system_data,
            "analysis": analysis
        }
    })
