from django.urls import path
from . import views

#url.py for shopping list management
#allow users to generat/view/update shopping lists

urlpatterns = [

    #get all shopping lists or create new one
    path("shoppinglists/", views.shoppinglist_list, name="shoppinglist_list"),

    #get specific shopping list
    path("shoppinglists/<int:list_id>/", views.shoppinglist_detail, name="shoppinglist_detail"),

    #get or update items in shopping list
    path("shoppinglists/<int:list_id>/items/", views.shopping_items, name="shopping_items"),

    #marks item as purchased
    path("items/<int:item_id>/purchase/", views.mark_item_purchased, name="mark_item_purchased"),

]