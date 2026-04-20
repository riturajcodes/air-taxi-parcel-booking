import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const BookingContext = createContext();

export function useBooking() {
  return useContext(BookingContext);
}

// Pilot names for random assignment
const pilotNames = [
  'Captain Rajesh Kumar',
  'Captain Priya Sharma',
  'Captain Amit Singh',
  'Captain Sunita Patel',
  'Captain Vikram Rao',
  'Captain Meera Joshi',
  'Captain Arjun Nair',
  'Captain Kavita Reddy'
];

export function BookingProvider({ children }) {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const statusIntervalsRef = useRef(new Map());
  const bookingsRef = useRef(bookings);
  const currentBookingRef = useRef(currentBooking);

  // Keep refs in sync with state for stable callbacks
  useEffect(() => {
    bookingsRef.current = bookings;
    currentBookingRef.current = currentBooking;
  }, [bookings, currentBooking]);

  // Calculate fare based on vehicle type and distance
//   const calculateFare = useCallback((vehicleType, distance) => {
//     const baseRates = {
//       'Shunya Standard': { base: 500, perMile: 5 },
//       'Shunya Luxury': { base: 1200, perMile: 12 },
//       'Shunya Cargo': { base: 400, perMile: 4 }
//     };

//     const rate = baseRates[vehicleType];
//     return Math.round((rate.base + distance * rate.perMile) * 100) / 100;
//   }, []);

  // Update local booking state
  const updateLocalBooking = useCallback((bookingId, newStatus) => {
    setBookings(prev => prev.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
        : booking
    ));

    if (currentBooking && currentBooking.id === bookingId) {
      setCurrentBooking(prev => ({ ...prev, status: newStatus, updatedAt: new Date().toISOString() }));
    }
  }, [currentBooking]);

  // Start status updates for a booking
  const startBookingStatusUpdates = useCallback((bookingId) => {
    // Clear existing interval using ref to keep identity stable
    if (statusIntervalsRef.current.has(bookingId)) {
      clearInterval(statusIntervalsRef.current.get(bookingId));
    }

    const updateStatus = async () => {
      try {
        const bookingRef = doc(db, 'bookings', bookingId);
        const booking = bookingsRef.current.find(b => b.id === bookingId) || currentBookingRef.current;

        if (!booking) return;

        const now = new Date();
        const arrivalTime = new Date(booking.arrivalTime);
        const dropoffTime = new Date(booking.dropoffTime);
        const createdAt = new Date(booking.createdAt);
        let newStatus = booking.status;

        // Auto-assign pilot after 10 seconds if confirmed (to allow for UI transitions)
        if (booking.status === 'confirmed' && (now - createdAt) > 10000) {
           newStatus = 'pilot_assigned';
        }

        // Time-based transitions
        if (now >= dropoffTime) {
          newStatus = 'completed';
        } else if (now >= arrivalTime) {
          // If we are between pickup and dropoff
          // We consider 'arrived' to be the last 1 minute of the flight
          const remainingMs = dropoffTime - now;
          if (remainingMs < 60000) {
            newStatus = 'arrived';
          } else {
            newStatus = 'in_transit';
          }
        } else if (booking.status !== 'confirmed') {
          newStatus = 'pilot_assigned';
        }

        if (newStatus !== booking.status && newStatus !== 'confirmed') {
          await updateDoc(bookingRef, {
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
          updateLocalBooking(bookingId, newStatus);
        }
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
    };

    // Update every 5 seconds for snappier UI transitions
    const interval = setInterval(updateStatus, 5000);

    // Initial update
    updateStatus();

    // Store interval ID in ref
    statusIntervalsRef.current.set(bookingId, interval);

    return interval;
  }, [updateLocalBooking]);

  // Create a new booking
  const createBooking = useCallback(async (bookingData) => {
    if (!currentUser) {
      throw new Error('User must be logged in to create a booking');
    }

    setLoading(true);
    try {
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + (Math.random() * 15 + 5) * 60000); // 5-20 minutes
      const dropoffTime = new Date(arrivalTime.getTime() + (bookingData.distance * 0.8 + 2) * 60000); // Mock flight time

      const fullBookingData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        vehicleType: bookingData.vehicleType,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        passengers: bookingData.passengers,
        flightNumber: bookingData.flightNumber,
        flightDate: bookingData.flightDate.toISOString(),
        distance: bookingData.distance,
        pilotName: pilotNames[Math.floor(Math.random() * pilotNames.length)],
        arrivalTime: arrivalTime.toISOString(),
        dropoffTime: dropoffTime.toISOString(),
        status: 'confirmed', // confirmed, pilot_assigned, in_transit, arrived, completed
        fare: bookingData.fare,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const docRef = await addDoc(collection(db, 'bookings'), fullBookingData);
      const newBooking = { id: docRef.id, ...fullBookingData };

      setCurrentBooking(newBooking);
      setBookings(prev => [newBooking, ...prev]);

      // Start status updates
      startBookingStatusUpdates(newBooking.id);

      return newBooking.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, startBookingStatusUpdates]);

  // Load user's bookings
  const loadUserBookings = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const userBookings = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setBookings(userBookings);

      // Start status updates for active bookings
      userBookings.forEach(booking => {
        if (booking.status !== 'completed' && booking.status !== 'cancelled') {
          startBookingStatusUpdates(booking.id);
        }
      });
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, startBookingStatusUpdates]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      updateLocalBooking(bookingId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }, [updateLocalBooking]);

  // Update booking status manually
  const updateBookingStatus = useCallback(async (bookingId, newStatus) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      updateLocalBooking(bookingId, newStatus);
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }, [updateLocalBooking]);

  // Set current booking for viewing
  const setCurrentBookingById = useCallback((bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setCurrentBooking(booking);
      startBookingStatusUpdates(bookingId);
    }
  }, [bookings, startBookingStatusUpdates]);

  // Load bookings when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserBookings();
    } else {
      setBookings([]);
      setCurrentBooking(null);
    }
  }, [currentUser, loadUserBookings]);

  const value = useMemo(() => ({
    bookings,
    currentBooking,
    loading,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    loadUserBookings,
    setCurrentBookingById
  }), [
    bookings,
    currentBooking,
    loading,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    loadUserBookings,
    setCurrentBookingById
  ]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}
