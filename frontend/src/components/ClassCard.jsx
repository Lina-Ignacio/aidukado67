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

  const formattedSchedule = formatSchedule(schedule);
  
  // Format room display
  const displayRoom = room ? room : "";
  
  // Format section display  
  const displaySection = section ? section : "";

  return (
    <div className="w-full h-[100px] lg:h-[150px] relative">
      <div className="w-full h-full absolute z-10 bg-[#E78B48] left-[5px] top-[8px] rounded-2xl"></div>
      <div 
        className="bg-[#102E50] border border-gray-300 relative overflow-hidden
          hover:scale-105 transition-transform duration-300 cursor-pointer
          p-4 rounded-2xl shadow-xl w-full h-full z-20 flex flex-col"
        onClick={handleClick}
      >
        {/* Subject Name */}
        <p className="text-sm sm:text-md md:text-lg lg:text-xl xl:text-2xl
              font-medium text-white truncate mb-1 flex-shrink-0">
          {subjectName}
        </p>
        
        {/* Formatted Schedule */}
        <div className="flex items-center gap-1 mb-1 flex-shrink-0">
          <svg className="w-3 h-3 text-[#E78B48] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#E78B48] flex-1 truncate">{formattedSchedule}</p>
        </div>
        
        {/* Room and Section (if available) */}
        <div className="space-y-1">
          {displayRoom && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-300 truncate">Room: {displayRoom}</p>
            </div>
          )}
          
          {displaySection && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16 1H4a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM9 15v-2h2v2H9zm2-4V9h-2v2h2zm0-4V5h-2v2h2z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-300 truncate">Section: {displaySection}</p>
            </div>
          )}
        </div>
        
        <div className="bg-[#EBECF1] h-1/2 w-1/2 absolute right-[-20%] bottom-[-50%] -rotate-45 z-10"></div>
      </div>
    </div>
  );
}