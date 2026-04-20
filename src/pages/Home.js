import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to handle automatic map fitting and centering
function MapAutoView({ pickupCoords, destCoords }) {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && destCoords) {
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [destCoords.lat, destCoords.lng]
      );
      map.fitBounds(bounds, { padding: [70, 70], animate: true });
    } else if (pickupCoords) {
      map.setView([pickupCoords.lat, pickupCoords.lng], 14, { animate: true });
    } else if (destCoords) {
      map.setView([destCoords.lat, destCoords.lng], 14, { animate: true });
    }
  }, [pickupCoords, destCoords, map]);

  return null;
}

function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createBooking } = useBooking();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [passengers, setPassengers] = useState(1);

  // Haversine formula to calculate distance in miles
  const calculateDistance = useCallback((coords1, coords2) => {
    if (!coords1 || !coords2) return 0;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) *
        Math.cos(toRad(coords2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const distance = useMemo(() => calculateDistance(pickupCoords, destCoords), [pickupCoords, destCoords, calculateDistance]);
  const flightTime = useMemo(() => Math.round(distance * 0.8 + 2), [distance]);

  const searchTimeout = useRef(null);

  const fetchAddresses = useCallback(async (query, setSuggestions) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      const suggestions = data.features.map(f => {
        const { name, city, state, country } = f.properties;
        return {
          label: [name, city, state].filter(Boolean).join(', '),
          coords: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }
        };
      });
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, []);

  const debouncedFetchAddresses = useCallback((query, setSuggestions) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchAddresses(query, setSuggestions);
    }, 500); // 500ms debounce
  }, [fetchAddresses]);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // In a production app, you would use reverse geocoding here
        setPickup(`Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setPickupCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setPickupSuggestions([]);
      }, (error) => {
        alert("Error getting location: " + error.message);
      });
    }
  }, []);

  const handleBooking = useCallback(async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!pickupCoords || !destCoords || !selectedVehicle) {
      alert('Please fill in all required fields');
      return;
    }

    // Auto-generate flight number
    const flightNumber = `AT${Date.now().toString().slice(-6)}`;

    try {
      const bookingData = {
        pickup: {
          address: pickup,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng
        },
        dropoff: {
          address: destination,
          lat: destCoords.lat,
          lng: destCoords.lng
        },
        vehicleType: selectedVehicle.name,
        passengers,
        flightNumber,
        flightDate: new Date(), // Use current date/time
        distance,
        fare: selectedVehicle.base + distance * selectedVehicle.rate + passengers * 50
      };

      const bookingId = await createBooking(bookingData);
      setIsModalOpen(false);
      navigate(`/booking/${bookingId}`);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to create booking. Please try again.');
    }
  }, [currentUser, navigate, pickup, pickupCoords, destination, destCoords, selectedVehicle, passengers, distance, createBooking]);

  // Memoize vehicle options to prevent unnecessary array creation
  const vehicleOptions = useMemo(() => [
    { id: 'standard', name: 'Shunya Standard', seats: 4, rate: 5, base: 500, time: '3 min away', icon: '🚁' },
    { id: 'luxury', name: 'Shunya Luxury', seats: 2, rate: 12, base: 1200, time: '5 min away', icon: '✨' },
    { id: 'cargo', name: 'Shunya Cargo', seats: 0, rate: 4, base: 400, time: '8 min away', icon: '📦' },
  ], []);

  return (
    <div className="relative min-h-screen bg-white text-slate-900">
      <section className="relative min-h-screen overflow-hidden bg-white">
        <img
          src="/airtaxi.webp"
          alt="Air taxi interior"
          className="absolute left-0 top-0 h-[72vh] w-full object-cover"
        />
        <div className="absolute left-0 top-0 h-[72vh] w-full bg-gradient-to-b from-transparent to-white" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] items-center px-6 py-20">
          <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Unlocking limitless possibilities with the largest flying taxi cabin ever designed
              </h1>
              <p className="mt-8 text-lg text-slate-600">
                Experience the future of urban mobility. Fast, silent, and sustainable travel at your fingertips.
              </p>
            </div>

            <div className="rounded-[40px] border border-white/40 bg-white/20 p-10 shadow-[0_32px_100px_rgba(0,0,0,0.1)] backdrop-blur-[40px]">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Book your flight</h3>
              
              <div className="space-y-6">
                {/* Pickup Input */}
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 ml-1">Pickup Location</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Enter pickup location"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          debouncedFetchAddresses(e.target.value, setPickupSuggestions);
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all backdrop-blur-md"
                      />
                      {pickupSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full mt-2 bg-white/80 border border-white/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                          {pickupSuggestions.map((s, i) => (
                            <li 
                              key={i}
                              onClick={() => { setPickup(s.label); setPickupCoords(s.coords); setPickupSuggestions([]); }}
                              className="px-5 py-4 hover:bg-white/40 cursor-pointer text-sm border-b last:border-0 border-white/20 transition-colors"
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button 
                      onClick={handleUseCurrentLocation}
                      className="bg-white/20 hover:bg-white/40 border border-white/30 p-4 rounded-2xl transition-all group backdrop-blur-md"
                      title="Use current location"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-blue-600">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Destination Input */}
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 ml-1">Where to?</label>
                  <input
                    type="text"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      debouncedFetchAddresses(e.target.value, setDestSuggestions);
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all backdrop-blur-md"
                  />
                  {destSuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full mt-2 bg-white/80 border border-white/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                      {destSuggestions.map((s, i) => (
                        <li 
                          key={i}
                          onClick={() => { setDestination(s.label); setDestCoords(s.coords); setDestSuggestions([]); }}
                          className="px-5 py-4 hover:bg-white/40 cursor-pointer text-sm border-b last:border-0 border-white/20 transition-colors"
                        >
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setIsModalOpen(true);
                      setIsEditingModal(false);
                    }}
                    className="w-full bg-slate-900/90 hover:bg-black text-white font-bold py-5 rounded-[20px] transition-all shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full h-full bg-white/80 backdrop-blur-3xl shadow-[0_-20px_80px_rgba(0,0,0,0.2)] overflow-hidden transition-transform duration-500 ease-out transform translate-y-0">
            
            {/* Drag Handle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 rounded-full lg:hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Left Pane: Booking Info */}
              <div className="p-8 lg:p-12 overflow-y-auto border-r border-white/40">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Choose a ride</h2>
                    <p className="text-slate-500 mt-2">Available air taxis near you</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Search Summary & Edit */}
                {!isEditingModal ? (
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[24px] mb-8 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <p className="text-sm font-medium text-slate-700 truncate flex-1">{pickup || 'Current Location'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                        <p className="text-sm font-medium text-slate-700 truncate flex-1">{destination || 'Select destination'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingModal(true)}
                      className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit Search
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 p-6 rounded-[24px] mb-8 space-y-4 shadow-sm">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Pickup"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          debouncedFetchAddresses(e.target.value, setPickupSuggestions);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {pickupSuggestions.length > 0 && (
                        <ul className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          {pickupSuggestions.map((s, i) => (
                            <li 
                              key={i}
                              onClick={() => { setPickup(s.label); setPickupCoords(s.coords); setPickupSuggestions([]); }}
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-xs border-b last:border-0 border-slate-100"
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Destination"
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          debouncedFetchAddresses(e.target.value, setDestSuggestions);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {destSuggestions.length > 0 && (
                        <ul className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          {destSuggestions.map((s, i) => (
                            <li 
                              key={i}
                              onClick={() => { setDestination(s.label); setDestCoords(s.coords); setDestSuggestions([]); }}
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-xs border-b last:border-0 border-slate-100"
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsEditingModal(false)}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
                    >
                      Update Search
                    </button>
                  </div>
                )}

                {/* Estimates */}
                <div className="flex gap-8 mb-10 px-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estimated Distance</p>
                    <p className="text-xl font-bold text-slate-900">{distance > 0 ? distance.toFixed(1) : '--'} miles</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Flight Time</p>
                    <p className="text-xl font-bold text-slate-900">{distance > 0 ? flightTime : '--'} mins</p>
                  </div>
                </div>

                {/* Vehicle Options */}
                <div className="space-y-4">
                  {vehicleOptions.map((option, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedVehicle(option)}
                      className={`group flex items-center justify-between p-5 rounded-[24px] border cursor-pointer transition-all ${
                        selectedVehicle?.id === option.id
                          ? 'border-blue-500/50 bg-blue-50/50 shadow-lg backdrop-blur-md'
                          : 'border-white/40 hover:border-white/80 hover:bg-white/60 bg-white/20'
                      }`}
                    >
                      {/* Price Calculation: Base + (Distance * Rate) */}
                      <div className="flex items-center gap-5">
                        <div className="text-3xl bg-white/50 w-16 h-16 flex items-center justify-center rounded-2xl shadow-sm">{option.icon}</div>
                        <div>
                          <p className="font-bold text-slate-900">{option.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{option.time} • {option.seats} seats</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {distance > 0 ? `₹${(option.base + distance * option.rate + passengers * 50).toFixed(2)}` : '---'}
                      </p>
                      {distance > 0 && (
                        <p className="text-xs text-slate-500">
                          Base: ₹{option.base.toFixed(2)} + Distance: ₹{(distance * option.rate).toFixed(2)} + {passengers}×₹50.00
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Booking Form */}
                {selectedVehicle && (
                  <div className="bg-white border border-slate-200 p-6 rounded-[24px] space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">Flight Details</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Passengers</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPassengers(Math.max(1, passengers - 1))}
                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-slate-900 min-w-[3rem] text-center">{passengers}</span>
                          <button
                            onClick={() => setPassengers(Math.min(selectedVehicle.seats || 4, passengers + 1))}
                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600">Grand Total</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₹{distance > 0 ? (selectedVehicle.base + distance * selectedVehicle.rate + passengers * 50).toFixed(2) : '---'}
                          </span>
                        </div>
                        {distance > 0 && (
                          <div className="text-xs text-slate-500 mt-2 space-y-1">
                            <div>Base fare: ₹{selectedVehicle.base.toFixed(2)}</div>
                            <div>Distance ({distance.toFixed(1)} miles): ₹{(distance * selectedVehicle.rate).toFixed(2)}</div>
                            <div>Passengers ({passengers}): ₹{(passengers * 50).toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleBooking}
                      disabled={!currentUser || !pickupCoords || !destCoords || !selectedVehicle}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-sm transition-all active:scale-95 disabled:cursor-not-allowed"
                    >
                      {!currentUser ? 'Login to Book' : 'Book Ride'}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Pane: Map */}
              <div className="hidden lg:block bg-slate-100/50 relative overflow-hidden">
                {pickupCoords || destCoords ? (
                  <MapContainer
                    center={pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : [0, 0]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    className="z-10"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapAutoView pickupCoords={pickupCoords} destCoords={destCoords} />
                    {pickupCoords && (
                      <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
                        <Popup>Pickup: {pickup}</Popup>
                      </Marker>
                    )}
                    {destCoords && (
                      <Marker position={[destCoords.lat, destCoords.lng]}>
                        <Popup>Destination: {destination}</Popup>
                      </Marker>
                    )}
                    {pickupCoords && destCoords && (
                      <Polyline
                        positions={[
                          [pickupCoords.lat, pickupCoords.lng],
                          [destCoords.lat, destCoords.lng]
                        ]}
                        color="blue"
                        weight={3}
                        opacity={0.7}
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Select locations to view route</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
