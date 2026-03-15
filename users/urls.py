from django.urls import path
from . import views

#defualt django user model so just handling auth

urlpatterns = [

    #register new user
    path("register/", views.register_user, name="register_user"),

    #user login
    path("login/", views.login_user, name="login_user"),

    #user logout
    path("logout/", views.logout_user, name="logout_user"),

    #get current user profile
    path("profile/", views.user_profile, name="user_profile"),

    #dashboard
    path("dashboard/", views.dashboard, name="dashboard"),

    #user stats
    path("analytics/", views.analytics, name="analytics"),

]