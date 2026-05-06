from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.UserProfileView.as_view(), name='auth-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('users/', views.ManagedUserListCreateView.as_view(), name='auth-users'),
    path('users/<int:user_id>/', views.ManagedUserDetailView.as_view(), name='auth-user-detail'),
    path('users/<int:user_id>/reset-password/', views.ManagedUserResetPasswordView.as_view(), name='auth-user-reset-password'),
    path('roles/', views.RoleListView.as_view(), name='auth-roles'),
    path('roles/<int:role_id>/permissions/', views.RolePermissionsView.as_view(), name='auth-role-permissions'),
    path('permissions/', views.PermissionListView.as_view(), name='auth-permissions'),
]
