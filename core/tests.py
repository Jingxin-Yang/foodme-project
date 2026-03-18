from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from recipes.models import Recipe, Tag, Ingredient, RecipeIngredient, RecipeStep
from mealplanner.models import MealPlan, MealPlanDay, MealPlanEntry
from shopping.models import ShoppingList, ShoppingItem
from shopping.views import _generate_items_from_plan
from datetime import date, timedelta


# ──────────────────────────────────────────────
# MODEL TESTS
# ──────────────────────────────────────────────

class RecipeModelTest(TestCase):
    """Tests for Recipe, RecipeIngredient, RecipeStep models."""

    def setUp(self):
        self.user = User.objects.create_user(username="testchef", password="pass1234")
        self.tag = Tag.objects.create(name="Keto")
        self.ingredient = Ingredient.objects.create(name="Chicken Breast")

    def test_create_recipe(self):
        recipe = Recipe.objects.create(user=self.user, title="Grilled Chicken")
        self.assertEqual(recipe.title, "Grilled Chicken")
        self.assertEqual(recipe.user, self.user)
        self.assertEqual(str(recipe), "Grilled Chicken")

    def test_recipe_tag_many_to_many(self):
        recipe = Recipe.objects.create(user=self.user, title="Keto Bowl")
        recipe.tags.add(self.tag)
        self.assertIn(self.tag, recipe.tags.all())

    def test_recipe_ingredient_junction(self):
        recipe = Recipe.objects.create(user=self.user, title="Simple Chicken")
        ri = RecipeIngredient.objects.create(
            recipe=recipe, ingredient=self.ingredient, quantity=2.0, unit="lbs"
        )
        self.assertEqual(ri.quantity, 2.0)
        self.assertEqual(ri.unit, "lbs")
        self.assertEqual(recipe.recipe_ingredients.count(), 1)

    def test_recipe_step_ordering(self):
        recipe = Recipe.objects.create(user=self.user, title="Step Test")
        RecipeStep.objects.create(recipe=recipe, step_number=2, instruction="Cook it")
        RecipeStep.objects.create(recipe=recipe, step_number=1, instruction="Prep it")
        steps = list(recipe.steps.all())
        self.assertEqual(steps[0].instruction, "Prep it")
        self.assertEqual(steps[1].instruction, "Cook it")

    def test_recipe_cascade_delete(self):
        """Deleting a user should delete all their recipes."""
        Recipe.objects.create(user=self.user, title="Will be deleted")
        self.assertEqual(Recipe.objects.filter(user=self.user).count(), 1)
        self.user.delete()
        self.assertEqual(Recipe.objects.count(), 0)


class ShoppingListModelTest(TestCase):
    """Tests for ShoppingList and ShoppingItem models."""

    def setUp(self):
        self.user = User.objects.create_user(username="shopper", password="shop1234")

    def test_create_shopping_list_and_items(self):
        sl = ShoppingList.objects.create(user=self.user)
        item = ShoppingItem.objects.create(
            shopping_list=sl, name="Milk", quantity=2.0, unit="bottles"
        )
        self.assertEqual(sl.items.count(), 1)
        self.assertFalse(item.purchased)

    def test_toggle_purchased(self):
        sl = ShoppingList.objects.create(user=self.user)
        item = ShoppingItem.objects.create(
            shopping_list=sl, name="Eggs", quantity=12, unit="pcs"
        )
        item.purchased = True
        item.save()
        item.refresh_from_db()
        self.assertTrue(item.purchased)


# ──────────────────────────────────────────────
# SHOPPING LIST AGGREGATION TEST
# ──────────────────────────────────────────────

class ShoppingListGenerationTest(TestCase):
    """Tests the core smart aggregation logic (M3 user story)."""

    def setUp(self):
        self.user = User.objects.create_user(username="planner", password="plan1234")
        self.chicken = Ingredient.objects.create(name="Chicken")
        self.rice = Ingredient.objects.create(name="Rice")

        # two recipes that share chicken
        self.r1 = Recipe.objects.create(user=self.user, title="Chicken Stir Fry")
        RecipeIngredient.objects.create(recipe=self.r1, ingredient=self.chicken, quantity=1.5, unit="lbs")
        RecipeIngredient.objects.create(recipe=self.r1, ingredient=self.rice, quantity=2.0, unit="cups")

        self.r2 = Recipe.objects.create(user=self.user, title="Chicken Salad")
        RecipeIngredient.objects.create(recipe=self.r2, ingredient=self.chicken, quantity=1.0, unit="lbs")

        # create a meal plan with both recipes
        self.plan = MealPlan.objects.create(user=self.user, week_start=date.today())
        day = MealPlanDay.objects.create(meal_plan=self.plan, date=date.today())
        MealPlanEntry.objects.create(day=day, recipe=self.r1, meal_type="lunch")
        MealPlanEntry.objects.create(day=day, recipe=self.r2, meal_type="dinner")

    def test_ingredients_are_merged(self):
        """Shared ingredients should have their quantities summed."""
        sl = ShoppingList.objects.create(user=self.user, meal_plan=self.plan)
        _generate_items_from_plan(sl, self.plan)
        items = sl.items.all()
        self.assertEqual(items.count(), 2)  # chicken + rice, not 3

        chicken_item = items.get(name="Chicken")
        self.assertEqual(chicken_item.quantity, 2.5)  # 1.5 + 1.0

        rice_item = items.get(name="Rice")
        self.assertEqual(rice_item.quantity, 2.0)


