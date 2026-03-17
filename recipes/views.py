from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Recipe, Ingredient, Tag, RecipeIngredient, RecipeStep


def _save_ingredients_and_steps(recipe, request, is_edit=False):
    """
    Helper function to handle saving related ingredients and steps.
    Extracts logic to prevent code duplication in add and edit views.
    """
    if is_edit:
        # Clear existing related data before updating to avoid orphan records
        recipe.recipe_ingredients.all().delete()
        recipe.steps.all().delete()

    ingredient_ids = request.POST.getlist("ingredient_ids")
    quantities = request.POST.getlist("quantities")
    units = request.POST.getlist("units")
    seen_ingredients = set()

    for ingredient_id, quantity, unit in zip(ingredient_ids, quantities, units):
        if not ingredient_id or not quantity.strip():
            continue
        # Prevent duplicate ingredient entries in the same recipe submission
        if ingredient_id in seen_ingredients:
            continue
        seen_ingredients.add(ingredient_id)

        try:
            ingredient = Ingredient.objects.get(id=ingredient_id)
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=quantity,
                unit=unit,
            )
        except Ingredient.DoesNotExist:
            continue

    steps = request.POST.getlist("steps")
    valid_steps = [s for s in steps if s.strip()]
    for i, instruction in enumerate(valid_steps, start=1):
        RecipeStep.objects.create(recipe=recipe, step_number=i, instruction=instruction)


@login_required
def recipe_list(request):
    if request.method == "POST":
        return redirect("add_recipe")

    # Prefetch related data to optimize database queries and prevent N+1 rendering issues
    recipes = Recipe.objects.filter(user=request.user).prefetch_related(
        "recipe_ingredients__ingredient", "steps", "tags"
    )

    search = request.GET.get("search", "").strip()
    if search:
        recipes = recipes.filter(title__icontains=search)

    tag_filter = request.GET.get("tag", "").strip()
    if tag_filter and tag_filter != "all":
        recipes = recipes.filter(tags__name__iexact=tag_filter)

    sort = request.GET.get("sort", "newest")
    if sort == "az":
        recipes = recipes.order_by("title")
    elif sort == "za":
        recipes = recipes.order_by("-title")
    elif sort == "oldest":
        recipes = recipes.order_by("created_at")
    else:
        recipes = recipes.order_by("-created_at")

    tags = Tag.objects.all().order_by("name")
    return render(request, "recipes.html", {
        "recipes": recipes,
        "tags": tags,
        "search": search,
        "tag_filter": tag_filter,
        "sort": sort,
    })


@login_required
def recipe_detail(request, recipe_id):
    recipe = get_object_or_404(Recipe, id=recipe_id, user=request.user)

    # Using POST payload to determine action since standard HTML forms do not support PUT/DELETE methods
    if request.method == "POST" and request.POST.get("_action") == "delete":
        recipe.delete()
        return redirect("recipe_list")

    if request.method == "POST" and request.POST.get("_action") == "edit":
        recipe.title = request.POST.get("title", recipe.title)
        recipe.description = request.POST.get("description", recipe.description)
        recipe.save()

        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))
        return redirect("recipe_detail", recipe_id=recipe.id)

    return render(request, "recipe_detail.html", {"recipe": recipe})


@login_required
def add_recipe(request):
    ingredients = Ingredient.objects.all().order_by("name")
    tags = Tag.objects.all().order_by("name")

    if request.method == "POST":
        recipe = Recipe.objects.create(
            user=request.user,
            title=request.POST.get("title"),
            description=request.POST.get("description", ""),
        )

        if request.FILES.get("image"):
            recipe.image = request.FILES["image"]
            recipe.save()

        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))

        # Utilize helper function to handle complex related data
        _save_ingredients_and_steps(recipe, request, is_edit=False)

        return redirect("recipe_detail", recipe_id=recipe.id)

    return render(request, "add_recipe.html", {"ingredients": ingredients, "tags": tags})


@login_required
def edit_recipe(request, recipe_id):
    recipe = get_object_or_404(Recipe, id=recipe_id, user=request.user)
    ingredients = Ingredient.objects.all().order_by("name")
    tags = Tag.objects.all().order_by("name")

    if request.method == "POST":
        recipe.title = request.POST.get("title", recipe.title)
        recipe.description = request.POST.get("description", recipe.description)
        if request.FILES.get("image"):
            recipe.image = request.FILES["image"]
        recipe.save()

        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))

        # Utilize helper function with edit flag to clean up old records first
        _save_ingredients_and_steps(recipe, request, is_edit=True)

        return redirect("recipe_detail", recipe_id=recipe.id)

    return render(request, "edit_recipe.html", {
        "recipe": recipe,
        "ingredients": ingredients,
        "tags": tags,
    })


@login_required
def add_ingredient(request):
    # Handles AJAX requests from the frontend to dynamically create new ingredients
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        if not name:
            return JsonResponse({"error": "ingredient name is required"}, status=400)

        # get_or_create prevents duplicates if multiple users add the same ingredient simultaneously
        ingredient, created = Ingredient.objects.get_or_create(name__iexact=name, defaults={"name": name})
        return JsonResponse({"id": ingredient.id, "name": ingredient.name})
    return JsonResponse({"error": "invalid request"}, status=405)


@login_required
def ingredient_list(request):
    ingredients = Ingredient.objects.all().order_by("name")
    return render(request, "recipes.html", {"ingredients": ingredients})


@login_required
def tag_list(request):
    tags = Tag.objects.all().order_by("name")
    return render(request, "recipes.html", {"tags": tags})