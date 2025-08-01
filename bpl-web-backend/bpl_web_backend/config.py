import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase Project Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SERVICE_ROLE_KEY = os.getenv("SERVICE_ROLE_KEY")
