"""
Medications module for medication management.
"""

from .routes import router
from .models import Medication, MedicationUpdate

__all__ = ["router", "Medication", "MedicationUpdate"]
