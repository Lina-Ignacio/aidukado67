
import React from "react";
import { useNavigate } from "react-router-dom";
import useClassStore from "../store/useClassStore";

export default function ClassCard({ subjectName, classId}) {
  const navigate = useNavigate();

  const storeClassDetail = useClassStore((state) => state.storeClassDetail);


  const handleClick = (e) => {
    e.preventDefault();
    storeClassDetail(classId, subjectName);

    navigate(`/termPage`);
  }

  return (
    <div 
      className="
        flex flex-col w-3/4 sm:w-[20%] sm:min-h-[120px] 
        p-1 hover:shadow-lg hover:scale-105 transition-transform duration-300
        bg-gray-200 truncate p-2 rounded-2xl"
      onClick={handleClick}
    >
        <div className="h-[90px] bg-[#102E50] p-4 rounded-2xl border border-gray-300">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{subjectName}</p> 
          </div>
        </div>

         <div className="h-24"></div>
    </div>
  );
}