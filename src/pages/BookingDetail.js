import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LoadingCloud from '../components/LoadingCloud';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { bookings, updateBookingStatus } = useBooking();
  const [minLoadingFinished, setMinLoadingFinished] = useState(false);

  const booking = useMemo(() => bookings.find(b => b.id === id), [bookings, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingFinished(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [setMinLoadingFinished]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (booking?.status === 'confirmed') {
      const timer = setTimeout(() => {
        updateBookingStatus(id, 'pilot_assigned');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [id, booking?.status, updateBookingStatus]);

  if (!minLoadingFinished) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingCloud message="Preparing your flight profile..." />
      </div>
    );
  }

  if (booking?.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-xl w-full">
          <LoadingCloud message="Radar scan active: finding pilots nearby..." />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/bookings')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-400/20 text-yellow-700 border-yellow-200/50';
      case 'pilot_assigned': return 'bg-blue-400/20 text-blue-700 border-blue-200/50';
      case 'in_transit': return 'bg-purple-400/20 text-purple-700 border-purple-200/50';
      case 'arrived': return 'bg-emerald-400/20 text-emerald-700 border-emerald-200/50';
      case 'completed': return 'bg-slate-400/20 text-slate-700 border-slate-200/50';
      default: return 'bg-slate-400/20 text-slate-700 border-slate-200/50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pilot_assigned': return 'Captain Assigned';
      case 'in_transit': return 'In Transit';
      case 'arrived': return 'Touchdown';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // Mock route coordinates (in real app, this would come from a routing service)
  const routeCoordinates = [
    [booking.pickup.lat, booking.pickup.lng],
    [booking.dropoff.lat, booking.dropoff.lng]
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 pt-8 pb-80">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Booking Details</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Flight Information</h3>
                <p className="text-gray-600">Flight: {booking.flightNumber}</p>
                <p className="text-gray-600">Booked: {new Date(booking.flightDate).toLocaleDateString()}</p>
                <p className="text-gray-600">Passengers: {booking.passengers}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Pilot Information</h3>
                {booking.pilotName ? (
                  <>
                    <p className="text-gray-600">Pilot: {booking.pilotName}</p>
                    <p className="text-gray-600">Vehicle: {booking.vehicleType}</p>
                  </>
                ) : (
                  <p className="text-gray-600">Assigning pilot...</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="text-gray-700">{booking.pickup.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Drop-off</p>
                  <p className="text-gray-700">{booking.dropoff.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Fare</p>
                <p className="text-2xl font-bold text-green-600">₹{parseFloat(booking.fare).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{booking.passengers} passenger{booking.passengers > 1 ? 's' : ''} + base fare</p>
              </div>
              <button
                onClick={() => navigate('/bookings')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Bookings
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Map</h3>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[booking.pickup.lat, booking.pickup.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <Marker position={[booking.pickup.lat, booking.pickup.lng]}>
                  <Popup>Pickup: {booking.pickup.address}</Popup>
                </Marker>

                <Marker position={[booking.dropoff.lat, booking.dropoff.lng]}>
                  <Popup>Drop-off: {booking.dropoff.address}</Popup>
                </Marker>

                <Polyline
                  positions={routeCoordinates}
                  color="blue"
                  weight={4}
                  opacity={0.7}
                />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;