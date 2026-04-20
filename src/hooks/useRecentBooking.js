import { useMemo } from 'react';
import { useBooking } from '../context/BookingContext';

export function useRecentBooking() {
  const { bookings, currentBooking } = useBooking();

  return useMemo(() => {
    return bookings?.[0] || currentBooking || null;
  }, [bookings, currentBooking]);
}
