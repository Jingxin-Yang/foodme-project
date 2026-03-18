from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import ShoppingList, ShoppingItem
from mealplanner.models import MealPlanEntry, MealPlan


def _generate_items_from_plan(shopping_list, meal_plan):
    """
    Helper function to aggregate ingredients across a meal plan and create shopping items in bulk.
    Optimized to reduce database queries.
    """
    entries = MealPlanEntry.objects.filter(
        day__meal_plan=meal_plan
    ).select_related("recipe").prefetch_related("recipe__recipe_ingredients__ingredient")

    aggregated = {}
    for entry in entries:
        for ri in entry.recipe.recipe_ingredients.all():
            key = (ri.ingredient.id, ri.unit)
            if key in aggregated:
                aggregated[key]["quantity"] += ri.quantity
            else:
                aggregated[key] = {
                    "ingredient": ri.ingredient,
                    "name": ri.ingredient.name,
                    "quantity": ri.quantity,
                    "unit": ri.unit,
                }

    # Use bulk_create to insert all items in a single database transaction
    ShoppingItem.objects.bulk_create([
        ShoppingItem(
            shopping_list=shopping_list,
            ingredient=data["ingredient"],
            name=data["name"],
            quantity=data["quantity"],
            unit=data["unit"],
            purchased=False,
        )
        for data in aggregated.values()
    ])


@login_required
def shoppinglist_list(request):
    # Handle creation of new shopping lists, with optional auto-generation from a meal plan
    if request.method == "POST":
        meal_plan_id = request.POST.get("meal_plan_id")
        meal_plan = get_object_or_404(MealPlan, id=meal_plan_id, user=request.user) if meal_plan_id else None
        shopping_list = ShoppingList.objects.create(user=request.user, meal_plan=meal_plan)

        if meal_plan:
            _generate_items_from_plan(shopping_list, meal_plan)

        return redirect("shoppinglist_detail", list_id=shopping_list.id)

    # Prefetch items to optimize database queries when rendering the list overview
    lists = ShoppingList.objects.filter(user=request.user).prefetch_related("items")
    meal_plans = MealPlan.objects.filter(user=request.user)
    return render(request, "shopping_list.html", {"lists": lists, "meal_plans": meal_plans})


@login_required
def shoppinglist_detail(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)

    # Using a hidden action field to handle deletion within the detail view
    if request.method == "POST" and request.POST.get("_action") == "delete":
        shopping_list.delete()
        return redirect("shoppinglist_list")

    items = shopping_list.items.all()

    # Calculate initial stats for the dashboard UI
    purchased_count = items.filter(purchased=True).count()
    remaining_count = items.filter(purchased=False).count()

    return render(request, "shopping_list.html", {
        "shopping_list": shopping_list,
        "items": items,
        "purchased_count": purchased_count,
        "remaining_count": remaining_count,
    })


@login_required
def shopping_items(request, list_id):
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)

    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        quantity = float(request.POST.get("quantity", 0))
        unit = request.POST.get("unit", "")

        # Prevent duplicate entries by aggregating quantities if the item and unit match
        existing = shopping_list.items.filter(name__iexact=name).first()
        if existing and existing.unit.lower() == unit.lower():
            existing.quantity += quantity
            existing.save()
        else:
            ShoppingItem.objects.create(
                shopping_list=shopping_list,
                name=name,
                quantity=quantity,
                unit=unit,
            )
        return redirect("shoppinglist_detail", list_id=shopping_list.id)

    items = shopping_list.items.all()
    return render(request, "shopping_list.html", {"shopping_list": shopping_list, "items": items})


@login_required
def mark_item_purchased(request, item_id):
    # Traverse relationships to ensure the item belongs to the authenticated user
    item = get_object_or_404(ShoppingItem, id=item_id, shopping_list__user=request.user)

    if request.method == "POST":
        item.purchased = not item.purchased
        item.save()

        # Support AJAX requests from frontend checkbox toggles
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"status": "success", "purchased": item.purchased})

    return redirect("shoppinglist_detail", list_id=item.shopping_list.id)


@login_required
def edit_shopping_item(request, item_id):
    item = get_object_or_404(ShoppingItem, id=item_id, shopping_list__user=request.user)
    if request.method == "POST":
        item.name = request.POST.get("name", item.name).strip()
        item.quantity = float(request.POST.get("quantity", item.quantity))
        item.unit = request.POST.get("unit", item.unit)
        item.save()
    return redirect("shoppinglist_detail", list_id=item.shopping_list.id)


@login_required
def delete_shopping_item(request, item_id):
    item = get_object_or_404(ShoppingItem, id=item_id, shopping_list__user=request.user)
    list_id = item.shopping_list.id
    if request.method == "POST":
        item.delete()
    return redirect("shoppinglist_detail", list_id=list_id)