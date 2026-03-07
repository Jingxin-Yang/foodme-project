from django.urls import path
from . import views

#url patterns for all recipe endpoints
#allows users to create/view/update/del recipes
#also ti access ingredients/tags/recipe steps

urlpatterns = [

    #get all recipes or create new
    path("recipes/", views.recipe_list, name="recipe_list"),

    #get/update/del a specific recipe by ID
    path("recipes/<int:recipe_id>/", views.recipe_detail, name="recipe_detail"),

    #get all
    path("ingredients/", views.ingredient_list, name="ingredient_list"),

    #get all
    path("tags/", views.tag_list, name="tag_list"),

]