import React from "react";
import { useNavigate } from "react-router-dom";
import useClassStore from "../store/useClassStore";

export default function ClassCard({ subjectName, classId, schedule, room, section }) {
  const navigate = useNavigate();
  const storeClassDetail = useClassStore((state) => state.storeClassDetail);

  const handleClick = (e) => {
    e.preventDefault();
    storeClassDetail(classId, subjectName);
    navigate(`/termPage`);
  };

  // Function to format schedule with full day names
  const formatSchedule = (scheduleStr) => {
    if (!scheduleStr) return "No schedule";
    
    // Extract day code and time (format: "MW: 9:00am-12:00pm" or "M: 9:00am-10:00am")
    const match = scheduleStr.match(/^([A-Z]+):\s*(.+)$/);
    if (!match) return scheduleStr;
    
    const [_, dayCodes, time] = match;
    
    // Map day abbreviations to full names
    const dayMap = {
      'M': 'Monday',
      'T': 'Tuesday', 
      'W': 'Wednesday',
      'TH': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'SU': 'Sunday',
      'MW': 'Monday & Wednesday',
      'TR': 'Tuesday & Thursday',
      'MWF': 'Monday, Wednesday & Friday',
      'TRS': 'Tuesday, Thursday & Saturday',
      'MF': 'Monday & Friday',
      'MR': 'Monday & Thursday'
    };
    
    // Convert day codes to full names
    const fullDay = dayMap[dayCodes] || dayCodes;
    
    return `${fullDay}: ${time}`;
  };

  const formattedSchedule = formatSchedule(schedule);
  
  // Format room display
  const displayRoom = room ? room : "";
  
  // Format section display  
  const displaySection = section ? section : "";

  return (
    <div className="w-full h-[120px] lg:h-[160px] relative group">
      {/* Shadow/background layer with improved depth */}
      <div className="w-full h-full absolute z-10 bg-[#E78B48] left-[6px] top-[8px] rounded-2xl opacity-80 group-hover:left-[8px] group-hover:top-[10px] transition-all duration-300"></div>
      
      {/* Main card with enhanced interaction */}
      <div 
        className="bg-[#102E50] border-2 border-[#E78B48]/20 relative overflow-hidden
          hover:scale-[1.02] hover:border-[#E78B48]/50 transition-all duration-300 cursor-pointer
          p-5 rounded-2xl shadow-xl w-full h-full z-20 flex flex-col"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
          }
        }}
      >
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 w-1 h-12 bg-[#E78B48] rounded-tl-2xl"></div>
        
        {/* Header section with subject and optional badge */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                font-bold text-white truncate pr-2 flex-1 tracking-tight">
            {subjectName}
          </p>
          {displaySection && (
            <span className="bg-[#E78B48]/20 text-[#E78B48] text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 border border-[#E78B48]/30">
              {displaySection}
            </span>
          )}
        </div>
        
        {/* Schedule with enhanced styling */}
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-[#E78B48]/20 p-1.5 rounded-lg flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#E78B48]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-[#E78B48] font-medium truncate">{formattedSchedule}</p>
        </div>
        
        {/* Room and additional info with improved layout */}
        <div className="flex items-center gap-4 mt-auto">
          {displayRoom && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-300 font-medium">{displayRoom}</p>
            </div>
          )}
          
          {/* Add a subtle divider if both room and classId exist */}
          {displayRoom && classId && (
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
          )}
          
          {classId && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <p className="text-xs text-gray-400">ID: {classId}</p>
            </div>
          )}
        </div>
        
        {/* Decorative element with improved opacity and positioning */}
        <div className="bg-gradient-to-tl from-[#E78B48]/10 to-transparent h-2/3 w-2/3 absolute right-[-15%] bottom-[-40%] -rotate-45 z-10 rounded-full blur-xl"></div>
        
        {/* Additional subtle decorative element */}
        <div className="absolute top-2 right-2 w-16 h-16 bg-[#E78B48]/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}