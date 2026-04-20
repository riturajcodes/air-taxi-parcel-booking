import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useActiveRoute } from '../hooks/useActiveRoute'
import { RocketLaunchIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/solid'
import BookingSummary from './BookingSummary'

const Dockbar = () => {
  const activeRoute = useActiveRoute();
  const { currentUser } = useAuth();

  const isActive = (path) => activeRoute === path;

  const linkClasses = (path) => `
    relative flex-1 px-2 sm:px-6 py-2 sm:py-4 rounded-2xl sm:rounded-[24px] transition-all duration-300 ease-out
    text-[10px] sm:text-lg font-bold tracking-tight capitalize
    flex flex-col sm:flex-row items-center gap-1 sm:gap-3
    ${isActive(path) 
      ? 'bg-slate-950 text-white shadow-lg' 
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }
  `;

  const getFirstName = (name) => {
    if (!name) return 'Traveler';
    return name.split(' ')[0];
  };

  const iconClasses = "w-5 h-5 sm:w-7 sm:h-7";

  return (
    <nav className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[92vw] sm:w-[540px]">
      <div className="flex flex-col gap-2 w-full">
        <BookingSummary />

        <div className="
          bg-white/90 backdrop-blur-[40px] 
          border border-white/40 
          rounded-[32px] sm:rounded-[40px] p-1.5 sm:p-2
          flex items-center gap-1 sm:gap-2
          shadow-[0_24px_64px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,1)]
        ">
          <Link to="/" className={linkClasses('/')}> 
            <RocketLaunchIcon className={iconClasses} />
            Fly now
          </Link>
          {currentUser ? (
            <>
              <Link to="/bookings" className={linkClasses('/bookings')}>
                <CalendarDaysIcon className={iconClasses} />
                Bookings
              </Link>
              <Link to="/account" className={linkClasses('/account')}>
                <UserIcon className={iconClasses} />
                Hi, {getFirstName(currentUser.displayName)}
              </Link>
            </>
          ) : (
            <Link to="/login" className={linkClasses('/login')}>
              <UserIcon className={iconClasses} />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Dockbar