import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import LoadingCloud from '../components/LoadingCloud';

function Bookings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { bookings, loadUserBookings } = useBooking();
  const [loading, setLoading] = useState(true);
  const [minLoadingFinished, setMinLoadingFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingFinished(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [setMinLoadingFinished]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        await loadUserBookings();
        setLoading(false);
      } catch (error) {
        console.error('Failed to load bookings:', error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, navigate, loadUserBookings, setLoading]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-400/20 text-yellow-700 border-yellow-200/50';
      case 'pilot_assigned': return 'bg-blue-400/20 text-blue-700 border-blue-200/50';
      case 'in_transit': return 'bg-purple-400/20 text-purple-700 border-purple-200/50';
      case 'arrived': return 'bg-emerald-400/20 text-emerald-700 border-emerald-200/50';
      case 'completed': return 'bg-slate-400/20 text-slate-700 border-slate-200/50';
      default: return 'bg-slate-400/20 text-slate-700 border-slate-200/50';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pilot_assigned': return 'Captain Assigned';
      case 'in_transit': return 'In Transit';
      case 'arrived': return 'Touchdown';
      case 'completed': return 'Completed';
      default: return status;
    }
  }, []);

  if (loading || !minLoadingFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingCloud message="Retrieving your flight logs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-100 via-white to-white pt-24 pb-40 px-6 w-full">
      <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/60 shadow-xl">
          <p className="text-gray-600 text-xl mb-2">You don't have any bookings yet.</p>
          <p className="text-blue-500 font-medium cursor-pointer hover:underline" onClick={() => navigate('/')}>
            Start by booking your first flight.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => navigate(`/booking/${booking.id}`)}
              className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:bg-white/80 transition-all duration-500 cursor-pointer hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Booking #{booking.id.slice(-8)}</h3>
                  <p className="text-slate-500 font-medium text-sm">Flight: {booking.flightNumber}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booked</p>
                  <p className="font-medium text-gray-800">{new Date(booking.flightDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-800">{booking.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="font-medium text-green-600">₹{parseFloat(booking.fare).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Flight Times</p>
                  <p className="font-medium text-gray-800">Pickup: {new Date(booking.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="font-medium text-gray-800">Dropoff: {new Date(booking.dropoffTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">From:</span> {booking.pickup.address}
                </div>
                <div>
                  <span className="font-medium">To:</span> {booking.dropoff.address}
                </div>
              </div>

              {booking.pilotName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pilot:</span> {booking.pilotName}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookings;
