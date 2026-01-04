
import React from "react";
import { useNavigate } from "react-router-dom";
import useClassStore from "../store/useClassStore";

export default function ClassCardStudent({ subjectName, classId, teacher}) {
  const navigate = useNavigate();

  const storeClassDetail = useClassStore((state) => state.storeClassDetail);

  const handleClick = (e) => {
    e.preventDefault();
    storeClassDetail(classId, subjectName);

    navigate(`/termPage`);
  }

  return (
    <div 
      className=" w-3/4 sm:w-[20%] rounded-2xl rounded-b-2xl bg-gray-200 shadow-sm hover:shadow-lg 
        hover:scale-105 transition-transform duration-300 cursor-pointer
        overflow-hidden p-2"
      onClick={handleClick}
    >
      {/* Blue Header Section */}
      <div className="bg-[#102E50] p-4 rounded-2xl border border-gray-300">
        <p className="text-xl sm:text-2xl font-bold text-white truncate">{subjectName}</p>
        <p className="text-sm text-[#F5C45E]">{teacher}</p>
        <p className="text-sm text-white mt-1">Monday 5:00pm - 7:00pm</p>
      </div>

      {/* Gray Bottom Section (optional extra space) */}
      <div className="h-24"></div>
  </div>



  );
}