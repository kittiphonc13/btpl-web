import os
import sys
import httpx
from supabase import create_client, Client, ClientOptions

# Add the project root to the Python path to allow importing from config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import SUPABASE_URL, SERVICE_ROLE_KEY

def insert_test_data():
    """Connects to Supabase and inserts a single test record."""
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        print("Error: SUPABASE_URL and SERVICE_ROLE_KEY must be set in config.py")
        return

    try:
        # Initialize the Supabase client using the service role key for admin privileges
        # WARNING: The 'verify: False' option bypasses SSL certificate verification.
        # This is INSECURE and should ONLY be used for local development/testing
        # in environments with proxy or certificate issues. DO NOT USE IN PRODUCTION.
        # Create a pre-configured httpx client to bypass SSL verification
        httpx_client = httpx.Client(verify=False)
        # Pass the custom client via ClientOptions
        options = ClientOptions(httpx_client=httpx_client)
        supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY, options)
        print(f"Successfully connected to Supabase project at {SUPABASE_URL[:25]}...")

        # --- Prepare Data ---
        # Using a unique name to easily identify this test record
        test_user_id = "28462da3-2a2a-4548-92fc-8501f88537a4" # REAL UID from Supabase dashboard
        test_profile = {
            "user_id": test_user_id,
            "full_name": "Manual Insert Test User",
            "date_of_birth": "1995-05-10",
            "gender": "Male"
        }

        # --- Insert Data ---
        print(f"Attempting to insert data into 'user_profiles': {test_profile}")
        response = supabase.table("user_profiles").insert(test_profile).execute()

        # --- Check for Errors ---
        if response.error:
            print(f"\n--- Supabase Error ---")
            print(f"An error occurred: {response.error.message}")
            print(f"Details: {response.error.details}")
            print(f"Hint: {response.error.hint}")
            print(f"----------------------")
            return

        if response.data:
            print("\nSuccess! Data inserted into Supabase.")
            print("Inserted Record:", response.data[0])
        else:
            # Handle cases where the API might not return the data as expected
            print("\nInsertion command executed, but no data was returned. Please check the Supabase dashboard.")
            print("API Response:", response)

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    insert_test_data()
