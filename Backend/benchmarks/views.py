#benchmark/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Benchmark
from .serializers import BenchmarkSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_benchmarks(request):
    user = request.user
    benchmarks = Benchmark.objects.filter(user=user).order_by('-timestamp')
    serializer = BenchmarkSerializer(benchmarks, many=True)
    return Response(serializer.data)
