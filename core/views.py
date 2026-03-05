from django.shortcuts import render

def index(request):
    return render(request, 'index.html')
def dashboard(request):
    return render(request, 'dashboard.html')

def login_view(request):
    return render(request, 'login.html')

def recipes(request):
    return render(request, 'recipes.html')

def meal_planner(request):
    return render(request, 'meal_planner.html')

def shopping_list(request):
    return render(request, 'shopping_list.html')

def analytics(request):
    return render(request, 'analytics.html')

def profile(request):
    return render(request, 'profile.html')

def recipe_detail(request):
    return render(request, 'recipe_detail.html')

def add_recipe(request):
    return render(request, 'add_recipe.html')