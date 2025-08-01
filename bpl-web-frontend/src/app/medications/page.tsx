'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
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
    }
  };

  if (loading) {
    return <div>Loading medications...</div>;
  }

  if (!user) {
    return <div>Please log in to view your medications.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">My Medications</h2>
        <button
          onClick={handleAddMedication}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Add New Medication
        </button>

        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        {message && <p className="text-green-500 text-xs italic mb-4">{message}</p>}

        {medications.length === 0 ? (
          <p>No medications found. Add your first medication!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Medicine Name</th>
                  <th className="py-2 px-4 border-b">Dosage (mg)</th>
                  <th className="py-2 px-4 border-b">Quantity</th>
                  <th className="py-2 px-4 border-b">Intake Time</th>
                  <th className="py-2 px-4 border-b">Active</th>
                  <th className="py-2 px-4 border-b">Notes</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.medication_id}>
                    <td className="py-2 px-4 border-b">{med.medicine_name}</td>
                    <td className="py-2 px-4 border-b">{med.dosage_mg}</td>
                    <td className="py-2 px-4 border-b">{med.quantity}</td>
                    <td className="py-2 px-4 border-b">{med.intake_time.join(', ')}</td>
                    <td className="py-2 px-4 border-b">{med.is_active ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-4 border-b">{med.notes}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEditMedication(med)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.medication_id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Medication Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                {currentMedication ? 'Edit Medication' : 'Add New Medication'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="medicineName" className="block text-gray-700 text-sm font-bold mb-2">
                    Medicine Name:
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
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {currentMedication ? 'Update Medication' : 'Add Medication'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
