'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, AuthGuard } from '@/context/AuthContext';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TextField } from '@mui/material';
import { useValidatedForm, useFormSubmission } from '@/hooks/useValidatedForm';
import { bloodPressureSchema, BloodPressureFormData, sanitizeInput } from '@/lib/validation';
import { SafeError, handleDatabaseError, handleValidationError } from '@/lib/errorHandler';

interface BloodPressureRecord {
  record_id: string;
  record_datetime: string;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  notes: string | null;
  created_at: string;
}

function HomePageContent() {
  const { user } = useAuth(); // AuthGuard ensures user is not null here
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Use validated form with Zod schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useValidatedForm(bloodPressureSchema, {
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      heartRate: 70,
      notes: '',
      recordDateTime: dayjs().toISOString(),
    },
  });

  // Use form submission hook for error handling
  const { submitError, submitSuccess, handleSubmit: handleFormSubmit, clearMessages } = useFormSubmission<BloodPressureFormData>();

  // Watch for date/time changes
  const [recordDateTime, setRecordDateTime] = useState<Dayjs | null>(dayjs());

  async function fetchBloodPressureRecords() {
    try {
      // user is guaranteed to be non-null by AuthGuard
      const { data, error } = await supabase
        .from('blood_pressure_records')
        .select('*')
        .eq('user_id', user!.id)
        .order('record_datetime', { ascending: false })
        .limit(25);

      if (error) {
        throw error;
      }
      setRecords(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  }

  useEffect(() => {
    // No need to check for user here, AuthGuard handles it.
    // fetchBloodPressureRecords will be called because user object is stable
    // after login.
    fetchBloodPressureRecords();
  }, [user]); // Depend on user to refetch if it ever changes.


  const onSubmit = async (data: BloodPressureFormData) => {
    clearMessages();
    
    await handleFormSubmit(async (formData) => {
      try {
        // Sanitize and validate data
        const sanitizedData = {
          user_id: user!.id, // user is guaranteed by AuthGuard
          record_datetime: formData.recordDateTime,
          systolic: sanitizeInput.number(formData.systolic),
          diastolic: sanitizeInput.number(formData.diastolic),
          heart_rate: sanitizeInput.number(formData.heartRate),
          notes: formData.notes ? sanitizeInput.text(formData.notes) : null,
        };

        // Additional business logic validation
        if (sanitizedData.systolic <= sanitizedData.diastolic) {
          throw new Error('Systolic pressure must be higher than diastolic pressure');
        }

        const { error } = await supabase
          .from('blood_pressure_records')
          .insert(sanitizedData);

        if (error) {
          throw handleDatabaseError(error);
        }

        // Clear form and refresh data
        reset({
          systolic: 120,
          diastolic: 80,
          heartRate: 70,
          notes: '',
          recordDateTime: dayjs().toISOString(),
        });
        setRecordDateTime(dayjs());
        fetchBloodPressureRecords(); // Refresh the list
        
      } catch (error: any) {
        if (error instanceof SafeError) {
          throw error;
        }
        throw handleValidationError(error);
      }
    }, data);
  };

  // Handle date/time picker changes
  const handleDateTimeChange = (newValue: Dayjs | null) => {
    setRecordDateTime(newValue);
    if (newValue) {
      setValue('recordDateTime', newValue.toISOString());
    }
  };

  const handleExport = async () => {
    try {
      setExportMessage(null);
      setExportError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // This is a fallback, AuthGuard should prevent this state.
        setExportError('User not authenticated. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:8000/api/blood-pressure-logs/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'blood_pressure_records.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage('Blood pressure records exported successfully!');
    } catch (error: any) {
      setExportError(error.message);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Blood Pressure Dashboard</h2>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

          {/* Form to add new blood pressure record */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Add New Record</h3>
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <div className="mb-4">
                <label htmlFor="recordDateTime" className="block text-gray-700 text-sm font-bold mb-2">
                  Record Date & Time:
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    value={recordDateTime}
                    onChange={(newValue) => setRecordDateTime(newValue)}
                    // renderInput={(params) => <TextField {...params} fullWidth required margin="normal" />}
                  />
                </LocalizationProvider>
              </div>
              <div className="mb-4">
                <label htmlFor="systolic" className="block text-gray-700 text-sm font-bold mb-2">
                  Systolic (mmHg):
                </label>
                <TextField
                  fullWidth
                  id="systolic"
                  variant="outlined"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  required
                  margin="normal"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="diastolic" className="block text-gray-700 text-sm font-bold mb-2">
                  Diastolic (mmHg):
                </label>
                <TextField
                  fullWidth
                  id="diastolic"
                  variant="outlined"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  required
                  margin="normal"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="heartRate" className="block text-gray-700 text-sm font-bold mb-2">
                  Heart Rate (bpm):
                </label>
                <TextField
                  fullWidth
                  id="heartRate"
                  variant="outlined"
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  required
                  margin="normal"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                  Notes:
                </label>
                <TextField
                  fullWidth
                  id="notes"
                  variant="outlined"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Record
              </button>
            </form>
          </div>

          {/* Display latest 25 blood pressure records */}
          <h3 className="text-xl font-bold mb-4">Latest 25 Blood Pressure Records</h3>
          {records.length === 0 ? (
            <p>No blood pressure records found. Add your first record!</p>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Date & Time</th>
                    <th className="py-2 px-4 border-b">Systolic</th>
                    <th className="py-2 px-4 border-b">Diastolic</th>
                    <th className="py-2 px-4 border-b">Heart Rate</th>
                    <th className="py-2 px-4 border-b">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.record_id}>
                      <td className="py-2 px-4 border-b">{new Date(record.record_datetime).toLocaleString()}</td>
                      <td className="py-2 px-4 border-b">{record.systolic}</td>
                      <td className="py-2 px-4 border-b">{record.diastolic}</td>
                      <td className="py-2 px-4 border-b">{record.heart_rate}</td>
                      <td className="py-2 px-4 border-b">{record.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Export to Excel button */}
          <button
            onClick={handleExport}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Export to Excel
          </button>
        </div>
      </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}
