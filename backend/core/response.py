from rest_framework.response import Response

def standard_response(success=True, data=None, error=None, meta=None, status_code=200):
    """
    Standard Response envelope wrapper.
    """
    response_data = {
        "success": success
    }
    if success:
        response_data["data"] = data if data is not None else {}
        if meta is not None:
            response_data["meta"] = meta
    else:
        response_data["error"] = error if error is not None else {
            "code": "ERROR",
            "message": "An error occurred.",
            "fields": {}
        }
        
    return Response(response_data, status=status_code)
