from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

#root url config for entire project
#connects all app level url configs

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", RedirectView.as_view(url="/login/"), name="home"),
    #recipes
    path("", include("recipes.urls")),
    #meal planner
    path("", include("mealplanner.urls")),
    #shopping list
    path("", include("shopping.urls")),
    #user/authentication
    path("", include("users.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#the static() call serves uploaded dish photos during development