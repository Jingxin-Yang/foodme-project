# Front-End Changes Documentation

**Author**: Runmeng Chen (3092353C) — front-end enhancements & interactivity
**Date**: March 2026
**Base version**: `foodme-project-master` (initial front-end scaffolding by Jingxin Yang)

This document describes every change made to the front end, organised by file. It is written for two audiences:

- **Jingxin (front-end scaffolding)** — so you can see exactly what was modified from your original templates
- **Ivan (back-end)** — so you know what hooks, IDs, and data attributes are available for wiring up Django views and models

---

## Summary of What Changed

| Area | Before (master) | After (fixed) |
|------|-----------------|---------------|
| Dead links / buttons | 12+ buttons with `href="#"` or no link | All buttons navigate to correct pages |
| Recipe data | Grey placeholder bars `[RECIPE IMAGE]` | 6 named recipes with Unsplash images |
| Tag filtering | Buttons existed but did nothing | JS filters cards by tag in real time |
| Search | Input existed but did nothing | JS filters cards by title as you type |
| Shopping list stats | Hardcoded numbers (13, 4, 9, 12) | JS auto-updates on every checkbox change |
| Shopping list form | No JS validation | Full validation: empty name, negative qty, zero qty (M4) |
| Shopping list actions | CLEAR/RESET/PRINT buttons did nothing | All three functional (PRINT uses `window.print()`) |
| Analytics charts | CSS `div` bars faking a chart | 4 real Chart.js charts (bar, horizontal bar, doughnut, line) |
| Analytics time range | Buttons did nothing | 5 ranges (Week/Month/3Mo/Year/All) each with different data |
| Meal planner | Remove buttons did nothing | Remove works; Add to Plan works with day+meal selector |
| Week navigation | `<` `>` did nothing | JS updates week title and day numbers |
| Login form | No validation, no redirect | Validates email+password, redirects to `/` |
| Signup form | Alert on success | Shows success message, redirects to `/` |
| Nav active state | No highlighting | Current page nav link is green + underlined |
| Nav spelling | "ANALTICS" | "ANALYTICS" |
| Duplicate logo | FoodMe text appeared twice in navbar | Single SVG logo on the left only |
| Favicon | None | Egg-shaped favicon in browser tab |
| Logo | Text only | SVG egg icon matching design spec |
| Recipe images | Grey boxes with `[RECIPE IMAGE]` text | Unsplash photos with `onerror` fallback |
| Dashboard data | Black bars and `[IMG]` boxes | Real recipe names, thumbnails, plan text |
| Accessibility | None implemented | 3 WCAG 2.2 improvements (see below) |
| Comments | Chinese | English throughout |

---

## New Files Added

| File | Purpose |
|------|---------|
| `static/img/logo.svg` | FoodMe egg logo (navbar + login page) |
| `static/img/favicon.ico` | Browser tab icon (32×32 egg) |
| `static/img/recipe_placeholder.svg` | Fallback image when Unsplash fails to load |
| `static/img/default_user.svg` | Default avatar (for future profile photo feature) |
| `README.md` | Project setup and run instructions |
| `FRONTEND_CHANGES.md` | This file |

---

## File-by-File Changes

### `templates/base.html` (shared layout)

**What changed:**
1. Added `<link rel="icon">` for favicon
2. Added `<script src="chart.js">` CDN for analytics charts
3. Replaced text "FoodMe" navbar brand with `<img src="logo.svg">`
4. Removed the duplicate "FoodMe" brand that appeared on the right side
5. Fixed spelling: `ANALTICS` → `ANALYTICS`
6. Added `{% if request.resolver_match.url_name == '...' %}active{% endif %}` to each nav link so the current page is highlighted
7. Added `<div id="statusAnnouncer" aria-live="polite">` for screen reader announcements (WCAG SC 4.1.3)

**For back-end**: No changes needed. The `{% url 'name' %}` pattern is already used throughout. The `request.resolver_match.url_name` works automatically with Django's URL routing.

---

### `templates/dashboard.html`

