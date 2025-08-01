'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, AuthGuard } from '@/context/AuthContext';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useFormSubmission } from '@/hooks/useValidatedForm';
import { BloodPressureFormData, sanitizeInput } from '@/lib/validation';
import { handleDatabaseError, handleValidationError } from '@/lib/errorHandler';
import AddBloodPressureModal from '@/components/AddBloodPressureModal';

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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Use form submission hook for error handling
  const { submitError, submitSuccess, handleSubmit: handleFormSubmit, clearMessages } = useFormSubmission<BloodPressureFormData>();

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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

        // Refresh the records list
        fetchBloodPressureRecords();
        
        // No return value needed as the function expects void
        setMessage('Blood pressure record added successfully!');
      } catch (error) {
        if (error instanceof Error) {
          throw handleValidationError(error);
        } else {
          throw new Error('An unknown error occurred');
        }
      }
    }, data);
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

          {/* Blood pressure records section with Add button */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Latest Blood Pressure Records</h3>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
                aria-label="Add new blood pressure record"
              >
                Add Record
              </Button>
            </div>

            {records.length === 0 ? (
              <p>No blood pressure records found. Add your first record!</p>
            ) : (
              <>
                {/* Table view for larger screens */}
                <div className="hidden md:block overflow-x-auto mb-6">
                  <table className="min-w-full bg-white" aria-label="Blood pressure records">
                    <caption className="sr-only">Blood pressure measurements history</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="py-2 px-4 border-b text-left">Date & Time</th>
                        <th scope="col" className="py-2 px-4 border-b text-left">Systolic</th>
                        <th scope="col" className="py-2 px-4 border-b text-left">Diastolic</th>
                        <th scope="col" className="py-2 px-4 border-b text-left">Heart Rate</th>
                        <th scope="col" className="py-2 px-4 border-b text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.record_id}>
                          <td className="py-2 px-4 border-b">{new Date(record.record_datetime).toLocaleString()}</td>
                          <td className="py-2 px-4 border-b">{record.systolic} <span className="text-xs text-gray-500">mmHg</span></td>
                          <td className="py-2 px-4 border-b">{record.diastolic} <span className="text-xs text-gray-500">mmHg</span></td>
                          <td className="py-2 px-4 border-b">{record.heart_rate} <span className="text-xs text-gray-500">bpm</span></td>
                          <td className="py-2 px-4 border-b">{record.notes || <span className="text-gray-400 italic">No notes</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Card view for mobile screens */}
                <div className="md:hidden space-y-4 mb-6">
                  {records.map((record) => (
                    <div key={record.record_id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="text-sm font-semibold text-gray-500 mb-2">
                        {new Date(record.record_datetime).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500">Systolic</div>
                          <div className="font-bold">{record.systolic} <span className="text-xs font-normal text-gray-500">mmHg</span></div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Diastolic</div>
                          <div className="font-bold">{record.diastolic} <span className="text-xs font-normal text-gray-500">mmHg</span></div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Heart Rate</div>
                          <div className="font-bold">{record.heart_rate} <span className="text-xs font-normal text-gray-500">bpm</span></div>
                        </div>
                      </div>
                      {record.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">Notes</div>
                          <div className="text-sm">{record.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Export to Excel button */}
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                  onClick={handleExport}
                  variant="contained"
                  color="secondary"
                  className="bg-purple-500 hover:bg-purple-700"
                  aria-label="Export blood pressure records to Excel"
                  disabled={records.length === 0}
                >
                  Export to Excel
                </Button>
                
                {records.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Add records to enable export</p>
                )}
              </div>
              
              {exportError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                  <span className="block sm:inline">{exportError}</span>
                </div>
              )}
              
              {exportMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4" role="alert">
                  <span className="block sm:inline">{exportMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal for adding new blood pressure record */}
          <AddBloodPressureModal 
            open={isModalOpen} 
            onClose={handleCloseModal} 
            onSubmit={onSubmit}
          />
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
