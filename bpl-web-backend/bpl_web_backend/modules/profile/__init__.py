"""
Profile module for user profile management.
"""

from .routes import router
from .models import UserProfileUpdate

__all__ = ["router", "UserProfileUpdate"]
