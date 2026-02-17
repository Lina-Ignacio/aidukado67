import React from "react";
import {
  MdMenuBook,
  MdBarChart,
  MdDashboardCustomize,
  MdClass,
  MdPerson,


} from "react-icons/md";
import { IoLogOut, IoHelpCircle, IoLibrary, IoSchool, IoPeople, IoClipboard } from "react-icons/io5";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import useUserStore from "../store/useUserStore";
import useClassStore from "../store/useClassStore";
import useTermStore from "../store/useTermStore";
import useLessonStore from "../store/useLessonStore";
import axios from "../services/axiosConfig";
import UserDropup from "./DropUp/UserDropUp";


export default function Sidebar({closeMobile}) {

  const location = useLocation();
  
  const userRole = useUserStore((state) => state.userRole)

  const handleClick = () => {
    if (closeMobile) closeMobile();
  }
 
  const navigate = useNavigate();

  const linkClasses = ({ isActive }) =>
    `flex justify-items items-center p-2 gap-2 rounded ${
      isActive ? "bg-[#102E50] text-white" : "text-[#102E50]"
    }`;

  const iconClasses = "text-3xl md:text[4xl] xl:text[6xl]"

  const handleLogout = async () => {
  
  useClassStore.persist.clearStorage(); 
  useClassStore.getState().clearClassDetail();
  
  useUserStore.persist.clearStorage(); 
  useUserStore.getState().clearUser();
  
  useTermStore.getState().clearTerm();
  useLessonStore.getState().clearLessonId();

  
  sessionStorage.clear();

  try {
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/logout`,
      {},
      { withCredentials: true }
    );

    
    if (response.data.message === "logged out successfully") {
      navigate("/login");
    } else {
      
      navigate("/login");
    }
  } catch (err) {
    console.error("Logout Failed on Server, but local data was cleared", err);
    navigate("/login");
  }
};

  return (
    //<div className="hidden md:block h-full w-[16%] min-w-[15%] bg-[#F1F2F7]">
    <div 
        className=" h-full w-full bg-[#F1F2F7] pt-10 shadow-r-xl"
        onClick={handleClick}
    >
      <UserDropup />
      <div className="flex space-x-3 p-5 justify-center items-center">
        <div className="rounded-full h-[40px] w-[40px] bg-[#102E50] flex justify-center items-center font-extrabold text-white text-2xl md:text[3xl] xl:text[5xl]">
          A
        </div>
        <h1 className="text-[#102E50] font-extrabold text-3xl md:text[4xl] xl:text[5xl]">AIDUKADO</h1>
      </div>

      <div className="flex flex-col space-y-4 mb-15 p-[15%]">
        <h2 className="text-[#E78B48] font-semibold opacity-75 text-lg">Menu</h2>

        {/* For Admin */}

        {/* {userRole == "admin" && (
          <NavLink to="/admin" className={linkClasses}>
            <MdAnalytics size={32} />
            <h2 className="font-bold">Dashboard(A)</h2>
          </NavLink>
        )} */}
        
        {/*<NavLink to="/dashboard" className={linkClasses}>
          <MdAnalytics size={32} />
          <h2 className="font-bold">Dashboard</h2>
        </NavLink> */}

        {userRole == "admin" && (
          <NavLink to="/adminDashboard" className={linkClasses}>
            <MdDashboardCustomize className={iconClasses}/>
            <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">Dashboard</h2>
          </NavLink>
        )}

        {userRole == "admin" && (
          <NavLink to="/userManagement" className={linkClasses}>
            <IoPeople className={iconClasses} />
            <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">Users</h2>
          </NavLink>
        )}

        {userRole == "admin" && (
          <NavLink to="/enrollmentManagement" className={linkClasses}>
            <IoClipboard className={iconClasses} />
            <h2 className="font-extrabold  text-2xl md:text[3xl] xl:text[4xl]">Enrollments</h2>
          </NavLink>
        )}

        {userRole == "admin" && (
          <NavLink to="/classManagement" className={linkClasses}>
            <IoSchool className={iconClasses} />
            <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">Course Code</h2>
          </NavLink>
        )}

        {userRole == "admin" && (
          <NavLink to="/subjectManagement" className={linkClasses}>
            <IoLibrary className={iconClasses}/>
            <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">Courses</h2>
          </NavLink>
        )}

        

        

        {/* {userRole == "student" && (
          <NavLink to="/subjects" className={linkClasses}>
            <MdAnalytics size={32} />
            <h2 className="font-bold">StudentArea</h2>
          </NavLink>
        )}  */}

        
        {/*
        <NavLink to="/aipretest" className={linkClasses}>
          <MdMenuBook size={32} />
          <h2 className="font-bold">AI Test & Learn</h2>
        </NavLink>
        */}
        

        {userRole == "student" && (
          <NavLink to="/studentClasses" className={linkClasses}>
            <MdBarChart size={40} />
            <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">My Classes</h2>
          </NavLink>
        )}

        {userRole == "teacher" && (
          <>
            <NavLink to="/teacherClasses" className={linkClasses}>
              <MdBarChart size={40} />
              <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">My Classes</h2>
            </NavLink>
            {location.pathname === '/termPage' && (
              <NavLink to="/studentList" className={linkClasses}>
                <MdPerson size={40} />
                <h2 className="font-extrabold text-2xl md:text-[3xl] xl:text-[4xl]">Student List</h2>
              </NavLink>
            )}
          </>
          

        )}

      </div>

      <div className="flex flex-col p-[15%]">
        <h2 className="text-[#E78B48] font-semibold opacity-75 text-lg">Others</h2>

        <NavLink to="/help" className={linkClasses}>
          <IoHelpCircle className={iconClasses} />
          <h2 className="font-extrabold text-2xl md:text[3xl] xl:text[4xl]">About</h2>
        </NavLink>

  
        {/* 
        <button onClick={() => {handleLogout(); handleClick(); }} className="flex justify-items items-center p-2 gap-2 bg-transparent">
          <IoLogOut className="text-[#102E50] text-3xl md:text[4xl] xl:text[6xl]"/>
          <h2 className="font-extrabold text-[#102E50] text-2xl md:text[3xl] xl:text[4xl]">Logout</h2>
        </button>
        */}
        
      </div>
    </div>
    
  );
}
