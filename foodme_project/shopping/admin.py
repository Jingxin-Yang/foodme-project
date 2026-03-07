from django.contrib import admin
from .models import ShoppingList, ShoppingItem


class ShoppingItemInline(admin.TabularInline):
    model = ShoppingItem
    extra = 1


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ("user", "meal_plan", "created_at")
    inlines = [ShoppingItemInline]


@admin.register(ShoppingItem)
class ShoppingItemAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "unit", "purchased", "shopping_list")
    list_filter = ("purchased",)