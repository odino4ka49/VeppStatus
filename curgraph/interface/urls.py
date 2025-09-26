__author__ = 'oidin'
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('vepp4', views.vepp4, name='v4-index'),
    path('vepp3', views.vepp3, name='v3-index'),
    path('getProgramData', views.getProgramData, name="views-program-data"),
    path('getWeekData', views.getWeekData, name="views-week-data"),
    path('getWeekArray', views.getWeekArray, name="views-week-arr"),
    path('getArrByVar', views.getArrByVar, name="views-arr-var"),
    path('getTickData', views.getTickData, name="views-tick-data"),
]
