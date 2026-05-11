from authentication.rbac import user_has_permission


def can_read_products(user) -> bool:
    return user_has_permission(user, "products:read")


def can_write_products(user) -> bool:
    return user_has_permission(user, "products:write")


def can_delete_products(user) -> bool:
    return user_has_permission(user, "products:delete")


def can_manage_pricing(user) -> bool:
    return user_has_permission(user, "products:pricing")


def can_view_cost(user) -> bool:
    return user_has_permission(user, "products:cost")
