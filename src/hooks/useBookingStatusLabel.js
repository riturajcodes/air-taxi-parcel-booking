import { useMemo } from 'react';

export function useBookingStatusLabel(booking) {
  return useMemo(() => {
    if (!booking) return '';

    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch (booking.status) {
      case 'confirmed':
        return 'Searching for nearby pilot';
      case 'pilot_assigned':
        return `Pilot ${booking.pilotName} assigned · pickup by ${formatTime(booking.arrivalTime)}`;
      case 'in_transit':
        return `In transit · drop off by ${formatTime(booking.dropoffTime)}`;
      case 'arrived':
        return `Pilot arrived · drop off by ${formatTime(booking.dropoffTime)}`;
      case 'completed':
        return 'Ride completed';
      default:
        return booking.status.replace('_', ' ');
    }
  }, [booking]);
}
