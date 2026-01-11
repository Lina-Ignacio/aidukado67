

import React from 'react';

export default function ClassicButton({ 
  icon: Icon,          
  buttonName, 
  onClick, 
  mainColor = "#183D65", 
  darkColor = "#102E50",
  className = ""       
}) {
  return (
    <button
      onClick={onClick}
      
      className={`grid grid-cols-[1fr_2.5fr] shadow-md relative 
                  text-white h-full p-0 m-0 border-none overflow-hidden rounded-2xl
                  transition-all duration-200 ease-in-out
                  hover:brightness-110 hover:shadow-lg
                  active:scale-95 active:brightness-90 ${className}`}
      style={{ backgroundColor: mainColor }}
    >
      {/* Decorative top bar */}
      <div className="absolute h-[10%] w-full bg-black/20 bottom-0"></div>

      {/* Icon Section */}
      <div 
        className="h-full flex items-center justify-center" 
        style={{ backgroundColor: darkColor }}
      >
        {Icon && <Icon className="text-lg xl:text-2xl text-white" />}
      </div>

      {/* Text Section */}
      <span className="text-sm xl:text-lg font-semibold h-full flex items-center justify-center px-4">
        {buttonName}
      </span>
    </button>
  );
}