**What changed:**
1. "View All" link: `href="#"` → `href="{% url 'recipes' %}"`
2. "Edit Plan" link: `href="#"` → `href="{% url 'meal_planner' %}"`
3. Quick action buttons (PLAN MEALS, SHOPPING LIST, VIEW STATS): changed from `<button>` to `<a href="{% url '...' %}">` so they actually navigate
4. Recent Recipes section: replaced grey `[IMG]` boxes and black bars with real recipe thumbnails (Unsplash 120×120) and text names ("Spicy Thai Basil Chicken", "Grilled Salmon Bowl")
5. This Week's Plan section: replaced black bars with real text ("Monday: Spicy Thai Basil Chicken, Dinner, 25 min")
6. Added `{% load static %}` at top for image paths

**For back-end**: The stat numbers (127, 18, 12, 34) are still hardcoded. Replace with template variables like `{{ total_recipes }}` from a context dictionary in the dashboard view. The recent recipes section should become a `{% for recipe in recent_recipes %}` loop.

---

### `templates/login.html`

**What changed:**
1. Added `id="loginForm"` so JS can bind validation
2. Added `required` attributes and `<div class="invalid-feedback">` error messages to each input
3. Added `id="loginError"` alert div (hidden by default) for login failure messages
4. Added `id="signupSuccess"` alert div for signup success
5. Added FoodMe logo image at top of page
6. JS now validates email format and password non-empty before submission
7. On successful validation, the page redirects to `/` (Dashboard)

**For back-end**: Replace the JS `window.location.href = '/'` with a real `fetch('/login/', { method: 'POST', body: ... })` call. The form fields use standard `id` attributes (`loginEmail`, `loginPassword`, `signupName`, `signupEmail`, `signupPassword`, `confirmPassword`) that you can reference in Django forms or AJAX handlers.

---

### `templates/recipes.html`

**What changed:**
1. Increased from 3 to 6 recipe cards with real names: Spicy Thai Basil Chicken, Grilled Salmon Bowl, Veggie Stir Fry, Beef Tacos, Chicken Alfredo, Oatmeal Bowl
2. Each card now has `data-tags`, `data-title`, `data-time`, `data-servings` attributes for JS filtering/sorting
3. Grey `[RECIPE IMAGE]` placeholders replaced with Unsplash `<img>` tags. Each has `onerror` fallback to `recipe_placeholder.svg`
4. Tag filter buttons (ALL, VEGETARIAN, KETO, etc.) now toggle active style and filter cards via JS
5. Search input (`id="recipeSearchInput"`) filters cards in real time by title
6. Added `id="noRecipeResults"` message shown when no cards match filters
7. Recipe titles now display as `<h6>` text instead of black CSS bars

**For back-end**: This entire page should be driven by a `{% for recipe in recipes %}` loop. Each card's `data-tags` should come from `{{ recipe.tags.all|join:"," }}`. The search/filter JS will still work on the rendered HTML — no API needed for basic filtering. For large datasets, you could add server-side filtering via query parameters.

---

### `templates/recipe_detail.html`

**What changed:**
1. Replaced the grey `[APPETIZING RECIPE IMAGE]` placeholder with an Unsplash image (800×500, `object-fit: cover`) with `onerror` fallback
2. Added `{% load static %}` for the fallback image path

**For back-end**: Replace the hardcoded Unsplash URL with `{{ recipe.image.url }}` (from an `ImageField`). The `onerror` fallback will still work if the image file is missing.

---

### `templates/meal_planner.html`

**What changed:**
1. "GENERATE SHOPPING LIST →" changed from `<button>` to `<a href="{% url 'shopping_list' %}">` with `id="generateListBtn"`
2. Week navigation `<` `>` buttons now have IDs (`weekPrev`, `weekNext`). JS updates the title and day numbers when clicked
3. Table cells now have `data-day` and `data-meal` attributes (e.g. `data-day="mon" data-meal="breakfast"`)
4. Pre-filled 9 sample meals with real recipe names instead of black bars
5. Remove buttons now actually remove the recipe card from the cell via JS
6. Bottom section: added day selector (`planDaySelect`) and meal-slot selector (`planMealSlot`) dropdowns
7. "Add to Plan" buttons read the selected day+meal, find the cell, and insert a recipe card
8. Grey image placeholders in the bottom recipe cards replaced with Unsplash photos

