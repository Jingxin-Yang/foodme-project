from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from datetime import date
from recipes.models import Recipe, Tag
from mealplanner.models import MealPlan, MealPlanEntry
from shopping.models import ShoppingList


def register_user(request):
    #post /register/ creates user account and immediately logs them in
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        email = request.POST.get("email", "")
        if User.objects.filter(username=username).exists():
            return render(request, "login.html", {"error": "username already taken.", "register": True})
        user = User.objects.create_user(username=username, password=password, email=email)
        login(request, user) #immediately logs in after registering
        return redirect("dashboard")
    return render(request, "login.html", {"register": True})


def login_user(request):
    #post login will expect a username and pwd
    #deliberately vague error so you cant tell if username exists
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("dashboard")
        return render(request, "login.html", {"error": "invalid credentials."})
    return render(request, "login.html")


@login_required
def logout_user(request):
    #will log user out and redirect to login page
    if request.method == "POST":
        logout(request)
        return redirect("login_user")
    return redirect("dashboard")


@login_required
def user_profile(request):
    #get will return logged in user's profile
    #post will update username, email or password depending on _action
    if request.method == "POST":
        action = request.POST.get("_action")
        user = request.user

        if action == "update_profile":
            user.username = request.POST.get("username", user.username)
            user.email = request.POST.get("email", user.email)
            user.save()
            return render(request, "profile.html", {
                "success": "profile updated successfully.",
                "open_profile": True,
            })

        if action == "update_password":
            current = request.POST.get("current_password")
            new_password = request.POST.get("new_password")
            confirm = request.POST.get("confirm_password")
            if not user.check_password(current):
                return render(request, "profile.html", {
                    "password_error": "current password is incorrect.",
                    "open_security": True,
                })
            if new_password != confirm:
                return render(request, "profile.html", {
                    "password_error": "passwords do not match.",
                    "open_security": True,
                })
            if len(new_password) < 8 or not any(c.isdigit() for c in new_password):
                return render(request, "profile.html", {
                    "password_error": "password must be 8+ characters and contain a number.",
                    "open_security": True,
                })
            user.set_password(new_password)
            user.save()
            login(request, user) #keep user logged in after password change
            return render(request, "profile.html", {
                "password_success": "password updated successfully.",
                "open_security": True,
            })

    return render(request, "profile.html")


@login_required
def dashboard(request):
    today = date.today()

    #get latest meal plan
    latest_plan = MealPlan.objects.filter(user=request.user).order_by("-week_start").first()

    #todays meals from the latest plan
    todays_entries = []
    if latest_plan:
        todays_entries = MealPlanEntry.objects.filter(
            day__meal_plan=latest_plan,
            day__date=today
        ).select_related("recipe")

    #recent recipes
    recent_recipes = Recipe.objects.filter(user=request.user).order_by("-created_at")[:4]

    #shopping items remaining across all lists
    remaining_items = 0
    latest_list = ShoppingList.objects.filter(user=request.user).order_by("-created_at").first()
    if latest_list:
        remaining_items = latest_list.items.filter(purchased=False).count()

    #quick stats
    total_recipes = Recipe.objects.filter(user=request.user).count()
    total_plans = MealPlan.objects.filter(user=request.user).count()

    return render(request, "dashboard.html", {
        "today": today,
        "latest_plan": latest_plan,
        "todays_entries": todays_entries,
        "recent_recipes": recent_recipes,
        "remaining_items": remaining_items,
        "total_recipes": total_recipes,
        "total_plans": total_plans,
        "latest_list": latest_list,
    })


@login_required
def analytics(request):
    from django.db.models import Count, Q
    from datetime import timedelta

    #get selected period from query param, default to all time
    period = request.GET.get("period", "all")
    today = date.today()

    period_labels = {
        "week": "Last 7 Days",
        "month": "Last Month",
        "3months": "Last 3 Months",
        "year": "Last Year",
        "all": "All Time",
    }

    #calculate the start date based on the selected period
    if period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    elif period == "3months":
        start_date = today - timedelta(days=90)
    elif period == "year":
        start_date = today - timedelta(days=365)
    else:
        start_date = None

    #base entry queryset filtered by period if one is set
    entry_qs = MealPlanEntry.objects.filter(day__meal_plan__user=request.user)
    if start_date:
        entry_qs = entry_qs.filter(day__date__gte=start_date)

    total_recipes = Recipe.objects.filter(user=request.user).count()
    total_entries = entry_qs.count()

    #most used recipes in meal plans within the period
    top_recipes = Recipe.objects.filter(
        user=request.user
    ).annotate(
        times_planned=Count(
            "mealplanentry",
            filter=Q(mealplanentry__day__date__gte=start_date) if start_date else Q()
        )
    ).order_by("-times_planned")[:5]

    #meal type breakdown within the period
    breakfast_count = entry_qs.filter(meal_type="breakfast").count()
    lunch_count = entry_qs.filter(meal_type="lunch").count()
    dinner_count = entry_qs.filter(meal_type="dinner").count()

    #tag breakdown across user recipes
    tags = Tag.objects.filter(recipe__user=request.user).annotate(
        recipe_count=Count("recipe")
    ).order_by("-recipe_count")

    #cooking streak — consecutive days with entries up to today (not period filtered)
    streak = 0
    check_date = today
    while MealPlanEntry.objects.filter(day__meal_plan__user=request.user, day__date=check_date).exists():
        streak += 1
        check_date = check_date - timedelta(days=1)

    return render(request, "analytics.html", {
        "total_recipes": total_recipes,
        "total_entries": total_entries,
        "top_recipes": top_recipes,
        "breakfast_count": breakfast_count,
        "lunch_count": lunch_count,
        "dinner_count": dinner_count,
        "tags": tags,
        "streak": streak,
        "period": period,
        "period_label": period_labels.get(period, "All Time"),
    })
