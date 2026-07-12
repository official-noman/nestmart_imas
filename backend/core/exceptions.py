from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import exceptions as drf_exceptions
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """Map Django's model/form ValidationError to DRF's 400, not an unhandled 500."""
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
        exc = drf_exceptions.ValidationError(detail)

    return drf_exception_handler(exc, context)
