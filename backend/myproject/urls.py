from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SignupView, LoginView, LogoutView, ProtectedView

from .views import CurrentUserView , AllUserView

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notes', views.NoteViewSet, basename='note')
router.register(r'shared-notes', views.SharedNoteViewSet, basename='sharednote')

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    path('current-user/', CurrentUserView.as_view(), name='current_user'),
    path('all-users/', AllUserView.as_view(), name='all_users'),
    path('', include(router.urls)),
]