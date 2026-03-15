from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from datetime import timedelta
from .models import MealPlan, MealPlanDay, MealPlanEntry
from recipes.models import Recipe
from datetime import date, timedelta

@login_required
def mealplan_list(request):
    #get will list all meal plans
    #post will create new weekly meal plan, expecting the date to be monday
    if request.method == "POST":
        week_start_str = request.POST.get("week_start")
        #parse the string to a date object so timedelta works in create_week_days
        week_start = date.fromisoformat(week_start_str)
        meal_plan = MealPlan.objects.create(user=request.user, week_start=week_start)
        #autocreate 7 mealplan day rows for the week
        create_week_days(meal_plan)
        return redirect("mealplan_detail", mealplan_id=meal_plan.id)

    plans = MealPlan.objects.filter(
        user=request.user
    ).prefetch_related("days__entries__recipe")
    return render(request, "meal_planner.html", {"plans": plans})

@login_required
def mealplan_detail(request, mealplan_id):
    #get will retrive a single meal plan with all days and entires
    #post with delete action will remove a meal and all its associted days and entires
    meal_plan = get_object_or_404(MealPlan, id=mealplan_id, user=request.user)

    if request.method == "POST" and request.POST.get("_action") == "delete":
        meal_plan.delete()
        return redirect("mealplan_list")

    days = meal_plan.days.all().prefetch_related("entries__recipe").order_by("date")
    #pass recipes so the add to plan section can show them
    recipes = Recipe.objects.filter(user=request.user)
    return render(request, "meal_planner.html", {
        "meal_plan": meal_plan,
        "days": days,
        "recipes": recipes,
    })

@login_required
def mealplan_days(request, mealplan_id):
    #get mealplans/id/days will list all days in a meal plan with their entries
    #days are autocreated when the plan is created so no post is needed here
    meal_plan = get_object_or_404(MealPlan, id=mealplan_id, user=request.user)
    days = meal_plan.days.all().prefetch_related("entries__recipe").order_by("date")
    return render(request, "meal_planner.html", {"meal_plan": meal_plan, "days": days})

@login_required
def mealplan_entries(request, day_id):
    #get will list all recipe entries for a specific day
    #post will assign a recipe to this day
    #post with delete action will remove an entry
    day = get_object_or_404(MealPlanDay, id=day_id, meal_plan__user=request.user) #verifies day belongs to requesting user

    if request.method == "POST" and request.POST.get("_action") == "delete":
        entry_id = request.POST.get("entry_id")
        entry = get_object_or_404(MealPlanEntry, id=entry_id, day=day)
        entry.delete()
        return redirect("mealplan_detail", mealplan_id=day.meal_plan.id)

    if request.method == "POST":
        recipe_id = request.POST.get("recipe_id")
        meal_type = request.POST.get("meal_type", "dinner")
        recipe = get_object_or_404(Recipe, id=recipe_id, user=request.user)
        MealPlanEntry.objects.create(day=day, recipe=recipe, meal_type=meal_type)
        return redirect("mealplan_detail", mealplan_id=day.meal_plan.id)

    entries = day.entries.all().select_related("recipe")
    recipes = Recipe.objects.filter(user=request.user)
    return render(request, "meal_planner.html", {"day": day, "entries": entries, "recipes": recipes})

def create_week_days(meal_plan): #autocreates 7 mealplan day rows when new meal plan is created
    MealPlanDay.objects.bulk_create([
        MealPlanDay(
            meal_plan=meal_plan,
            date=meal_plan.week_start + timedelta(days=i)
        )
        for i in range(7)
    ])