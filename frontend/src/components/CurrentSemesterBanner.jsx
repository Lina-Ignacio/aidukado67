import React from 'react';

export default function CurrentSemesterBanner({ currentSemester }) {
  // Don't render anything if there's no current semester
  if (!currentSemester) {
    return null;
  }

  return (
    <div className="w-full mb-6 p-4 bg-gradient-to-r from-[#102E50] to-[#1a3f6a] rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#E78B48] font-semibold text-base sm:text-lg">📅 Current Academic Period:</span>
          <span className="text-white font-bold text-lg sm:text-xl">
            {currentSemester.academic_year} - {currentSemester.semester}
          </span>
          {/* {currentSemester.current && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
              ACTIVE
            </span>
          )} */}
        </div>
        <div className="text-gray-300 text-xs sm:text-sm">
          All Your Classes in One Place
        </div>
      </div>
    </div>
  );
}