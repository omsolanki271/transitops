import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

class BusinessRuleValidationError(Exception):
    """
    Exception raised for business rule validation failures in the services layer.
    """
    def __init__(self, message, fields=None):
        self.message = message
        self.fields = fields or {}
        super().__init__(message)

class StateTransitionConflict(Exception):
    """
    Exception raised for invalid state transitions.
    """
    def __init__(self, message):
        self.message = message
        super().__init__(message)

def custom_exception_handler(exc, context):
    """
    Global exception handler that formats all DRF and business exception responses
    into the standard envelope structure:
    {"success": false, "error": {"code": "...", "message": "...", "fields": {...}}}
    """
    # Custom business exception formatting
    if isinstance(exc, BusinessRuleValidationError):
        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": exc.message,
                "fields": exc.fields
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, StateTransitionConflict):
        return Response({
            "success": False,
            "error": {
                "code": "CONFLICT",
                "message": exc.message,
                "fields": {}
            }
        }, status=status.HTTP_409_CONFLICT)

    # Call DRF's default exception handler to get the standard error response first.
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data
        code = "ERROR"
        message = "An error occurred."
        fields = {}

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            code = "VALIDATION_ERROR"
            message = "Validation failed."
            if isinstance(data, dict):
                if 'non_field_errors' in data:
                    message = data['non_field_errors'][0] if isinstance(data['non_field_errors'], list) else data['non_field_errors']
                elif 'detail' in data:
                    message = data['detail']
                else:
                    # Find the first field error to use as main message
                    first_key = next(iter(data.keys()))
                    val = data[first_key]
                    if isinstance(val, list) and len(val) > 0:
                        message = f"{first_key}: {val[0]}"
                    else:
                        message = f"{first_key}: {val}"
                fields = data
            elif isinstance(data, list):
                message = data[0] if len(data) > 0 else "Validation failed."
                fields = {"non_field_errors": data}
            else:
                message = str(data)
        else:
            # Handle non-400 exceptions
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                code = "UNAUTHENTICATED"
                message = "Authentication credentials were not provided or are invalid."
            elif response.status_code == status.HTTP_403_FORBIDDEN:
                code = "PERMISSION_DENIED"
                message = "You do not have permission to perform this action."
            elif response.status_code == status.HTTP_404_NOT_FOUND:
                code = "NOT_FOUND"
                message = "The requested resource was not found."
            elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
                code = "METHOD_NOT_ALLOWED"
                message = "Method not allowed."
            
            if isinstance(data, dict) and 'detail' in data:
                message = data['detail']

        return Response({
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "fields": fields
            }
        }, status=response.status_code)

    # For unhandled server exceptions (HTTP 500)
    logger.exception("Uncaught server exception")
    
    # Check if we are running in debug mode
    # We can check settings.DEBUG
    from django.conf import settings
    
    err_msg = str(exc) if settings.DEBUG else "An unexpected server error occurred."
    
    return Response({
        "success": False,
        "error": {
            "code": "SERVER_ERROR",
            "message": err_msg,
            "fields": {}
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
