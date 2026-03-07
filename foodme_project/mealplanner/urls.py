from django.urls import path
from . import views

#url patterns for meal planning functionality
#allow users to manage weekly meal plans
#view days and assign recipes to days

urlpatterns = [

    #get all meal plans/create new one
    path("mealplans/", views.mealplan_list, name="mealplan_list"),

    #get specific meal plan
    path("mealplans/<int:mealplan_id>/", views.mealplan_detail, name="mealplan_detail"),

    #get all days in meal plan
    path("mealplans/<int:mealplan_id>/days/", views.mealplan_days, name="mealplan_days"),

    #add/remove recipes from day
    path("days/<int:day_id>/entries/", views.mealplan_entries, name="mealplan_entries"),

]