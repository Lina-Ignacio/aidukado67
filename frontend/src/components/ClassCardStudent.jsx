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
    
    const match = scheduleStr.match(/^([A-Z]+):\s*(.+)$/);
    if (!match) return scheduleStr;
    
    const [_, dayCodes, time] = match;
    
    const dayMap = {
      'M': 'Monday',
      'T': 'Tuesday', 
      'W': 'Wednesday',
      'R': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'SU': 'Sunday',
      'MW': 'Mon & Wed',
      'TR': 'Tue & Thu',
      'MWF': 'Mon, Wed & Fri',
      'TRS': 'Tue, Thu & Sat',
      'MF': 'Mon & Fri',
      'MR': 'Mon & Thu'
    };
    
    const fullDay = dayMap[dayCodes] || dayCodes;
    return `${fullDay} • ${time}`;
  };

  const displayRoom = room || "TBA";
  const displaySection = section || "";
  const formattedSchedule = formatSchedule(schedule);

  return (
    <div 
      className="w-full group relative cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
    >
      {/* Main card - using #102E50 as primary color */}
      <div className="relative bg-[#102E50] rounded-2xl shadow-lg 
        transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 
        overflow-hidden border border-[#E78B48]/20">
        
        {/* Top accent bar - using #E78B48 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#E78B48]"></div>
        
        {/* Card content */}
        <div className="p-5">
          {/* Header with subject and section */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-xl lg:text-2xl font-bold text-white leading-tight 
              truncate flex-1 pr-2" title={subjectName}>
              {subjectName}
            </p>
            {displaySection && (
              <span className="bg-[#E78B48] text-[#102E50] text-xs font-bold px-3 py-1.5 
                rounded-full flex-shrink-0 shadow-md whitespace-nowrap">
                {displaySection}
              </span>
            )}
          </div>
          
          {/* Teacher info */}
          <div className="flex items-center gap-2 mb-4 bg-white/10 p-2.5 rounded-xl">
            <div className="bg-[#E78B48] rounded-full p-1.5 flex-shrink-0">
              <svg className="w-4 h-4 text-[#102E50]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#E78B48] font-medium">Instructor</p>
              <p className="text-sm font-semibold text-white truncate" title={teacher}>
                {teacher}
              </p>
            </div>
          </div>
          
          {/* Schedule */}
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-white/10 p-2 rounded-lg flex-shrink-0">
              <svg className="w-4 h-4 text-[#E78B48]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#E78B48] font-medium">Schedule</p>
              <p className="text-sm text-white truncate" title={formattedSchedule}>
                {formattedSchedule}
              </p>
            </div>
          </div>
          
          {/* Room only - removed Class ID */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-[#E78B48] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs text-[#E78B48] font-medium">Room</p>
                <p className="text-sm font-semibold text-white truncate" title={displayRoom}>
                  {displayRoom}
                </p>
              </div>
            </div>
          </div>
          
          {/* Email indicator */}
          {email && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
              <svg className="w-3.5 h-3.5 text-[#E78B48]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E78B48]/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}