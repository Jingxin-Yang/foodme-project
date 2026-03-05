from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('recipes/', views.recipes, name='recipes'),
    path('planner/', views.meal_planner, name='meal_planner'),
    path('shopping-list/', views.shopping_list, name='shopping_list'),
    path('analytics/', views.analytics, name='analytics'),
    path('profile/', views.profile, name='profile'),
    path('recipe-detail/', views.recipe_detail, name='recipe_detail'),
    path('add-recipe/', views.add_recipe, name='add_recipe'),
]