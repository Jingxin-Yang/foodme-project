from django.contrib import admin
from .models import MealPlan, MealPlanDay, MealPlanEntry


class MealPlanEntryInline(admin.TabularInline):
    model = MealPlanEntry
    extra = 1


class MealPlanDayInline(admin.TabularInline):
    model = MealPlanDay
    extra = 7


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ("user", "week_start", "created_at")
    inlines = [MealPlanDayInline]


@admin.register(MealPlanDay)
class MealPlanDayAdmin(admin.ModelAdmin):
    list_display = ("meal_plan", "date")
    inlines = [MealPlanEntryInline]


@admin.register(MealPlanEntry)
class MealPlanEntryAdmin(admin.ModelAdmin):
    list_display = ("recipe", "day")