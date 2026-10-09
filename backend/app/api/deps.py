def require_admin() -> None:
    """Guard for admin-only endpoints (RN-02).

    TODO(HU-01): validate the JWT and the admin role once login is implemented. Until then it
    lets every request through; routes already depend on it, so only this function must change.
    """
