from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .serializers import UserSerializer, LoginSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Note, SharedNote
from .serializers import NoteSerializer, SharedNoteSerializer, ShareNoteSerializer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
import uuid
User = get_user_model()

class SignupView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        access = AccessToken.for_user(user)
        response_data = {
            'refresh': str(refresh),
            'access': str(access),
            'user': UserSerializer(user).data
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if email:
            request.data['email'] = email.lower()
        
        password = request.data.get('password')
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            
            response_data = {
                'refresh': data['refresh'],
                'access': data['access'],
                'user': data.get('user')
            }
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    
class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
        except (TokenError, InvalidToken) as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class ProtectedView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        print("Authenticated user:", request.user)
        print("Auth header:", request.headers.get('Authorization'))
        
        return Response({
            "message": f"Hello {request.user.email}!",
            "user": {
                "id": request.user.id,
                "email": request.user.email
            }
        })





User = get_user_model()


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
class AllUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        if not users:
            return Response({"message": "No users found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_notes = Note.objects.filter(author=user)
        shared_notes = Note.objects.filter(shared_with__shared_with=user)
        public_notes = Note.objects.filter(visibility='public')
        return (user_notes | shared_notes | public_notes).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        note = serializer.save(author=self.request.user)
        if note.visibility == 'public' and not note.public_token:
            note.public_token = str(uuid.uuid4())[:12]
            note.save()

    def perform_update(self, serializer):
        note = serializer.save()
        if note.visibility == 'public' and not note.public_token:
            note.public_token = str(uuid.uuid4())[:12]
            note.save()

    @action(detail=False, methods=['get'])
    def filtered(self, request): 
        visibility = request.query_params.get('visibility', None)
        search = request.query_params.get('search', None)
        tags = request.query_params.get('tags', None)

        queryset = self.get_queryset()

        if visibility in ['private', 'shared', 'public']:
            queryset = queryset.filter(visibility=visibility)
        
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(content__icontains=search) |
                models.Q(tags__icontains=search)
            )
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            for tag in tag_list:
                queryset = queryset.filter(tags__icontains=tag)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        note = self.get_object()
        if note.author != request.user:
            return Response(
                {'error': 'Only author can share'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = ShareNoteSerializer(data=request.data)
        
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                user_to_share = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User with this username does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if SharedNote.objects.filter(note=note, shared_with=user_to_share).exists():
                return Response(
                    {'error': 'Note already shared with this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            SharedNote.objects.create(
                note=note,
                shared_with=user_to_share,
                shared_by=request.user
            )
            
            if note.visibility == 'private':
                note.visibility = 'shared'
                note.save()
            
            return Response(
                {'success': f'Note shared with {username}'},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SharedNoteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SharedNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SharedNote.objects.filter(
            shared_with=self.request.user
        ).order_by('-shared_at')

    @action(detail=False, methods=['get'])
    def by_me(self, request):
        shared_notes = SharedNote.objects.filter(
            shared_by=self.request.user
        ).order_by('-shared_at')
        serializer = self.get_serializer(shared_notes, many=True)
        return Response(serializer.data)

