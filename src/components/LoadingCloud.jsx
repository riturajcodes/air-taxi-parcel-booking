import React from 'react';

const LoadingCloud = ({ message = "Navigating the stratosphere..." }) => (
  <div className="flex flex-col items-center justify-center p-12 w-full h-full min-h-[40vh]">
    <div className="relative w-32 h-20 mb-8">
      {/* Cloud Layers */}
      <div className="absolute top-0 left-6 w-16 h-16 bg-blue-100/50 rounded-full animate-pulse blur-md"></div>
      <div className="absolute top-6 left-0 w-14 h-14 bg-white rounded-full animate-bounce [animation-duration:3s] shadow-sm"></div>
      <div className="absolute top-6 right-0 w-20 h-20 bg-sky-50 rounded-full animate-bounce [animation-duration:2.5s] delay-150 shadow-sm"></div>
      <div className="absolute bottom-2 left-6 right-6 h-12 bg-white rounded-full"></div>
      
      {/* Floating Effect */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-200/50 rounded-full blur-sm animate-pulse"></div>
    </div>
    <p className="text-slate-400 font-semibold tracking-widest uppercase text-[10px] animate-pulse">{message}</p>
  </div>
);

export default LoadingCloud;