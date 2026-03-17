import os
import urllib.request
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recipes.models import Recipe, Ingredient, Tag, RecipeIngredient, RecipeStep
from mealplanner.models import MealPlan, MealPlanDay, MealPlanEntry
from shopping.models import ShoppingList, ShoppingItem
from datetime import date, timedelta


def download_image(url, filename):
    #downloads a food image and saves to media/recipes/
    os.makedirs("media/recipes", exist_ok=True)
    path = f"media/recipes/{filename}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as response:
            with open(path, "wb") as f:
                f.write(response.read())
        return f"recipes/{filename}"
    except Exception as e:
        return None


class Command(BaseCommand):
    help = "seeds the database with sample data for demo purposes"

    def handle(self, *args, **kwargs):
        self.stdout.write("clearing existing demo data...")
        User.objects.filter(username="demo").delete()

        #create demo user
        self.stdout.write("creating demo user...")
        user = User.objects.create_user(
            username="demo",
            password="demo1234",
            email="demo@foodme.com"
        )

        #create tags
        self.stdout.write("creating tags...")
        tag_names = ["Vegetarian", "Vegan", "Keto", "High-Protein", "Carnivore", "Quick"]
        tags = {name: Tag.objects.get_or_create(name=name)[0] for name in tag_names}

        #create ingredients
        self.stdout.write("creating ingredients...")
        ingredient_names = [
            "Chicken Breast", "Salmon Fillet", "Ground Beef", "Eggs",
            "Garlic", "Onion", "Tomato", "Spinach", "Broccoli",
            "Olive Oil", "Butter", "Salt", "Black Pepper",
            "Rice", "Pasta", "Flour", "Bread",
            "Milk", "Cheese", "Greek Yogurt",
            "Lemon", "Lime", "Basil", "Parsley", "Chilli",
            "Soy Sauce", "Oyster Sauce", "Honey", "Garlic Powder",
        ]
        ingredients = {name: Ingredient.objects.get_or_create(name=name)[0] for name in ingredient_names}

        #create recipes
        self.stdout.write("creating recipes and downloading images...")

        def make_recipe(title, description, tag_list, ingredient_list, steps_list, image_url, image_filename):
            recipe = Recipe.objects.create(
                user=user,
                title=title,
                description=description,
            )
            recipe.tags.set([tags[t] for t in tag_list])
            for ing, qty, unit in ingredient_list:
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    ingredient=ingredients[ing],
                    quantity=qty,
                    unit=unit,
                )
            for i, step in enumerate(steps_list, start=1):
                RecipeStep.objects.create(
                    recipe=recipe,
                    step_number=i,
                    instruction=step,
                )
            #download and attach image
            self.stdout.write(f"  downloading image for {title}...")
            image_path = download_image(image_url, image_filename)
            if image_path:
                recipe.image = image_path
                recipe.save()
            return recipe

        grilled_salmon = make_recipe(
            "Grilled Salmon",
            "A simple and delicious grilled salmon with lemon and herbs.",
            ["High-Protein", "Keto"],
            [
                ("Salmon Fillet", 2, "fillets"),
                ("Lemon", 1, "whole"),
                ("Olive Oil", 2, "tbsp"),
                ("Garlic", 2, "cloves"),
                ("Basil", 1, "tbsp"),
            ],
            [
                "Preheat grill to medium-high heat.",
                "Brush salmon with olive oil and season with salt and pepper.",
                "Grill for 4-5 minutes each side until cooked through.",
                "Squeeze lemon over the top and garnish with basil.",
            ],
            "https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?w=800",
            "grilled_salmon.jpg"
        )

        chicken_stir_fry = make_recipe(
            "Chicken Stir Fry",
            "Quick and healthy chicken stir fry with vegetables.",
            ["High-Protein", "Quick"],
            [
                ("Chicken Breast", 300, "g"),
                ("Broccoli", 200, "g"),
                ("Soy Sauce", 3, "tbsp"),
                ("Garlic", 3, "cloves"),
                ("Olive Oil", 1, "tbsp"),
                ("Rice", 200, "g"),
            ],
            [
                "Cook rice according to packet instructions.",
                "Slice chicken breast into thin strips.",
                "Heat oil in a wok over high heat and cook chicken until golden.",
                "Add broccoli and garlic, stir fry for 3 minutes.",
                "Add soy sauce and toss to coat. Serve over rice.",
            ],
            "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?w=800",
            "chicken_stir_fry.jpg"
        )

        beef_tacos = make_recipe(
            "Beef Tacos",
            "Flavourful beef tacos with fresh toppings.",
            ["Carnivore"],
            [
                ("Ground Beef", 500, "g"),
                ("Onion", 1, "whole"),
                ("Tomato", 2, "whole"),
                ("Garlic", 2, "cloves"),
                ("Chilli", 1, "whole"),
                ("Lime", 1, "whole"),
            ],
            [
                "Brown ground beef in a pan over medium heat.",
                "Add diced onion, garlic and chilli and cook for 3 minutes.",
                "Season with salt, pepper and a squeeze of lime.",
                "Serve in taco shells with diced tomato.",
            ],
            "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=800",
            "beef_tacos.jpg"
        )

        veggie_pasta = make_recipe(
            "Veggie Pasta",
            "A light and fresh vegetarian pasta dish.",
            ["Vegetarian", "Quick"],
            [
                ("Pasta", 300, "g"),
                ("Tomato", 3, "whole"),
                ("Spinach", 100, "g"),
                ("Garlic", 3, "cloves"),
                ("Olive Oil", 2, "tbsp"),
                ("Cheese", 50, "g"),
            ],
            [
                "Cook pasta in salted boiling water until al dente.",
                "Sauté garlic in olive oil for 1 minute.",
                "Add chopped tomatoes and cook for 5 minutes.",
                "Stir in spinach until wilted.",
                "Toss with pasta and top with grated cheese.",
            ],
            "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?w=800",
            "veggie_pasta.jpg"
        )

        keto_eggs = make_recipe(
            "Keto Scrambled Eggs",
            "Creamy keto-friendly scrambled eggs with cheese.",
            ["Keto", "Vegetarian", "Quick"],
            [
                ("Eggs", 3, "whole"),
                ("Butter", 1, "tbsp"),
                ("Cheese", 30, "g"),
                ("Salt", 1, "pinch"),
                ("Black Pepper", 1, "pinch"),
            ],
            [
                "Crack eggs into a bowl and whisk well.",
                "Melt butter in a non-stick pan over low heat.",
                "Add eggs and stir slowly until just set.",
                "Remove from heat and fold in cheese.",
            ],
            "https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?w=800",
            "keto_eggs.jpg"
        )

        vegan_bowl = make_recipe(
            "Vegan Buddha Bowl",
            "A nourishing vegan bowl packed with goodness.",
            ["Vegan", "Vegetarian"],
            [
                ("Rice", 200, "g"),
                ("Broccoli", 150, "g"),
                ("Spinach", 100, "g"),
                ("Tomato", 2, "whole"),
                ("Olive Oil", 2, "tbsp"),
                ("Lemon", 1, "whole"),
                ("Garlic Powder", 1, "tsp"),
            ],
            [
                "Cook rice and set aside.",
                "Roast broccoli with olive oil and garlic powder at 200C for 20 minutes.",
                "Assemble bowl with rice, broccoli, spinach and tomato.",
                "Drizzle with lemon juice and olive oil.",
            ],
            "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800",
            "vegan_bowl.jpg"
        )

        recipes = [grilled_salmon, chicken_stir_fry, beef_tacos, veggie_pasta, keto_eggs, vegan_bowl]

        #create meal plans across last 2 weeks for analytics data
        self.stdout.write("creating meal plans...")
        today = date.today()
        last_monday = today - timedelta(days=today.weekday())
        prev_monday = last_monday - timedelta(weeks=1)

        for week_start in [prev_monday, last_monday]:
            plan = MealPlan.objects.create(user=user, week_start=week_start)
            for i in range(7):
                day = MealPlanDay.objects.create(
                    meal_plan=plan,
                    date=week_start + timedelta(days=i)
                )
                MealPlanEntry.objects.create(day=day, recipe=keto_eggs, meal_type="breakfast")
                MealPlanEntry.objects.create(day=day, recipe=recipes[i % len(recipes)], meal_type="lunch")
                MealPlanEntry.objects.create(day=day, recipe=recipes[(i + 2) % len(recipes)], meal_type="dinner")

        #generate a shopping list from the latest plan
        self.stdout.write("creating shopping list...")
        latest_plan = MealPlan.objects.filter(user=user).order_by("-week_start").first()
        shopping_list = ShoppingList.objects.create(user=user, meal_plan=latest_plan)

        aggregated = {}
        entries = MealPlanEntry.objects.filter(
            day__meal_plan=latest_plan
        ).prefetch_related("recipe__recipe_ingredients__ingredient")
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

        #mark a few items as purchased for realism
        for item in shopping_list.items.all()[:3]:
            item.purchased = True
            item.save()

        self.stdout.write(self.style.SUCCESS(
            "\nDemo data created successfully!\n"
            "Username: demo\n"
            "Password: demo1234\n"
        ))