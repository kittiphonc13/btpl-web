# Blood Pressure Dashboard Redesign Plan

## Current Design
- Form for adding new blood pressure records is displayed directly on the main dashboard
- Latest 25 blood pressure records are displayed in a table below the form
- Export to Excel button is placed at the bottom of the table

## New Design Requirements
- Main view should focus on the data table showing blood pressure records
- Add a "+" button in the top-right corner of the data table section
- Clicking the "+" button should open a modal popup with the form to add new records
- Keep the Export to Excel functionality
- Ensure the design is responsive, accessible, and user-friendly

## UI Components

### 1. Data Table
- Display latest blood pressure records in a clean, organized table
- Include columns: Date & Time, Systolic, Diastolic, Heart Rate, Notes
- Add sorting functionality (optional)
- Ensure responsive design for mobile devices
- Maintain the existing export to Excel button

### 2. Add Record Button
- Position: Top-right of the data table section
- Style: Blue button with "+" icon and possibly text "Add Record"
- Accessibility: Ensure proper aria-label and keyboard focus

### 3. Modal Popup
- Triggered by clicking the Add Record button
- Contains the same form fields as the current implementation:
  - Record Date & Time (with date picker)
  - Systolic pressure (mmHg)
  - Diastolic pressure (mmHg)
  - Heart Rate (bpm)
  - Notes (text area)
- Include Submit and Cancel buttons
- Implement focus trap for keyboard accessibility
- Close on ESC key, clicking outside, or Cancel button

## Technical Implementation

### Components to Modify
1. `src/app/page.tsx` or `src/app/home/page.tsx` (main dashboard)
   - Remove inline form
   - Add button to open modal
   - Keep data table implementation

### Components to Create
1. `src/components/AddBloodPressureModal.tsx`
   - Modal component with form
   - Form validation logic
   - Submit handling

### Accessibility Considerations
- Ensure modal has proper ARIA attributes (`role="dialog"`, `aria-labelledby`, etc.)
- Implement focus trap inside modal when open
- Ensure all form fields have proper labels
- Add keyboard navigation support (ESC to close, Tab trap)
- Ensure high contrast and readable text

### Responsive Design
- Modal should be properly sized on all devices
- On mobile: Consider full-screen modal or appropriate sizing
- Ensure data table is scrollable horizontally on small screens

## Implementation Steps

1. Create the modal component with the form
2. Modify the dashboard page to remove inline form
3. Add button to open modal
4. Connect modal to existing form submission logic
5. Style components for consistency with existing design
6. Test for accessibility and responsiveness
7. Add any additional animations or transitions

## Testing Scenarios

### Functional Testing
- Modal opens when Add Record button is clicked
- Form in modal contains all required fields
- Form validation works correctly
- Submission successfully adds record to database
- Modal closes after successful submission
- Modal closes when Cancel button is clicked
- Modal closes when clicking outside or pressing ESC

### Accessibility Testing
- Screen readers can announce modal opening
- Focus is trapped inside modal when open
- All form controls are properly labeled
- Keyboard navigation works correctly
- High contrast mode displays correctly

### Responsive Testing
- Test on desktop, tablet, and mobile viewports
- Ensure modal and table display correctly on all sizes
- Verify usability on touch devices

## Mock Design

```
+---------------------------------------------+
|                                       Logout|
+---------------------------------------------+
| Blood Pressure Dashboard           [+ Add] |
|                                            |
| Latest Blood Pressure Records              |
|                                            |
| +------------------------------------------+
| | Date & Time | Systolic | Diastolic | HR |
| |-------------|----------|-----------|-----|
| | 08/01/2025  |    120   |    80     | 70 |
| | 08/01/2025  |    120   |    80     | 70 |
| | ...         |    ...   |    ...    | .. |
| +------------------------------------------+
|                              [Export Excel] |
+---------------------------------------------+

Modal Popup:
+------------------------------------------+
| Add New Blood Pressure Record         [X]|
|                                          |
| Record Date & Time:                      |
| [08/01/2025 05:05 PM           🗓️ ]     |
|                                          |
| Systolic (mmHg):                         |
| [120                               ]     |
|                                          |
| Diastolic (mmHg):                        |
| [80                                ]     |
|                                          |
| Heart Rate (bpm):                        |
| [70                                ]     |
|                                          |
| Notes:                                   |
| [                                  ]     |
| [                                  ]     |
|                                          |
| [Cancel]                    [Add Record] |
+------------------------------------------+
```

## Next Steps
1. Review this plan with stakeholders
2. Prioritize implementation tasks
3. Create component structure
4. Implement UI changes
5. Test thoroughly
6. Deploy updates
