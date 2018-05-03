__author__ = 'oidin'
from django.conf.urls import url
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^getProgramData', 'interface.views.getProgramData', name="views-program-data"),
    url(r'^getWeekData', 'interface.views.getWeekData', name="views-week-data"),
    url(r'^getWeekArray', 'interface.views.getWeekArray', name="views-week-arr"),
    url(r'^getArrByVar', 'interface.views.getArrByVar', name="views-arr-var"),
    url(r'^getTickData', 'interface.views.getTickData', name="views-tick-data"),
]
