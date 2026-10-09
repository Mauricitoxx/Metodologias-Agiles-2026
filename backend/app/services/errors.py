from fastapi import HTTPException, status


def not_found(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def conflict(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)


def field_error(field: str, message: str, location: str = "body") -> HTTPException:
    """422 with the same shape as FastAPI validation errors, so the frontend can map it to the field."""
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=[{"loc": [location, field], "msg": message, "type": "value_error"}],
    )
