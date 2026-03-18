# FoodMe

A personal meal planning and recipe management web application built with Django.

**Deployed Application:** https://clio.pythonanywhere.com

## Overview

FoodMe helps users organise their own recipes, plan weekly meals, and automatically generate consolidated shopping lists that merge shared ingredients to avoid duplicate purchases. The app is designed for personal use — there are no social or multi-user features.

## Features

- **User Authentication** — Register, login, logout with Django's built-in auth system
- **Recipe Management** — Create, edit, delete recipes with structured ingredients, steps, tags, and images
- **Tag Filtering & Search** — Filter recipes by dietary tags (Keto, Vegetarian, etc.) and search by title
- **Weekly Meal Planner** — Assign recipes to daily meal slots (Breakfast, Lunch, Dinner) with week navigation
- **Smart Shopping List** — Auto-generate shopping lists from meal plans with ingredient aggregation; add custom items, mark as purchased
- **Analytics Dashboard** — Visualise cooking habits with Chart.js charts and time-range filters
- **Profile & Settings** — View and update account details, change password

## Tech Stack

- **Backend**: Python 3, Django 5.2
- **Frontend**: Django Templates, Bootstrap 5.3, vanilla JavaScript
- **Charts**: Chart.js 4.4
- **Database**: SQLite
- **Deployment**: PythonAnywhere
- **Fonts**: Google Fonts (Nunito)

## Setup

```bash
# Clone the repository
git clone https://github.com/Jingxin-Yang/foodme-project.git
cd foodme-project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
# Note: If Pillow 10.3.0 fails to build, install the latest version instead:
# pip install Pillow

# Create a .env file with the following variables
# SECRET_KEY=your-secret-key
# DEBUG=True
# ALLOWED_HOSTS=localhost,127.0.0.1

# Run migrations
python manage.py migrate

# (Optional) Load sample data
python manage.py seed_data

# Start the development server
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` in your browser.

## Running Tests

```bash
python manage.py test core --verbosity=2
```

21 unit tests covering models, authentication, recipe CRUD, shopping list aggregation, and view access control.

## Project Structure

```
foodme-project/
├── core/               # Shared utilities, tests, management commands
├── recipes/            # Recipe, Ingredient, Tag, RecipeStep models & views
├── mealplanner/        # MealPlan, MealPlanDay, MealPlanEntry models & views
├── shopping/           # ShoppingList, ShoppingItem models & views
├── users/              # Authentication, profile, dashboard, analytics views
├── templates/          # Django HTML templates (extends base.html)
├── static/
│   ├── css/style.css   # Custom styles with CSS variables
│   ├── js/main.js      # Client-side interactivity
│   └── img/            # Logo, favicon, placeholders
├── media/              # User-uploaded recipe images
└── manage.py
```

## Team

- **Ivan Germanoff** (2542890G) — Backend: models, views, URL routing, authentication
- **Runmeng Chen** (3092353C) — Frontend enhancements: filtering, validation, charts, deployment, video production
- **Jingxin Yang** (3096032Y) — Frontend scaffolding: templates, layout, Bootstrap styling
