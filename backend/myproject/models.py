from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    
    
    

class Note(models.Model):
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('shared', 'Shared'),
        ('public', 'Public'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notes')
    tags = models.CharField(max_length=200, blank=True, help_text="Comma-separated tags")
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    public_token = models.CharField(max_length=50, blank=True, null=True, unique=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.title
    
    def get_tags_list(self):
        """Return tags as a list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def set_tags_list(self, tags_list):
        """Set tags from a list"""
        self.tags = ', '.join(tags_list) if tags_list else ''
    
    def generate_public_token(self):
        """Generate a unique public token for sharing"""
        if not self.public_token and self.visibility == 'public':
            self.public_token = str(uuid.uuid4())[:12]
            self.save()
        return self.public_token

class SharedNote(models.Model):
    """Model to track notes shared with specific users"""
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='shared_with')
    shared_with = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='shared_notes')
    shared_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notes_shared_by_me')
    shared_at = models.DateTimeField(default=timezone.now)
    can_edit = models.BooleanField(default=False)  # For future extension
    
    class Meta:
        unique_together = ['note', 'shared_with']
    
    def __str__(self):
        return f"{self.note.title} shared with {self.shared_username}"