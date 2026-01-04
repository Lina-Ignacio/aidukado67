
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
    // <div 
    //   className=" w-3/4 md:w-full rounded-2xl rounded-b-2xl bg-gray-200 shadow-sm hover:shadow-lg 
    //     hover:scale-105 transition-transform duration-300 cursor-pointer
    //     overflow-hidden p-2"
    //   onClick={handleClick}
    // >
      

      
    //   <div className="h-24"></div>
    // </div>

    
    <div className="bg-[#102E50]  
            border border-gray-300 w-full h-[100px] lg:h-[150px] relative overflow-hidden
            hover:scale-105 transition-transform duration-300 cursor-pointer
            p-4 rounded-2xl shadow-xl"
        onClick={handleClick}
    >
      
      {/* <div className="bg-[#E78B48] h-1/2 w-1/2 absolute right-[-30%] top-[-30%] rotate-45"></div> */}
      <p className="text-sm sm:text-md md:text-lg lg:text-xl xl:text-2xl
            font-medium text-white truncate">
        {subjectName}
      </p>
      <p className="text-sm text-white mt-1">Monday 5:00pm - 7:00pm</p>
      
      <div className="bg-[#1F4068] h-1/2 w-1/2 absolute right-[-20%] bottom-[-50%] -rotate-45 z-30"></div>
      {/* <div className="bg-[#E78B48] h-1/2 w-1/2 absolute right-[-20%] bottom-[-40%] -rotate-45 z-20"></div> */}
      <div className="bg-[#EBECF1] h-1/2 w-1/2 absolute right-[-20%] bottom-[-30%] -rotate-45  z-10"></div>
    </div>
  );
}