# ──────────────────────────────────────────────
# AUTHENTICATION VIEW TESTS
# ──────────────────────────────────────────────

class AuthViewTest(TestCase):
    """Tests for registration, login, logout, and access control."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="existing", password="exist123")

    def test_register_creates_user_and_redirects(self):
        resp = self.client.post(reverse("register_user"), {
            "username": "newuser", "password": "new12345", "email": "new@test.com"
        })
        self.assertEqual(resp.status_code, 302)  # redirect to dashboard
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_duplicate_username(self):
        resp = self.client.post(reverse("register_user"), {
            "username": "existing", "password": "whatever1"
        })
        self.assertEqual(resp.status_code, 200)  # stays on page with error
        self.assertContains(resp, "username already taken")

    def test_login_success(self):
        resp = self.client.post(reverse("login_user"), {
            "username": "existing", "password": "exist123"
        })
        self.assertEqual(resp.status_code, 302)

    def test_login_wrong_password(self):
        resp = self.client.post(reverse("login_user"), {
            "username": "existing", "password": "wrongpass"
        })
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "invalid credentials")

    def test_unauthenticated_redirect(self):
        """Accessing a protected page should redirect to login."""
        resp = self.client.get(reverse("recipe_list"))
        self.assertEqual(resp.status_code, 302)
        self.assertIn("login", resp.url)


# ──────────────────────────────────────────────
# RECIPE VIEW TESTS
# ──────────────────────────────────────────────

class RecipeViewTest(TestCase):
    """Tests for recipe CRUD views."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="chef", password="chef1234")
        self.client.login(username="chef", password="chef1234")
        self.ingredient = Ingredient.objects.create(name="Tomato")
        self.tag = Tag.objects.create(name="Vegetarian")

    def test_recipe_list_page_loads(self):
        resp = self.client.get(reverse("recipe_list"))
        self.assertEqual(resp.status_code, 200)

    def test_add_recipe(self):
        resp = self.client.post(reverse("add_recipe"), {
            "title": "Tomato Soup",
            "description": "A warm soup",
            "ingredient_ids": [self.ingredient.id],
            "quantities": ["3"],
            "units": ["pcs"],
            "steps": ["Chop tomatoes", "Boil them"],
            "tag_ids": [self.tag.id],
        })
        self.assertEqual(resp.status_code, 302)
        recipe = Recipe.objects.get(title="Tomato Soup")
        self.assertEqual(recipe.recipe_ingredients.count(), 1)
        self.assertEqual(recipe.steps.count(), 2)
        self.assertIn(self.tag, recipe.tags.all())

    def test_delete_recipe(self):
        recipe = Recipe.objects.create(user=self.user, title="To Delete")
        resp = self.client.post(reverse("recipe_detail", args=[recipe.id]), {
            "_action": "delete"
        })
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Recipe.objects.filter(id=recipe.id).exists())

    def test_cannot_access_other_users_recipe(self):
        other = User.objects.create_user(username="other", password="other123")
        recipe = Recipe.objects.create(user=other, title="Private Recipe")
        resp = self.client.get(reverse("recipe_detail", args=[recipe.id]))
        self.assertEqual(resp.status_code, 404)


# ──────────────────────────────────────────────
# SHOPPING VIEW TESTS
# ──────────────────────────────────────────────

class ShoppingViewTest(TestCase):
    """Tests for shopping list views including adding custom items."""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="buyer", password="buy12345")
        self.client.login(username="buyer", password="buy12345")
        self.sl = ShoppingList.objects.create(user=self.user)

    def test_add_custom_item(self):
        resp = self.client.post(reverse("shopping_items", args=[self.sl.id]), {
            "name": "Bananas", "quantity": "6", "unit": "pcs"
        })
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(self.sl.items.count(), 1)
        self.assertEqual(self.sl.items.first().name, "Bananas")

    def test_duplicate_item_aggregates_quantity(self):
        """Adding the same item twice with the same unit should sum quantities."""
        self.client.post(reverse("shopping_items", args=[self.sl.id]), {
            "name": "Milk", "quantity": "2", "unit": "bottles"
        })
        self.client.post(reverse("shopping_items", args=[self.sl.id]), {
            "name": "Milk", "quantity": "1", "unit": "bottles"
        })
        self.assertEqual(self.sl.items.count(), 1)
        self.assertEqual(self.sl.items.first().quantity, 3.0)

    def test_mark_item_purchased(self):
        item = ShoppingItem.objects.create(
            shopping_list=self.sl, name="Bread", quantity=1, unit="loaf"
        )
        resp = self.client.post(reverse("mark_item_purchased", args=[item.id]))
        item.refresh_from_db()
        self.assertTrue(item.purchased)

    def test_delete_shopping_item(self):
        item = ShoppingItem.objects.create(
            shopping_list=self.sl, name="Butter", quantity=1, unit="stick"
        )
        self.client.post(reverse("delete_shopping_item", args=[item.id]))
        self.assertEqual(self.sl.items.count(), 0)
