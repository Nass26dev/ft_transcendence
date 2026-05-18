from django.contrib import admin
from .models import *

admin.site.register(Sport)
admin.site.register(Competition)
admin.site.register(Team)
admin.site.register(Match)
admin.site.register(Odds)