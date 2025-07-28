from django.contrib import admin

# Register your models here.

from .models import CustomUser

admin.site.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_active', 'is_staff']
    search_fields = ['email', 'username']
    list_filter = ['is_active', 'is_staff']


from django.contrib import admin
from .models import Note, SharedNote

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'content', 'visibility', 'created_at', 'updated_at', 'public_token' ]
    ordering = ['-updated_at']
    list_filter = ['visibility', 'created_at', 'author']
    search_fields = ['title', 'content', 'tags']
    readonly_fields = ['id', 'created_at', 'updated_at', 'public_token']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(author=request.user)

@admin.register(SharedNote)
class SharedNoteAdmin(admin.ModelAdmin):
    list_display = ['note', 'shared_with', 'shared_by', 'shared_at']
    list_filter = ['shared_at', 'can_edit']
    search_fields = ['note__title', 'shared_with__email', 'shared_by__email']