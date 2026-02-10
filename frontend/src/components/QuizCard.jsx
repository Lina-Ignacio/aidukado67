import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdQuiz, MdOutlineEditNote, MdLock } from "react-icons/md";
import userRole from "../store/useUserStore";

export default function QuizCard({ quizData, onArchive }) {
  const navigate = useNavigate();
  const usersRole = userRole((state) => state.userRole);
  const [isAccessible, setIsAccessible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const studentId = localStorage.getItem('userId');

  useEffect(() => {
    if (usersRole?.toLowerCase() === "student" && quizData.id && quizData.closing_time) {
      checkQuizAccessibility();
    }
  }, [quizData.id, usersRole, quizData.closing_time]);

  const checkQuizAccessibility = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const closingTime = new Date(quizData.closing_time);
      
      // If past original closing time, check for reopen records
      if (now > closingTime) {
        try {
          // Fetch student's reopen record for this quiz
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/quiz_reopen/student/${quizData.id}/${studentId}`
          );
          
          if (response.data?.new_closing_time) {
            const newClosingTime = new Date(response.data.new_closing_time);
            // Check if still within new closing time
            setIsAccessible(now <= newClosingTime);
          } else {
            setIsAccessible(false);
          }
        } catch (error) {
          // If 404 or other error, quiz is closed
          setIsAccessible(false);
        }
      } else {
        // Still within original closing time
        setIsAccessible(true);
      }
    } catch (error) {
      console.error("Error checking quiz accessibility:", error);
      setIsAccessible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (usersRole?.toLowerCase() === "student" && !isAccessible) return;
    
    const role = usersRole?.toLowerCase();
    if (role === "teacher") {
      navigate(`/quizMonitoring/${quizData.id}`);
    } else if (role === "student" && isAccessible) {
      navigate(`/studentQuizPage/${quizData.id}`);
    } else {
      navigate("/login");
    }
  };

  const date = new Date(quizData.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const status = quizData.status == "done";

  return (
    <div
      className={`flex flex-col w-full h-auto lg:w-[45%] xl:w-[32%] p-5 gap-2
                    rounded-md shadow-sm 
                    transition-all duration-300 ease-in-out
                    relative overflow-hidden border 
                    rounded-tr-xl rounded-bl-xl
                    ${usersRole?.toLowerCase() === "student" && !isAccessible 
                      ? 'bg-gray-100 border-gray-300' 
                      : 'bg-orange-50 border-orange-100 hover:border-orange-200 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                    }`}
      onClick={usersRole?.toLowerCase() === "student" && !isAccessible ? undefined : handleClick}
    >
      {/* Bottom accent bar */}
      <div 
        className={`absolute h-[3%] w-full bottom-0 left-0
          rounded-tr-xl rounded-bl-xl
          ${usersRole?.toLowerCase() === "student" && !isAccessible 
            ? 'bg-gray-400/30' 
            : 'bg-[#E78B48]/20'
          }`}
      />

      {/* Padlock icon for closed quizzes (students only) */}
      

      {/* Loading indicator */}
      {usersRole?.toLowerCase() === "student" && isLoading && (
        <div className="absolute top-3 right-3 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        </div>
      )}

      {/* Student Status badge */}
      {usersRole?.toLowerCase() === "student" && !isLoading && (
        <div className={`w-auto px-3 py-1 rounded-full flex items-center justify-center absolute top-2 right-2
          ${status ? "bg-green-100 border border-green-300" : 
            !isAccessible ? "bg-gray-200 border border-gray-400" : 
            "bg-orange-100 border border-orange-300"
          }`}>
          <span className={`text-sm font-semibold ${
            status ? "text-green-700" : 
            !isAccessible ? "text-gray-700" : 
            "text-orange-700"
          }`}>
            {status ? "Done" : !isAccessible ? "Closed" : "Available"}
          </span>
        </div>
      )}
      
      {/* Title Section */}
      <h2 className={`text-md font-bold leading-tight mt-4 pr-16
        ${usersRole?.toLowerCase() === "student" && !isAccessible 
          ? 'text-gray-600' 
          : 'text-[#E6501B]'
        }`}>
        {quizData.title}
      </h2>
      
      {/* Date Section */}
      <p className={`w-4/5 text-sm font-semibold mt-auto
        ${usersRole?.toLowerCase() === "student" && !isAccessible 
          ? 'text-gray-500' 
          : 'text-[#E6501B]'
        }`}>
        Created: {formattedDate}
      </p>

      {/* Quiz Type Icon */}
      <div 
        className={`flex justify-center items-center w-11 h-11 text-xl
          absolute bottom-2 right-2 rounded-full p-3 transition-all duration-200 ease-in-out
          ${usersRole?.toLowerCase() === "student" && !isAccessible 
            ? 'bg-gray-400 text-gray-200' 
            : 'bg-[#E6501B] text-white hover:brightness-110 hover:shadow-lg active:scale-95 active:brightness-90'
          }`}>
        {quizData.assessment_type == "Quiz" ? <MdQuiz/> : <MdOutlineEditNote />}
      </div>

      {/* Click overlay for disabled state - Simple version */}
      {usersRole?.toLowerCase() === "student" && !isAccessible && !isLoading && (
        <div className="absolute inset-0 bg-white/30 rounded-md" />
      )}
    </div>
  );
}