from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from datetime import date, timedelta
from .models import MealPlan, MealPlanDay, MealPlanEntry
from recipes.models import Recipe


def _create_meal_plan_for_week(user, week_start_str):
    """
    Helper function to enforce DRY principle.
    Handles the parsing and bulk creation of a meal plan and its associated 7 days.
    """
    week_start = date.fromisoformat(week_start_str)
    meal_plan = MealPlan.objects.create(user=user, week_start=week_start)

    # Use bulk_create for database optimization instead of saving days in a loop
    MealPlanDay.objects.bulk_create([
        MealPlanDay(
            meal_plan=meal_plan,
            date=meal_plan.week_start + timedelta(days=i)
        )
        for i in range(7)
    ])
    return meal_plan


@login_required
def mealplan_list(request):
    if request.method == "POST":
        week_start_str = request.POST.get("week_start")
        meal_plan = _create_meal_plan_for_week(request.user, week_start_str)
        return redirect("mealplan_detail", mealplan_id=meal_plan.id)

    # Auto-redirect users with existing plans to their latest dashboard for better UX
    latest_plan = MealPlan.objects.filter(user=request.user).order_by("-week_start").first()
    if latest_plan:
        return redirect("mealplan_detail", mealplan_id=latest_plan.id)

    return render(request, "meal_planner.html", {})


@login_required
def mealplan_detail(request, mealplan_id):
    meal_plan = get_object_or_404(MealPlan, id=mealplan_id, user=request.user)

    # Using hidden _action inputs to handle multiple distinct actions within the same view
    if request.method == "POST" and request.POST.get("_action") == "delete":
        meal_plan.delete()
        return redirect("mealplan_list")

    if request.method == "POST" and request.POST.get("_action") == "create":
        new_plan = _create_meal_plan_for_week(request.user, request.POST.get("week_start"))
        return redirect("mealplan_detail", mealplan_id=new_plan.id)

    # Prefetch related entries and recipes to prevent N+1 query performance issues in templates
    days = meal_plan.days.all().prefetch_related("entries__recipe").order_by("date")
    recipes = Recipe.objects.filter(user=request.user)
    all_plans = MealPlan.objects.filter(user=request.user).order_by("-week_start")

    return render(request, "meal_planner.html", {
        "meal_plan": meal_plan,
        "days": days,
        "recipes": recipes,
        "all_plans": all_plans,
    })


@login_required
def mealplan_days(request, mealplan_id):
    meal_plan = get_object_or_404(MealPlan, id=mealplan_id, user=request.user)
    days = meal_plan.days.all().prefetch_related("entries__recipe").order_by("date")
    return render(request, "meal_planner.html", {"meal_plan": meal_plan, "days": days})


@login_required
def mealplan_entries(request, day_id):
    # Ensure the user actually owns the day they are modifying to prevent IDOR attacks
    day = get_object_or_404(MealPlanDay, id=day_id, meal_plan__user=request.user)

    if request.method == "POST" and request.POST.get("_action") == "delete":
        entry_id = request.POST.get("entry_id")
        entry = get_object_or_404(MealPlanEntry, id=entry_id, day=day)
        entry.delete()
        return redirect("mealplan_detail", mealplan_id=day.meal_plan.id)

    if request.method == "POST":
        recipe_id = request.POST.get("recipe_id")
        meal_type = request.POST.get("meal_type", "dinner")
        recipe = get_object_or_404(Recipe, id=recipe_id, user=request.user)
        entry = MealPlanEntry.objects.create(day=day, recipe=recipe, meal_type=meal_type)

        # Handle AJAX requests from JS dynamically to avoid page reloads
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                "status": "success",
                "recipe_title": recipe.title,
                "meal_type": meal_type,
                "day_id": day.id,
                "entry_id": entry.id
            })

        return redirect("mealplan_detail", mealplan_id=day.meal_plan.id)