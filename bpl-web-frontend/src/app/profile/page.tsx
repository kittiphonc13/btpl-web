'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard, useAuth } from '@/context/AuthContext';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';

export default function Profile() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(null);
  const [medicalConditions, setMedicalConditions] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      // Add proper headers to avoid 406 Not Acceptable errors
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select(`full_name, nickname, date_of_birth, medical_conditions, gender`)
        .eq('user_id', user?.id)
        .single()
        .throwOnError();

      // Status 406 means no profile exists yet, which is not an error
      if (status === 406) {
        console.log('No profile exists yet, ready for creation');
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setNickname(data.nickname || '');
        setDateOfBirth(data.date_of_birth ? dayjs(data.date_of_birth) : null);
        setMedicalConditions(data.medical_conditions || '');
        setGender(data.gender || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // Don't show 406 errors to the user as they're expected when profile doesn't exist
      if (error.code !== 'PGRST116') {
        setError(error.message);
      }
    }
  }

  async function updateProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const updates = {
        user_id: user?.id,
        full_name: fullName,
        nickname,
        date_of_birth: dateOfBirth ? dateOfBirth.format('YYYY-MM-DD') : null,
        medical_conditions: medicalConditions,
        gender,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_profiles').upsert(updates);

      if (error) {
        throw error;
      }
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">User Profile</h2>
          <form onSubmit={updateProfile}>
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                Full Name:
              </label>
              <TextField
                fullWidth
                id="fullName"
                variant="outlined"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                margin="normal"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-gray-700 text-sm font-bold mb-2">
                Nickname:
              </label>
              <TextField
                fullWidth
                id="nickname"
                variant="outlined"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                margin="normal"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="dateOfBirth" className="block text-gray-700 text-sm font-bold mb-2">
                Date of Birth:
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dateOfBirth}
                  onChange={(newValue) => setDateOfBirth(newValue)}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </LocalizationProvider>
            </div>
            <div className="mb-4">
              <label htmlFor="medicalConditions" className="block text-gray-700 text-sm font-bold mb-2">
                Medical Conditions:
              </label>
              <TextField
                fullWidth
                id="medicalConditions"
                variant="outlined"
                multiline
                rows={4}
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                margin="normal"
              />
            </div>
            <div className="mb-6">
              <FormControl fullWidth margin="normal">
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  id="gender"
                  value={gender}
                  label="Gender"
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            {message && <p className="text-green-500 text-xs italic mb-4">{message}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
