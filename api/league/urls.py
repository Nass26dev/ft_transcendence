from django.urls import path
from .views import CreateLeague

urlpatterns = [
    path("create/", CreateLeague.as_view(), name="create-league"),
]