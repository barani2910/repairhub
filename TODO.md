# Update Application: Add Final Price, Advance Payment, Rating System

## Backend Model Updates
- [x] Update backend/models/Booking.js: Add advanceAmount, finalAmount, remainingAmount, rating, feedback, advancePaid, finalPaid fields. Update status enum to include 'final_price_submitted', 'final_payment_done', 'rated'

## Backend Route Updates
- [x] Modify backend/routes/bookings.js POST /: Include advanceAmount, set advancePaid: true
- [x] Change backend/routes/bookings.js PUT /:id/complete: Only mark status as 'completed', no amount calculation
- [x] Add backend/routes/bookings.js PUT /:id/submit-final-price: Worker submits finalAmount, calculates remainingAmount, sets status 'final_price_submitted', sends notification
- [x] Add backend/routes/bookings.js PUT /:id/pay-remaining: User pays remaining, sets finalPaid: true, status 'final_payment_done'
- [x] Add backend/routes/bookings.js PUT /:id/rate: User submits rating and feedback, updates status 'rated', recalculates worker's cumulative rating

## Frontend Updates
- [x] src/pages/user/BookingForm.jsx: Add advance payment input field
- [x] src/pages/worker/WorkHistory.jsx: Change "Mark Complete" to just mark complete. Add form for submitting final price on 'completed' bookings
- [x] src/pages/user/BookingHistory.jsx: Add UI for paying remaining amount on 'final_price_submitted' bookings, show "Payment Successful" message. Add rating form after 'final_payment_done'. Update status displays and filters

## Testing
- [ ] Test workflow: booking with advance -> worker complete -> submit final price -> user pay remaining -> user rate
- [ ] Ensure notifications are sent correctly
- [ ] Verify worker rating updates cumulatively
