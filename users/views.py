from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from datetime import date, timedelta
import calendar
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from recipes.models import Recipe, Tag
from mealplanner.models import MealPlan, MealPlanEntry
from shopping.models import ShoppingList


def _calculate_cooking_streak(user, today):
    """
    Helper function to calculate consecutive days of logged meals.
    Extracted to enforce DRY principles, as this is used in multiple views (dashboard & analytics).
    """
    streak = 0
    check_date = today

    # If there is no entry for today yet, check if the streak was active as of yesterday
    if not MealPlanEntry.objects.filter(day__meal_plan__user=user, day__date=check_date).exists():
        check_date = today - timedelta(days=1)

    while MealPlanEntry.objects.filter(day__meal_plan__user=user, day__date=check_date).exists():
        streak += 1
        check_date = check_date - timedelta(days=1)

    return streak


def register_user(request):
    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        email = request.POST.get("email", "")

        # Validate unique username before creation to prevent IntegrityError
        if User.objects.filter(username=username).exists():
            return render(request, "login.html", {"error": "username already taken.", "register": True})

        user = User.objects.create_user(username=username, password=password, email=email)
        login(request, user)
        return redirect("dashboard")

    return render(request, "login.html", {"register": True})


def login_user(request):
    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        # Authenticate securely against the database using Django's built-in auth system
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("dashboard")

        # Intentionally generic error message to prevent username enumeration attacks
        return render(request, "login.html", {"error": "invalid credentials."})

    return render(request, "login.html")


@login_required
def logout_user(request):
    if request.method == "POST":
        logout(request)
        return redirect("login_user")
    return redirect("dashboard")


@login_required
def user_profile(request):
    if request.method == "POST":
        action = request.POST.get("_action")
        user = request.user

        # Route distinct form submissions within a single view using hidden action flags
        if action == "update_profile":
            user.username = request.POST.get("username", user.username)
            user.email = request.POST.get("email", user.email)
            user.save()

            # Utilize messages framework and PRG pattern to prevent form resubmission and CSRF rotation errors
            messages.success(request, "profile updated successfully.")
            return redirect("user_profile")

        if action == "update_password":
            current = request.POST.get("current_password")
            new_password = request.POST.get("new_password")
            confirm = request.POST.get("confirm_password")

            if not user.check_password(current):
                messages.error(request, "current password is incorrect.")
                return redirect("user_profile")

            if new_password != confirm:
                messages.error(request, "passwords do not match.")
                return redirect("user_profile")

            # Enforce minimum security standards for user passwords
            if len(new_password) < 8 or not any(c.isdigit() for c in new_password):
                messages.error(request, "password must be 8+ characters and contain a number.")
                return redirect("user_profile")

            user.set_password(new_password)
            user.save()

            # Maintain active session after password rotation to prevent unexpected logouts
            login(request, user)
            messages.success(request, "password updated successfully.")
            return redirect("user_profile")

        if action == "delete_account":
            logout(request)
            user.delete()
            return redirect("landing")

    return render(request, "profile.html")


@login_required
def dashboard(request):
    today = date.today()

    latest_plan = MealPlan.objects.filter(user=request.user).order_by("-week_start").first()

    # Pre-select related recipes to optimize rendering of today's meals
    todays_entries = MealPlanEntry.objects.filter(
        day__meal_plan__user=request.user,
        day__date=today
    ).select_related("recipe")

    streak = _calculate_cooking_streak(request.user, today)

    recent_recipes = Recipe.objects.filter(user=request.user).order_by("-created_at")[:4]

    remaining_items = 0
    latest_list = ShoppingList.objects.filter(user=request.user).order_by("-created_at").first()
    if latest_list:
        remaining_items = latest_list.items.filter(purchased=False).count()

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
        "streak": streak,
    })


def landing(request):
    # Route authenticated users directly to the application core
    if request.user.is_authenticated:
        return redirect("dashboard")
    return render(request, "landing.html")


@login_required
def analytics(request):
    period = request.GET.get("period", "all")
    today = date.today()

    period_labels = {
        "week": "Last 7 Days",
        "month": "Last Month",
        "3months": "Last 3 Months",
        "year": "Last Year",
        "all": "All Time",
    }

    # Determine dynamic cutoff date based on user selection
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

    entry_qs = MealPlanEntry.objects.filter(day__meal_plan__user=request.user)
    if start_date:
        entry_qs = entry_qs.filter(day__date__gte=start_date)

    total_recipes = Recipe.objects.filter(user=request.user).count()
    total_entries = entry_qs.count()

    # Aggregate usage frequency to identify top planned recipes
    top_recipes = Recipe.objects.filter(
        user=request.user
    ).annotate(
        times_planned=Count(
            "mealplanentry",
            filter=Q(mealplanentry__day__date__gte=start_date) if start_date else Q()
        )
    ).order_by("-times_planned")[:5]

    breakfast_count = entry_qs.filter(meal_type="breakfast").count()
    lunch_count = entry_qs.filter(meal_type="lunch").count()
    dinner_count = entry_qs.filter(meal_type="dinner").count()

    # Analyze tag distribution
    tags = Tag.objects.filter(recipe__user=request.user).annotate(
        recipe_count=Count("recipe")
    ).order_by("-recipe_count")

    streak = _calculate_cooking_streak(request.user, today)

    # Build chronological dataset for front-end rendering (Chart.js compatibility)
    chart_data = []
    if period == "week":
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            count = entry_qs.filter(day__date=d).count()
            chart_data.append({"label": d.strftime('%a').upper(), "count": count})

    elif period == "month":
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            count = entry_qs.filter(day__date=d).count()
            label = d.strftime('%m/%d') if i % 5 == 0 or i == 0 else ""
            chart_data.append({"label": label, "count": count})

    else:
        if period == "3months":
            month_range = 3
        elif period == "year":
            month_range = 12
        else:
            first_entry = MealPlanEntry.objects.filter(day__meal_plan__user=request.user).order_by("day__date").first()
            if first_entry:
                delta = today.year * 12 + today.month - (first_entry.day.date.year * 12 + first_entry.day.date.month)
                month_range = max(6, delta + 1)
            else:
                month_range = 6

        # Group entries by month for long-term trend analysis
        monthly_stats = (
            entry_qs
            .annotate(m=TruncMonth("day__date"))
            .values("m")
            .annotate(c=Count("id"))
            .order_by("m")
        )

        for i in range(month_range - 1, -1, -1):
            target_month = (today.month - i - 1) % 12 + 1
            target_year = today.year + (today.month - i - 1) // 12
            month_abbr = calendar.month_abbr[target_month].upper()
            label = f"{month_abbr} {target_year}" if month_range > 6 else month_abbr
            count = next((item["c"] for item in monthly_stats if
                          item["m"].month == target_month and item["m"].year == target_year), 0)
            chart_data.append({"label": label, "count": count})

    max_count = max((item["count"] for item in chart_data), default=1)

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
        "months": chart_data,
        "max_count": max_count,
    })