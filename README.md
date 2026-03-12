# FoodMe - Recipe & Meal Planning Web Application

A Django-based web application for managing recipes, planning weekly meals, and generating shopping lists.

**Group B** — Ivan Germanoff · Runmeng Chen · Jingxin Yang

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)

### Setup & Run

```bash
# 1. Clone the repository (or unzip the project)
git clone <your-repo-url>
cd foodme-project

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate          # Windows

# 3. Install dependencies
pip install django==5.2

# 4. Run database migrations
python manage.py migrate

# 5. (Optional) Create a superuser for the admin panel
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
```

Then open **http://127.0.0.1:8000/** in your browser.

### Running Tests
```bash
python manage.py test
```

---

## Project Structure

```
foodme-project/
├── core/                       # Django app (views, models, urls)
│   ├── models.py               # Database models (TODO: backend)
│   ├── views.py                # View functions rendering templates
│   ├── urls.py                 # URL routing (named routes)
│   └── ...
├── foodme_project/             # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── templates/                  # HTML templates (Django template language)
│   ├── base.html               # Base layout (navbar, footer, Chart.js CDN)
│   ├── dashboard.html          # Dashboard with stats + quick actions
│   ├── login.html              # Login + Signup forms with validation
│   ├── recipes.html            # Recipe library with search + tag filtering
│   ├── recipe_detail.html      # Single recipe view
│   ├── add_recipe.html         # Create/edit recipe form
│   ├── meal_planner.html       # Weekly meal planner grid
│   ├── shopping_list.html      # Shopping list with check-off + add items
│   ├── analytics.html          # Chart.js data visualisation
│   └── profile.html            # User profile settings
├── static/
│   ├── css/style.css           # Custom styles (theme variables, overrides)
│   ├── js/main.js              # All front-end interactivity (~430 lines)
│   └── img/                    # Static images
│       ├── logo.svg            # FoodMe egg logo
│       ├── favicon.ico         # Browser tab icon
│       ├── recipe_placeholder.svg  # Fallback when recipe image fails
│       └── default_user.svg    # Default user avatar
├── manage.py                   # Django management script
└── README.md                   # This file
```

---

## Available Pages

| URL | Page | Description |
|-----|------|-------------|
| `/` | Dashboard | Stats overview, recent recipes, quick actions |
| `/login/` | Login / Sign Up | Authentication forms with client-side validation |
| `/recipes/` | Recipe Library | Searchable, filterable recipe grid |
| `/recipe-detail/` | Recipe Detail | Full recipe with ingredients + instructions |
| `/add-recipe/` | Add Recipe | Create recipe with dynamic steps/ingredients |
| `/planner/` | Meal Planner | Weekly grid, add/remove recipes, week navigation |
| `/shopping-list/` | Shopping List | Check-off items, add custom, print, stats |
| `/analytics/` | Analytics | Chart.js charts with time-range switching |
| `/profile/` | Profile | User settings, dietary preferences, security |

---

## Tech Stack

- **Backend**: Python 3 / Django 5.2 / SQLite
- **Frontend**: HTML5 / CSS3 / JavaScript (vanilla)
- **CSS Framework**: Bootstrap 5.3
- **Charts**: Chart.js 4.4
- **Fonts**: Nunito (Google Fonts)
- **Images**: Unsplash (external CDN links)

---

## Accessibility (WCAG 2.2)

Three improvements from the accessibility plan (Design Spec p.13):

1. **SC 3.3.1 Error Identification** — Shopping list "Add Custom Item" form shows specific error messages for invalid inputs (empty name, negative quantities)
2. **SC 4.1.3 Status Messages** — A hidden `aria-live="polite"` region announces dynamic updates to screen readers without shifting focus
3. **SC 2.1.1 Keyboard Accessible** — Meal planner uses explicit Add/Remove buttons instead of drag-and-drop; all interactive elements are keyboard-focusable

---

## Notes for Backend Integration

The front end is fully built and ready to receive real data. Key integration points:

- **Login/Signup**: `main.js` currently uses `window.location.href` redirect. Replace with `fetch()` POST to Django auth views.
- **Recipe data**: Templates use hardcoded sample recipes. Replace with `{% for recipe in recipes %}` loops from Django context.
- **Shopping list**: Items are currently HTML-only. Wire up to ShoppingList/ShoppingItem models.
- **Analytics**: Chart data is defined as JS objects in `main.js`. Replace with `{{ chart_data|safe }}` from Django views.
- **Meal planner**: Grid cells use `data-day` and `data-meal` attributes. Backend can populate via template context.

See `FRONTEND_CHANGES.md` for full details.
