import React, { useState } from "react";
import Sidebar from './sidebar';
import { MdMenu } from "react-icons/md";
import { Outlet } from "react-router-dom"; // Logic: Required for nested routing

export default function Layout() { // Logic: Removed { children } prop
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden xl:block h-full w-[300px] bg-[#F1F2F7]">
        <Sidebar />
      </div>

      {/* MOBILE & TABLET SIDEBAR (drawer) */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-1/2 md:w-80 bg-white shadow-md z-50 transform 
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          transition-transform duration-300 xl:hidden`}
      >
        <Sidebar closeMobile={() => setIsOpen(false)} />
      </div>

      {/* OVERLAY for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed w-full h-full inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col w-full">

        {/* MOBILE/TABLET TOP BAR with burger */}
        <div className="flex items-center p-3 bg-[#102E50] xl:hidden">
          <button onClick={() => setIsOpen(true)} className="bg-transparent">
            <MdMenu size={32} className="text-white" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-auto h-full">
          {/* Logic: Outlet renders the child route's element */}
          <Outlet /> 
        </div>
      </div>
    </div>
  );
}