'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal, Box, TextField, Button, IconButton } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useValidatedForm, useFormSubmission } from '@/hooks/useValidatedForm';
import { bloodPressureSchema, BloodPressureFormData, sanitizeInput } from '@/lib/validation';
import CloseIcon from '@mui/icons-material/Close';

interface AddBloodPressureModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BloodPressureFormData) => Promise<void>;
}

export default function AddBloodPressureModal({ open, onClose, onSubmit }: AddBloodPressureModalProps) {
  // Ref for initial focus
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const modalTitleId = 'modal-blood-pressure-title';
  const modalDescriptionId = 'modal-blood-pressure-description';
  // Form state variables
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(70);
  const [notes, setNotes] = useState<string>('');
  const [recordDateTime, setRecordDateTime] = useState<Dayjs | null>(dayjs());

  // Use validated form with Zod schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
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

  // Handle date/time picker changes
  const handleDateTimeChange = (newValue: Dayjs | null) => {
    setRecordDateTime(newValue);
    if (newValue) {
      setValue('recordDateTime', newValue.toISOString());
    }
  };

  // Handle form submission
  const handleFormSubmission = async (data: BloodPressureFormData) => {
    await onSubmit(data);
    handleClose();
  };

  // Handle modal close and reset form
  const handleClose = () => {
    reset({
      systolic: 120,
      diastolic: 80,
      heartRate: 70,
      notes: '',
      recordDateTime: dayjs().toISOString(),
    });
    setSystolic(120);
    setDiastolic(80);
    setHeartRate(70);
    setNotes('');
    setRecordDateTime(dayjs());
    clearMessages();
    onClose();
  };
  
  // Handle ESC key press
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };
  
  // Set focus when modal opens
  useEffect(() => {
    if (open && initialFocusRef.current) {
      // Short timeout to ensure the modal is fully rendered
      setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby={modalTitleId}
      aria-describedby={modalDescriptionId}
      aria-modal="true"
      role="dialog"
      onKeyDown={handleKeyDown}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxWidth: '100%',
          maxHeight: { xs: '90vh', sm: '80vh' },
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: { xs: 2, sm: 4 },
          borderRadius: 1,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={modalTitleId} className="text-xl font-bold">Add New Blood Pressure Record</h2>
          <IconButton 
            aria-label="Close dialog" 
            onClick={handleClose} 
            size="small"
            ref={initialFocusRef}
          >
            <CloseIcon />
          </IconButton>
        </div>
        
        <p id={modalDescriptionId} className="sr-only">
          Form to add a new blood pressure record with fields for date, systolic and diastolic pressure, heart rate, and notes.
        </p>

        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmission)} className="space-y-4">
          <div>
            <label htmlFor="recordDateTime" className="block text-gray-700 text-sm font-bold mb-2">
              Record Date & Time:
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={recordDateTime}
                onChange={handleDateTimeChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>

          <div>
            <label htmlFor="systolic" className="block text-gray-700 text-sm font-bold mb-2">
              Systolic (mmHg):
            </label>
            <TextField
              fullWidth
              id="systolic"
              variant="outlined"
              type="number"
              value={systolic}
              onChange={(e) => {
                const value = Number(e.target.value);
                setSystolic(value);
                setValue('systolic', value);
              }}
              required
              error={!!errors.systolic}
              helperText={errors.systolic?.message?.toString()}
            />
          </div>

          <div>
            <label htmlFor="diastolic" className="block text-gray-700 text-sm font-bold mb-2">
              Diastolic (mmHg):
            </label>
            <TextField
              fullWidth
              id="diastolic"
              variant="outlined"
              type="number"
              value={diastolic}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDiastolic(value);
                setValue('diastolic', value);
              }}
              required
              error={!!errors.diastolic}
              helperText={errors.diastolic?.message?.toString()}
            />
          </div>

          <div>
            <label htmlFor="heartRate" className="block text-gray-700 text-sm font-bold mb-2">
              Heart Rate (bpm):
            </label>
            <TextField
              fullWidth
              id="heartRate"
              variant="outlined"
              type="number"
              value={heartRate}
              onChange={(e) => {
                const value = Number(e.target.value);
                setHeartRate(value);
                setValue('heartRate', value);
              }}
              required
              error={!!errors.heartRate}
              helperText={errors.heartRate?.message?.toString()}
            />
          </div>

          <div>
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
              onChange={(e) => {
                setNotes(e.target.value);
                setValue('notes', e.target.value);
              }}
              error={!!errors.notes}
              helperText={errors.notes?.message?.toString()}
            />
          </div>

          <div className="flex justify-end items-center gap-8 pt-4">
            <Button 
              variant="outlined" 
              onClick={handleClose}
              className="px-6"
              aria-label="Cancel adding record"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              className="px-6"
              disabled={isSubmitting}
              aria-label="Submit and add new blood pressure record"
            >
              Add Record
            </Button>
          </div>
        </form>
      </Box>
    </Modal>
  );
}
