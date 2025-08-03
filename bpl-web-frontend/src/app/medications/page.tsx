'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard, useAuth } from '@/context/AuthContext';
import { Autocomplete, TextField, Checkbox, FormControlLabel } from '@mui/material';

interface Medication {
  medication_id: string;
  medicine_name: string;
  dosage_mg: number;
  quantity: string;
  intake_time: string[];
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const commonIntakeTimes = ['08:00', '12:00', '18:00', '22:00'];

export default function Medications() {
  const { user, loading } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for adding/editing medication
  const [showModal, setShowModal] = useState(false);
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [medicineName, setMedicineName] = useState('');
  const [dosageMg, setDosageMg] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  const [intakeTime, setIntakeTime] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  async function fetchMedications() {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setMedications(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  }

  const handleAddMedication = () => {
    setCurrentMedication(null);
    setMedicineName('');
    setDosageMg('');
    setQuantity('');
    setIntakeTime([]);
    setIsActive(true);
    setNotes('');
    setShowModal(true);
  };

  const handleEditMedication = (medication: Medication) => {
    setCurrentMedication(medication);
    setMedicineName(medication.medicine_name);
    setDosageMg(medication.dosage_mg);
    setQuantity(medication.quantity);
    setIntakeTime(medication.intake_time);
    setIsActive(medication.is_active);
    setNotes(medication.notes || '');
    setShowModal(true);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('medication_id', medicationId);

      if (error) {
        throw error;
      }
      setMessage('Medication deleted successfully!');
      fetchMedications(); // Refresh the list
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const medicationData = {
      user_id: user?.id,
      medicine_name: medicineName,
      dosage_mg: Number(dosageMg),
      quantity,
      intake_time: intakeTime,
      is_active: isActive,
      notes,
    };

    try {
      if (currentMedication) {
        // Update existing medication
        const { error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('medication_id', currentMedication.medication_id);

        if (error) throw error;
        setMessage('Medication updated successfully!');
      } else {
        // Add new medication
        const { error } = await supabase
          .from('medications')
          .insert(medicationData);

        if (error) throw error;
        setMessage('Medication added successfully!');
      }
      setShowModal(false);
      fetchMedications(); // Refresh the list
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Medications</h1>
          <button
            onClick={handleAddMedication}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Medication
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Intake Time
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med) => (
                <tr key={med.medication_id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{med.medicine_name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{med.dosage_mg} mg</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{med.intake_time.join(', ')}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span
                      className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                        med.is_active ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-0 ${
                          med.is_active ? 'bg-green-200' : 'bg-red-200'
                        } opacity-50 rounded-full`}
                      ></span>
                      <span className="relative">{med.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                    <button
                      onClick={() => handleEditMedication(med)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMedication(med.medication_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6">
                {currentMedication ? 'Edit Medication' : 'Add New Medication'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="mb-4">
                    <label htmlFor="medicineName" className="block text-gray-700 text-sm font-bold mb-2">
                      Medication Name:
                    </label>
                    <TextField
                      fullWidth
                      id="medicineName"
                      variant="outlined"
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      required
                      margin="normal"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="dosageMg" className="block text-gray-700 text-sm font-bold mb-2">
                      Dosage (mg):
                    </label>
                    <TextField
                      fullWidth
                      id="dosageMg"
                      variant="outlined"
                      type="number"
                      value={dosageMg}
                      onChange={(e) => setDosageMg(Number(e.target.value))}
                      required
                      margin="normal"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">
                      Quantity:
                    </label>
                    <TextField
                      fullWidth
                      id="quantity"
                      variant="outlined"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      margin="normal"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="intakeTime" className="block text-gray-700 text-sm font-bold mb-2">
                      Intake Time (e.g., 08:00, 12:00):
                    </label>
                    <Autocomplete
                      multiple
                      id="intakeTime"
                      options={commonIntakeTimes}
                      freeSolo
                      value={intakeTime}
                      onChange={(_event, newValue) => {
                        setIntakeTime(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder="Add times"
                          margin="normal"
                        />
                      )}
                    />
                  </div>
                  <div className="mb-4 flex items-center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          name="isActive"
                        />
                      }
                      label="Is Active"
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
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (currentMedication ? 'Updating...' : 'Adding...') : (currentMedication ? 'Update Medication' : 'Add Medication')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