**For back-end**: The `data-day` and `data-meal` attributes on each `<td>` are designed for easy backend population. You can loop `{% for plan in week_plans %}` and place recipe cards in the matching cells. When the user clicks "Add to Plan", the JS currently manipulates the DOM only — you'll want to add a `fetch('/api/plan/add/', ...)` call to persist to the MealPlan model.

---

### `templates/shopping_list.html`

**What changed:**
1. Stat cards (Total/Checked/Remaining/From Recipes) now start at 0 and are updated by JS on every checkbox change
2. Each shopping item `<li>` has `data-from="recipe"` or `data-from="custom"` to distinguish auto-generated from manual items
3. Checkbox change handler: adds/removes `text-decoration-line-through`, `bg-light` classes and updates stats
4. Each item has a `✕` delete button (`delete-item-btn` class) that removes the item from the DOM
5. "Add Custom Item" form (`id="customItemForm"`):
   - Validates item name is not empty
   - Validates quantity is not negative (User Story M4) and not zero
   - Shows specific error messages per field (WCAG SC 3.3.1)
   - On success: creates a new `<li>`, appends to list, rebinds events, updates stats
6. Added unit selector dropdown (`id="itemUnit"`: pieces, lbs, kg, g, ml, cups, tbsp)
7. "Add From Recipes" `+` buttons now have `data-ingredients` JSON attributes. Clicking adds all ingredients as new list items
8. "CLEAR CHECKED ITEMS" (`id="clearCheckedBtn"`): removes all checked items
9. "RESET LIST" (`id="resetListBtn"`): clears entire list after confirmation
10. "PRINT" (`id="printListBtn"`): calls `window.print()` (CSS hides nav/buttons in print media)
11. "EMAIL" (`id="emailListBtn"`): shows alert explaining backend SMTP is needed
12. Edit buttons changed to delete (✕) buttons for clearer UX

**For back-end**: Each list item should be a `ShoppingItem` model instance. The "Generate Shopping List" feature (from Meal Planner) should query all recipes in the current week's MealPlan, extract their ingredients, merge duplicates (Smart Aggregation from the design spec), and create ShoppingItem rows. The JS will still handle the check/uncheck UI — but you'll want to persist the `is_checked` state via AJAX.

---

### `templates/analytics.html`

**What changed:**
1. Removed all CSS-simulated charts (the `div` bars with percentage heights)
2. Added 4 `<canvas>` elements for Chart.js:
   - `cookingFrequencyChart` — vertical bar chart (meals per period)
   - `mostCookedChart` — horizontal bar chart (top 5 recipes)
   - `mealTypeChart` — doughnut chart (tag distribution)
   - `weeklyTrendChart` — line chart (cooking trend over time)
3. Time-range buttons (WEEK/MONTH/3MONTHS/YEAR/ALL TIME) have `data-range` attributes. Clicking:
   - Toggles the button style (active = dark, others = outline)
   - Destroys and recreates all 4 charts with new data
   - Updates the stat cards (Meals Cooked, Unique Recipes, etc.)
   - Updates the "Showing: ..." label
4. 5 complete datasets defined in `main.js` (`analyticsData` object)
5. Stat card numbers update dynamically with each time-range switch

**For back-end**: Replace the `analyticsData` object in `main.js` with data from Django. The easiest approach: in your analytics view, compute the stats and pass them as JSON:
```python
context = {
    'chart_data': json.dumps({
        'month': { 'meals': 42, 'frequency': {'labels': [...], 'data': [...]}, ... }
    })
}
```
Then in the template: `const analyticsData = {{ chart_data|safe }};`

---

### `templates/add_recipe.html`

**What changed (JS only, template unchanged):**
1. "Add Another Step" button now dynamically appends a new numbered step with a textarea
2. "Add Ingredient" button appends a new amount + name input row
3. All `✕` buttons (existing and dynamically added) remove their parent row
4. Form submit validates that recipe title is not empty, then redirects to `/recipes/`

