from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Recipe, Ingredient, Tag, RecipeIngredient, RecipeStep


@login_required
def recipe_list(request):
    #get /recipes/ will list all recipes belonging to the user that is currently logged in
    #post /recipes/ will create a new recipe
    if request.method == "POST":
        return redirect("add_recipe")

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
    #get /recipes/<id> will retrieve a single recipe
    #put /recipes/<id> will update a recipe
    recipe = get_object_or_404(Recipe, id=recipe_id, user=request.user)

    if request.method == "POST" and request.POST.get("_action") == "delete":
        recipe.delete()
        return redirect("recipe_list")

    if request.method == "POST" and request.POST.get("_action") == "edit":
        recipe.title = request.POST.get("title", recipe.title)
        recipe.description = request.POST.get("description", recipe.description)
        recipe.save()
        #update tags
        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))
        return redirect("recipe_detail", recipe_id=recipe.id)

    return render(request, "recipe_detail.html", {"recipe": recipe})


@login_required
def add_recipe(request):
    #handles the add recipe form, get will show the form, post will save the new recipe
    ingredients = Ingredient.objects.all().order_by("name")
    tags = Tag.objects.all().order_by("name")

    if request.method == "POST":
        recipe = Recipe.objects.create(
            user=request.user,
            title=request.POST.get("title"),
            description=request.POST.get("description", ""),
        )
        #save image if one was uploaded
        if request.FILES.get("image"):
            recipe.image = request.FILES["image"]
            recipe.save()
        #update tags
        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))
        #save ingredients
        ingredient_ids = request.POST.getlist("ingredient_ids")
        quantities = request.POST.getlist("quantities")
        units = request.POST.getlist("units")
        for ingredient_id, quantity, unit in zip(ingredient_ids, quantities, units):
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=Ingredient.objects.get(id=ingredient_id),
                quantity=quantity,
                unit=unit,
            )
        #save steps
        steps = request.POST.getlist("steps")
        for i, instruction in enumerate(steps, start=1):
            RecipeStep.objects.create(recipe=recipe, step_number=i, instruction=instruction)

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
        #update tags
        tag_ids = request.POST.getlist("tag_ids")
        recipe.tags.set(Tag.objects.filter(id__in=tag_ids))
        #update ingredients
        recipe.recipe_ingredients.all().delete()
        ingredient_ids = request.POST.getlist("ingredient_ids")
        quantities = request.POST.getlist("quantities")
        units = request.POST.getlist("units")
        for ingredient_id, quantity, unit in zip(ingredient_ids, quantities, units):
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=Ingredient.objects.get(id=ingredient_id),
                quantity=quantity,
                unit=unit,
            )
        #update steps
        recipe.steps.all().delete()
        steps = request.POST.getlist("steps")
        for i, instruction in enumerate(steps, start=1):
            RecipeStep.objects.create(recipe=recipe, step_number=i, instruction=instruction)

        return redirect("recipe_detail", recipe_id=recipe.id)

    return render(request, "edit_recipe.html", {
        "recipe": recipe,
        "ingredients": ingredients,
        "tags": tags,
    })


@login_required
def add_ingredient(request):
    #post will create a new ingredient and return its id and name as json
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        if not name:
            return JsonResponse({"error": "ingredient name is required"}, status=400)
        ingredient, created = Ingredient.objects.get_or_create(name__iexact=name, defaults={"name": name})
        return JsonResponse({"id": ingredient.id, "name": ingredient.name})
    return JsonResponse({"error": "invalid request"}, status=405)


@login_required
def ingredient_list(request):
    #get ingredients will list all available ingredients
    ingredients = Ingredient.objects.all().order_by("name")
    return render(request, "recipes.html", {"ingredients": ingredients})


@login_required
def tag_list(request):
    #get will list all available tags
    tags = Tag.objects.all().order_by("name")
    return render(request, "recipes.html", {"tags": tags})
