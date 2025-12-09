import React, { useState } from "react";
import Sidebar from './sidebar'
import { MdMenu } from "react-icons/md";

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block h-full w-[300px] bg-[#F1F2F7]">
        <Sidebar />
      </div>

      {/* MOBILE SIDEBAR (drawer) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 md:hidden`}
      >
        <Sidebar closeMobile={() => setIsOpen(false)} />
      </div>

      {/* OVERLAY for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col w-full">

        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center p-3 bg-[#102E50]">
          <button onClick={() => setIsOpen(true)} className="bg-transparent">
            <MdMenu size={32} className="text-white" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-auto h-full ">
          {children}
        </div>
      </div>

    </div>
  );
}