**For back-end**: The form currently has no `action` URL or `name` attributes on inputs. You'll need to:
- Add `name` attributes to all inputs (e.g. `name="title"`, `name="step_1"`, etc.)
- Set `action="{% url 'add_recipe' %}"` and add `{% csrf_token %}`
- Handle the dynamic steps/ingredients in your view (they arrive as numbered fields)

---

### `templates/profile.html`

**No changes from master**. Bootstrap pills tab switching already works. Forms are placeholder-only.

**For back-end**: Add `action`, `method="POST"`, `{% csrf_token %}`, and `name` attributes to each form. Wire up to User model updates.

---

### `static/css/style.css`

**What was added (appended to existing styles):**
1. `.nav-link.active` — green colour, bold weight, 3px bottom border for current-page highlighting
2. `@media print` — hides navbar, buttons, and the status announcer when printing the shopping list
3. `.shopping-item` — `transition` for smooth background-colour change on checkbox toggle
4. `.meal-cell:empty:hover` — light green background hint on empty meal planner cells

**All original styles are unchanged.** The theme variables, card styles, navbar styles, and button overrides from the master version are exactly as they were.

---

### `static/js/main.js`

**Completely rewritten** (~430 lines). The original file only had signup form validation (~80 lines). The new file includes:

| Section | Lines | Function |
|---------|-------|----------|
| 1. Utility functions | ~25 | `showError()`, `clearError()`, `announce()` |
| 2. Password toggle | ~12 | Eye icon on all password fields |
| 3. Login form | ~30 | Email/password validation, redirect |
| 4. Signup form | ~55 | Strength check, match check, terms check, redirect |
| 5. Recipe filtering | ~40 | Tag buttons + search input filter cards |
| 6. Shopping list | ~120 | Checkbox stats, add item, delete, clear, reset, print, email, add-from-recipes |
| 7. Meal planner | ~80 | Add/remove recipes, week navigation, generate list |
| 8. Analytics charts | ~140 | 4 Chart.js charts, 5 time-range datasets, dynamic switching |
| 9. Add recipe | ~40 | Dynamic step/ingredient rows, form validation |
| 10. Recipe detail | ~15 | Favourite toggle, add-to-planner link |

---

## Accessibility Improvements Implemented (WCAG 2.2)

These three improvements were defined in the Design Specification (p.13) and are now implemented:

1. **SC 3.3.1 Error Identification** — The shopping list "Add Custom Item" form provides explicit, text-based error messages below each field when validation fails. Specifically: "Please enter an item name" for empty names, "Quantity cannot be negative" for negative numbers, and "Quantity must be greater than 0" for zero values.

2. **SC 4.1.3 Status Messages** — A `<div id="statusAnnouncer" aria-live="polite">` element in `base.html` receives text via JS whenever a dynamic action completes (e.g. "3 of 13 items checked off", "Chicken breast removed from shopping list", "Shopping list has been reset"). Screen readers announce this without moving focus.

3. **SC 2.1.1 Keyboard Accessible** — The meal planner uses explicit "Add to Plan" and "Remove" buttons (not drag-and-drop), which are natively keyboard-focusable. All interactive elements (tag filters, checkboxes, delete buttons) are standard HTML elements accessible via Tab/Enter.

---

## What the Back End Still Needs to Implement

| Feature | User Story | What's Needed |
|---------|-----------|---------------|
| User authentication | M1 | Django auth views (login, logout, register), `@login_required` decorators |
| Database models | M2 | Define User, Recipe, Ingredient, Tag, MealPlan, ShoppingList, ShoppingItem per ER diagram |
| Recipe CRUD | M2 | Views to create, read, update, delete recipes; wire forms to models |
| Template data | M2 | Pass querysets via context; replace hardcoded HTML with `{% for %}` loops |
| Auto shopping list | M3 | Query MealPlan → Recipes → Ingredients; merge duplicates; create ShoppingItems |
| Tag filtering (server) | S1 | `Recipe.objects.filter(tags__name=tag)` for large datasets |
| Analytics data | S2 | Aggregate queries on MealPlan (count, group by month, etc.); pass as JSON |
| Email shopping list | C1 | Django `send_mail()` + SMTP config |
| Image upload | C2 | `ImageField` on Recipe model + `MEDIA_ROOT` config |
| Unit tests | Required | Test models, views, and form validation |

