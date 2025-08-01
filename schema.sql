-- Phase 1, Task 2: Database Schema for BPL-Web Project
-- This script is designed for Supabase (PostgreSQL).

-- 1. Table for User Profiles
-- This table stores additional user information, linked to the main auth.users table.
CREATE TABLE public.user_profiles (
    user_id         uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       text NOT NULL,
    nickname        text,
    date_of_birth   date,
    medical_conditions text,
    gender          text,
    created_at      timestamptz DEFAULT now() NOT NULL,
    updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Comment on user_profiles table
COMMENT ON TABLE public.user_profiles IS 'Stores public user profile information.';

-- 2. Table for Medication Logs
-- This table stores medication details for each user.
CREATE TABLE public.medications (
    medication_id   uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_name   text NOT NULL,
    dosage_mg       integer,
    quantity        text,
    intake_time     text[] NOT NULL, -- Array of text for multiple selection
    is_active       boolean DEFAULT true NOT NULL,
    notes           text,
    created_at      timestamptz DEFAULT now() NOT NULL,
    updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Comment on medications table
COMMENT ON TABLE public.medications IS 'Stores medication logs for users.';

-- 3. Table for Blood Pressure Records
-- This table stores daily blood pressure readings for each user.
CREATE TABLE public.blood_pressure_records (
    record_id       uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    record_datetime timestamptz NOT NULL,
    systolic        integer NOT NULL,
    diastolic       integer NOT NULL,
    heart_rate      integer NOT NULL,
    notes           text,
    created_at      timestamptz DEFAULT now() NOT NULL
);

-- Comment on blood_pressure_records table
COMMENT ON TABLE public.blood_pressure_records IS 'Stores blood pressure measurement records.';

-- 4. Enable Row Level Security (RLS) for all tables
-- Important for data privacy: Users should only access their own data.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Policies to ensure users can only manage their own data.

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile."
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile."
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile."
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for medications
CREATE POLICY "Users can view their own medication logs."
    ON public.medications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication logs."
    ON public.medications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication logs."
    ON public.medications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs."
    ON public.medications FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for blood_pressure_records
CREATE POLICY "Users can view their own blood pressure records."
    ON public.blood_pressure_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blood pressure records."
    ON public.blood_pressure_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blood pressure records."
    ON public.blood_pressure_records FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update the `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to call the function before an update
CREATE TRIGGER on_profile_update
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_medication_update
    BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
