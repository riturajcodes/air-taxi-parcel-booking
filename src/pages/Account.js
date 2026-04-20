import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Account() {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const navigate = useNavigate();

  const handleSave = async () => {
    try {
      await updateUserProfile({
        displayName: displayName
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🛰️</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Signal Lost!</h2>
          <p className="text-slate-600 mb-8">We can't find your flight profile. Are you sure you've cleared for takeoff?</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-80 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Your Hangar</h2>
          <p className="text-xl text-slate-500">Managing your identity in the stratosphere.</p>
        </header>

        <div className="space-y-12">
          {/* Conversational Name Section */}
          <section className="group">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-6">The Identity</h3>
            <div className="relative">
              <p className="text-2xl text-slate-800 leading-relaxed">
                "When we're cruising at 5,000 feet, what name should we broadcast to the birds? 
                {isEditing ? (
                  <span className="block mt-4">
                    Actually, call me{' '}
                    <input
                      type="text"
                      autoFocus
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="inline-block border-b-2 border-blue-500 focus:outline-none px-2 py-1 bg-blue-50 rounded-t-md text-blue-700 min-w-[200px]"
                    />
                  </span>
                ) : (
                  <span className="font-bold text-slate-900 ml-2 border-b-2 border-slate-200">
                    {currentUser.displayName || 'The Mysterious Traveler'}
                  </span>
                )}
                "
              </p>
              
              <div className="mt-6 flex gap-3">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="text-sm font-bold bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-black transition-all">Etch it in the clouds</button>
                    <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 px-4 py-2">Nevermind</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-blue-600 hover:underline">Change my callsign</button>
                )}
              </div>
            </div>
          </section>

          {/* Static Info Section */}
          <section className="pt-12 border-t border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">The Records</h3>
            <div className="space-y-8">
              <div>
                <p className="text-slate-500 text-sm mb-1">Digital Signal (Email)</p>
                <p className="text-xl font-medium text-slate-900">{currentUser.email}</p>
                <p className="text-xs text-slate-400 mt-1 italic">This frequency is locked to your account.</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Joined the Fleet</p>
                <p className="text-xl font-medium text-slate-900">
                  {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Before time began'}
                </p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-12 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-4 text-red-500 hover:text-red-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div className="text-left">
                <p className="font-bold">Eject Seat</p>
                <p className="text-xs opacity-70">Safely sign out of your session.</p>
              </div>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Account;
