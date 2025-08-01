# Modal Accessibility Testing Checklist

## Focus Management
- [ ] Focus moves to the modal when it opens
- [ ] Focus is trapped inside the modal (can't tab outside)
- [ ] Focus returns to the triggering element when modal closes
- [ ] First focusable element receives focus when modal opens
- [ ] ESC key closes the modal

## ARIA Attributes
- [ ] Modal has `role="dialog"` attribute
- [ ] Modal has `aria-labelledby` attribute pointing to the title ID
- [ ] Modal has `aria-describedby` attribute if there's a description
- [ ] Modal has `aria-modal="true"` to indicate it's a modal dialog
- [ ] Close button has `aria-label="Close"` attribute

## Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and follows visual order
- [ ] Enter key activates buttons
- [ ] ESC key closes the modal
- [ ] No keyboard traps

## Screen Reader Announcements
- [ ] Screen reader announces when modal opens
- [ ] Screen reader announces modal title
- [ ] Form controls have proper labels
- [ ] Error messages are announced by screen reader
- [ ] Screen reader announces when modal closes

## Visual Design
- [ ] Sufficient color contrast for text and controls
- [ ] Focus indicators are visible
- [ ] Text is resizable without breaking layout
- [ ] Modal is responsive on different screen sizes

## Testing Steps

### 1. Keyboard Navigation Test
1. Tab to the "Add Record" button and press Enter
2. Verify modal opens and focus moves to first focusable element
3. Tab through all elements in the modal
4. Verify focus stays within the modal
5. Press ESC key
6. Verify modal closes and focus returns to "Add Record" button

### 2. Screen Reader Test
1. Start screen reader (NVDA, VoiceOver, etc.)
2. Navigate to "Add Record" button and activate it
3. Verify screen reader announces modal opening
4. Navigate through form fields
5. Verify all fields have proper labels
6. Submit form with errors
7. Verify error messages are announced
8. Close modal
9. Verify screen reader announces modal closing

### 3. Mobile Responsiveness Test
1. Open page on mobile device or using device emulation
2. Tap "Add Record" button
3. Verify modal opens and is properly sized
4. Verify form controls are usable on touch devices
5. Submit form
6. Verify modal closes properly

## Issues Found
<!-- Document any accessibility issues found during testing -->

## Recommendations
<!-- List recommendations for improving accessibility -->
