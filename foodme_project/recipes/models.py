from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


class Tag(models.Model): #label ingredients with tags
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Ingredient(models.Model): #denotes the ingredient itself
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Recipe(models.Model): #relational definition of a recipe
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recipes")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    image = models.ImageField(upload_to="recipes/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    
class RecipeStep(models.Model): #to store recipe steps
    recipe = models.ForeignKey(
        "Recipe",
        on_delete=models.CASCADE,
        related_name="steps"
    )

    step_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    instruction = models.TextField()

    class Meta: #metadata
        ordering = ["step_number"]
        unique_together = ["recipe", "step_number"]

    def __str__(self):
        return f"{self.recipe.title} - Step {self.step_number}"
    
    
class RecipeIngredient(models.Model): #junction table design to avoid redundancy and allow different quantities of ingredients
    #while Ingredient table represents the ingredients themselves, this will represent how each recipe uses an Ingredient object
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name="recipe_ingredients"
    )

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name="ingredient_recipes"
    )

    quantity = models.FloatField(validators=[MinValueValidator(0.01)])
    unit = models.CharField(max_length=20)

    class Meta:
        unique_together = ["recipe", "ingredient"]

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient.name} ({self.recipe.title})"