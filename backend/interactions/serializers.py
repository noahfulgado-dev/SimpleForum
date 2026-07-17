from rest_framework import serializers
from interactions.models import Likes
from accounts.serializers import UserSerializer


class LikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Likes
        fields = ['id', 'user', 'topic', 'reply', 'created']
        read_only_fields = ['id', 'user', 'created']
