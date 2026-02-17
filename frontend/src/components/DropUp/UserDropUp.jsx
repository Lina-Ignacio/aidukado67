import { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaChalkboardTeacher, FaSignOutAlt, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import useTermStore from "../../store/useTermStore";
import useLessonStore from "../../store/useLessonStore";
import useClassStore from "../../store/useClassStore";
import axios from "../../services/axiosConfig";

export default function UserDropup() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const email = useUserStore((state) => state.email)
  const firstName = useUserStore((state) => state.email)
  const userRole = useUserStore((state) => state.userRole)
  const teacherEmail = useClassStore((state) => state.teacherEmail)

  // Check if user is not admin (student or teacher)
  const showClassesButton = userRole === "student" || userRole === "teacher";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const goToClasses = () => {
    navigate(userRole === "teacher" ? `/teacherClasses` : `/studentClasses`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-40" ref={dropdownRef}>
      {/* Main Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-[#E78B48] scale-110 shadow-[0_10px_40px_rgba(231,139,72,0.4)]' 
            : 'bg-[#102E50] hover:bg-[#0d2540] hover:scale-105 shadow-[0_8px_30px_rgba(16,46,80,0.3)]'
        }`}
        aria-label="User menu"
      >
        {isOpen ? (
          <FaChevronUp className="w-7 h-7 text-white transition-transform duration-300" />
        ) : (
          <FaUserCircle className="w-8 h-8 text-white transition-transform duration-300" />
        )}
      </button>

      {/* Dropup Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideUp">
          {/* Arrow pointing to button */}
          <div className="absolute -bottom-2 right-6">
            <div className="w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45"></div>
          </div>

          {/* Header with user info */}
          <div className="px-6 py-5 bg-[#102E50] text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/20">
                <FaUserCircle className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">Welcome Back {firstName}</h3>
                <p className="text-sm text-gray-200 truncate">{email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-300">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items Container */}
          <div className="p-4 bg-gray-50">
            {/* Classes Button - Only show for students and teachers */}
            {showClassesButton && (
              <button
                onClick={goToClasses}
                className="flex items-center w-full p-4 rounded-xl bg-white hover:bg-white/90 transition-all duration-200 group mb-3 border border-gray-100 hover:border-[#E78B48]/20 hover:shadow-lg hover:translate-y-[-2px]"
              >
                <div className="mr-4 p-3 bg-[#102E50]/5 rounded-xl group-hover:bg-[#102E50]/10 transition-colors">
                  <FaChalkboardTeacher className="w-6 h-6 text-[#102E50]" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#102E50]">My Classes</p>
                  <p className="text-sm text-gray-500 mt-1">Access your courses and materials</p>
                </div>
                <div className="ml-2 p-2 rounded-lg bg-gray-50 group-hover:bg-[#102E50]/5">
                  <span className="text-xs font-medium text-[#102E50]">→</span>
                </div>
              </button>
            )}

            {/* Divider - Only show if Classes button is visible */}
            {showClassesButton && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-gray-50 text-xs text-gray-400">Account</span>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-4 rounded-xl bg-white hover:bg-white/90 transition-all duration-200 group border border-gray-100 hover:border-red-100 hover:shadow-lg hover:translate-y-[-2px] ${
                !showClassesButton ? 'mt-0' : ''
              }`}
            >
              <div className="mr-4 p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                <FaSignOutAlt className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-red-600">Logout</p>
                <p className="text-sm text-gray-500 mt-1">Sign out of your account</p>
              </div>
              <div className="ml-2 p-2 rounded-lg bg-gray-50 group-hover:bg-red-50">
                <span className="text-xs font-medium text-red-500">→</span>
              </div>
            </button>
          </div>

          {/* Footer - Only for students */}
          {userRole === "student" && (
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="block">Need help?</span>
                  <button
                    onClick={() => {
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${teacherEmail}&su=${encodeURIComponent('Class Help')}`;
                      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-[#102E50] hover:text-[#E78B48] font-medium cursor-pointer p-0 m-0 bg-transparent border-0 outline-none focus:outline-none hover:underline"
                  >
                    Contact {teacherEmail}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}