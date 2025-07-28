from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Note, SharedNote

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )


class LoginSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    username_field = 'email'

    def validate(self, attrs):
        attrs['email'] = attrs['email'].lower()
        
        attrs[self.username_field] = attrs['email']
        
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
    
    
    

class NoteSerializer(serializers.ModelSerializer):
    tags_list = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    tags = serializers.CharField(read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)

    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'tags', 'tags_list', 
            'visibility', 'created_at', 'updated_at', 
            'author_username', 'public_token'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author_email', 'public_token']
    
    def create(self, validated_data):
        tags_list = validated_data.pop('tags_list', [])
        note = Note.objects.create(**validated_data)
        note.set_tags_list(tags_list)
        note.save()
        return note
    
    def update(self, instance, validated_data):
        tags_list = validated_data.pop('tags_list', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if tags_list is not None:
            instance.set_tags_list(tags_list)
        
        instance.save()
        return instance
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['tags_list'] = instance.get_tags_list()
        return data


class ShareNoteSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True) 

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required.")
        try:
            user = User.objects.get(username=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this username does not exist.")


class SharedNoteSerializer(serializers.ModelSerializer):
    note = NoteSerializer(read_only=True)
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    shared_by_username = serializers.CharField(source='shared_by.username', read_only=True)

    class Meta:
        model = SharedNote
        fields = ['id', 'note', 'shared_with_username', 'shared_by_username', 'shared_at', 'can_edit']