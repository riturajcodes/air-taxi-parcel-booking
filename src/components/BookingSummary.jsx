import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRecentBooking } from '../hooks/useRecentBooking';
import { useBookingStatusLabel } from '../hooks/useBookingStatusLabel';

const BookingSummary = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const recentBooking = useRecentBooking();
  const statusLabel = useBookingStatusLabel(recentBooking);
  const [countdownText, setCountdownText] = useState('');

  const getCountdownText = (booking) => {
    if (!booking) return '';
    const now = new Date();
    const arrivalTime = new Date(booking.arrivalTime);
    const dropoffTime = new Date(booking.dropoffTime);

    let targetTime;
    let action;

    if (booking.status === 'confirmed' || booking.status === 'pilot_assigned') {
      targetTime = arrivalTime;
      action = 'Pickup';
    } else if (booking.status === 'in_transit' || booking.status === 'arrived') {
      targetTime = dropoffTime;
      action = 'Arrival';
    } else if (booking.status === 'completed') {
      return 'Trip completed';
    } else {
      return statusLabel;
    }

    const diffMs = targetTime - now;
    if (diffMs <= 0) return `${action} now by ${booking.pilotName}`;

    const diffTotalSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffTotalSec / 60);
    const diffSec = diffTotalSec % 60;

    let timeStr;
    if (diffMin > 0) {
      timeStr = `${diffMin}m ${diffSec}s`;
    } else {
      timeStr = `${diffSec}s`;
    }

    return `${action} in ${timeStr} by ${booking.pilotName}`;
  };

  useEffect(() => {
    const updateCountdown = () => {
      setCountdownText(getCountdownText(recentBooking));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [recentBooking, statusLabel]);

  if (!currentUser || location.pathname === '/bookings' || !recentBooking) {
    return null;
  }

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Link
      to={`/booking/${recentBooking.id}`}
      className="group block w-full overflow-hidden rounded-[32px] bg-slate-950/95 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-slate-900"
    >
      <div className="px-6 py-4">
        {/* Collapsed State: Just the sentence */}
        <div className="group-hover:hidden transition-all duration-300 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate tabular-nums">
            {countdownText}
          </p>
        </div>

        {/* Hover State: Full Details */}
        <div className="hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-white/5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">{recentBooking.flightNumber}</p>
              <p className="text-xs text-slate-400 font-medium truncate">{recentBooking.pilotName}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">₹{parseFloat(recentBooking.fare).toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">{recentBooking.passengers} Passengers</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pickup</span>
                <span className="text-sm font-semibold text-white">{formatTime(recentBooking.arrivalTime)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dropoff</span>
                <span className="text-sm font-semibold text-white">{formatTime(recentBooking.dropoffTime)}</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
              {statusLabel}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BookingSummary;
