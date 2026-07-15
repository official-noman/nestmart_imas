from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse


def health_check(request):
    """Liveness/readiness probe for orchestrators (Docker, K8s, load balancers).

    Plain Django view, not DRF -- must stay reachable without auth and
    without going through DEFAULT_PERMISSION_CLASSES.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except OperationalError:
        return JsonResponse({'status': 'error', 'database': 'unreachable'}, status=503)

    return JsonResponse({'status': 'ok', 'database': 'ok'})
