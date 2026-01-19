
import React from "react";
import { useNavigate } from "react-router-dom";
import useClassStore from "../store/useClassStore";

export default function ClassCardStudent({ subjectName, classId, teacher, email}) {
  const navigate = useNavigate();

  const storeClassDetail = useClassStore((state) => state.storeClassDetail);

  const handleClick = (e) => {
    e.preventDefault();
    storeClassDetail(classId, subjectName, email);

    navigate(`/termPage`);
  }

  return (
    <div 
      className=" w-full rounded-2xl rounded-b-2xl bg-gray-200 shadow-sm hover:shadow-lg 
        hover:scale-105 transition-transform duration-300 cursor-pointer
        overflow-hidden p-2"
      onClick={handleClick}
    >
      {/* Blue Header Section */}
      <div className="bg-[#102E50] p-4 rounded-2xl border border-gray-300">
        <p className="text-lg sm:text-xl 2xl:text-3xl font-semibold text-white truncate">{subjectName}</p>
        <p className="text-sm text-[#F5C45E]">{teacher}</p>
        <p className="text-sm text-white mt-1">Monday 5:00pm - 7:00pm</p>
      </div>

      {/* Gray Bottom Section (optional extra space) */}
      <div className="h-24 hidden md:block"></div>
  </div>



  );
}