import React from "react";
import { useNavigate } from "react-router-dom";
import useClassStore from "../store/useClassStore";

export default function ClassCardStudent({ subjectName, classId, teacher, email, schedule, room, section }) {
  const navigate = useNavigate();
  const storeClassDetail = useClassStore((state) => state.storeClassDetail);

  const handleClick = (e) => {
    e.preventDefault();
    storeClassDetail(classId, subjectName, email);
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
      'TTH': 'Tuesday & Thursday',
      'MWF': 'Monday, Wednesday & Friday',
      'TTHS': 'Tuesday, Thursday & Saturday',
      'MF': 'Monday & Friday',
      'MTH': 'Monday & Thursday'
    };
    
    // Convert day codes to full names
    const fullDay = dayMap[dayCodes] || dayCodes;
    
    return `${fullDay}: ${time}`;
  };

  // Format room display
  const displayRoom = room ? `Room: ${room}` : "Room: TBA";
  
  // Format section display  
  const displaySection = section ? `Section: ${section}` : "";

  const formattedSchedule = formatSchedule(schedule);

  return (
    <div 
      className="w-full rounded-2xl rounded-b-2xl bg-gray-200 shadow-sm hover:shadow-lg 
        hover:scale-105 transition-transform duration-300 cursor-pointer
        overflow-hidden p-2"
      onClick={handleClick}
    >
      {/* Blue Header Section */}
      <div className="bg-[#102E50] p-4 rounded-2xl border border-gray-300">
        {/* Subject Name - Top */}
        <p className="text-lg sm:text-xl 2xl:text-3xl font-semibold text-white truncate mb-2">
          {subjectName}
        </p>
        
        {/* Teacher */}
        <p className="text-sm text-[#F5C45E] mb-2">{teacher}</p>
        
        {/* Schedule with formatted days */}
        <div className="flex items-center gap-1 mb-2">
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-white flex-1">{formattedSchedule}</p>
        </div>
        
        {/* Room */}
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-gray-300">{displayRoom}</p>
        </div>
        
        {/* Section (only if exists) */}
        {displaySection && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16 1H4a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM9 15v-2h2v2H9zm2-4V9h-2v2h2zm0-4V5h-2v2h2z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-300">{displaySection}</p>
          </div>
        )}
      </div>

      
      
    </div>
  );
}