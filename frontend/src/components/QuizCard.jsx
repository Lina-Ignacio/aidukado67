import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdQuiz, MdOutlineEditNote, MdLock, MdCheckCircle, MdAccessTime, MdCalendarToday } from "react-icons/md";
import userRole from "../store/useUserStore";

export default function QuizCard({ quizData }) {
  const navigate = useNavigate();
  const usersRole = userRole((state) => state.userRole);
  const [isAccessible, setIsAccessible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const studentId = localStorage.getItem('userId');

  const isStudent = usersRole?.toLowerCase() === "student";
  const isTeacher = usersRole?.toLowerCase() === "teacher";

  // Check if student has submitted based on quizData - ONLY for students
  const hasSubmission = isStudent && (quizData.score !== null || quizData.status === "completed" || quizData.status === "done");

  useEffect(() => {
    // Only check accessibility if student hasn't submitted yet
    if (isStudent && quizData.id && quizData.closing_time && !hasSubmission) {
      checkQuizAccessibility();
    } else if (hasSubmission) {
      // If they have submission, always accessible for viewing
      setIsAccessible(true);
    }
  }, [quizData.id, usersRole, quizData.closing_time, hasSubmission, isStudent]);

  // Calculate time remaining
  useEffect(() => {
    if (quizData.closing_time) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const closingTime = new Date(quizData.closing_time);
        const timeDiff = closingTime - now;
        
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else {
            setTimeRemaining(`${minutes}m`);
          }
        } else {
          setTimeRemaining("Time's up");
        }
      };
      
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [quizData.closing_time]);

  const checkQuizAccessibility = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const closingTime = new Date(quizData.closing_time);
      
      // If past original closing time, check for reopen records
      if (now > closingTime) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/quiz_reopen/student/${quizData.id}/${studentId}`
          );
          
          if (response.data?.new_closing_time) {
            const newClosingTime = new Date(response.data.new_closing_time);
            setIsAccessible(now <= newClosingTime);
          } else {
            setIsAccessible(false);
          }
        } catch (error) {
          setIsAccessible(false);
        }
      } else {
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
    // For students: only allow if accessible OR has submission
    if (isStudent && !isAccessible && !hasSubmission) return;
    
    const role = usersRole?.toLowerCase();
    if (role === "teacher") {
      navigate(`/quizMonitoring/${quizData.id}`);
    } else if (role === "student") {
      navigate(`/studentQuizPage/${quizData.id}`);
    } else {
      navigate("/login");
    }
  };

  const date = new Date(quizData.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Format due date for display
  const formatDueDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div
      className={`relative w-full lg:w-[48%] xl:w-[32%] 
                  rounded-xl border transition-all duration-200
                  ${isStudent && !isAccessible && !hasSubmission 
                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm' 
                    : 'bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-md hover:shadow-lg hover:border-orange-200 hover:scale-[1.02] cursor-pointer'
                  }`}
      onClick={handleClick}
    >
      {/* Main content container */}
      <div className="p-5">
        {/* Top section with title and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-12">
            <h3 className={`text-lg font-bold line-clamp-2 leading-tight ${
              isStudent && !isAccessible && !hasSubmission 
                ? 'text-gray-700' 
                : 'text-[#E6501B]'
            }`}>
              {quizData.title}
            </h3>
            
            {/* Quiz type and points */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {quizData.assessment_type}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600">
                {quizData.total_points} points
              </span>
            </div>
          </div>
          
          {/* Status indicator */}
          {isStudent && !isLoading && (
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5
              ${hasSubmission ? "bg-green-100 border border-green-200" : 
                !isAccessible ? "bg-gray-100 border border-gray-200" : 
                "bg-orange-100 border border-orange-200"
              }`}>
              <div className={`h-2 w-2 rounded-full ${
                hasSubmission ? 'bg-green-500' : 
                !isAccessible ? 'bg-gray-400' : 
                'bg-orange-500 animate-pulse'
              }`} />
              <span className={`text-xs font-semibold ${
                hasSubmission ? "text-green-700" : 
                !isAccessible ? "text-gray-600" : 
                "text-orange-700"
              }`}>
                {hasSubmission ? "Submitted" : !isAccessible ? "Closed" : "Open"}
              </span>
            </div>
          )}
          
          {/* Loading indicator */}
          {isStudent && isLoading && !hasSubmission && (
            <div className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-1.5">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                <span className="text-xs text-gray-500">Checking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Due date section */}
        {quizData.closing_time && (
          <div className={`mb-4 p-3 rounded-lg ${
            isStudent && !isAccessible && !hasSubmission 
              ? 'bg-gray-100 border border-gray-200' 
              : 'bg-gradient-to-r from-orange-50/50 to-amber-50/50 border border-orange-100'
          }`}>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white border border-orange-100">
                <MdCalendarToday className="text-orange-500 text-sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">Due Date</p>
                  {isStudent && !hasSubmission && isAccessible && timeRemaining && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-orange-100">
                      <MdAccessTime className="text-orange-500 text-xs" />
                      <span className="text-xs font-medium text-orange-600">{timeRemaining}</span>
                    </div>
                  )}
                </div>
                <p className={`text-sm font-medium mt-0.5 ${
                  isStudent && !isAccessible && !hasSubmission 
                    ? 'text-gray-600' 
                    : 'text-[#E6501B]'
                }`}>
                  {formatDueDate(quizData.closing_time)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score display for students */}
        {isStudent && hasSubmission && quizData.score !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Your Score:</span>
                <span className={`text-lg font-bold ${
                  quizData.score >= (quizData.total_points * 0.7) ? 'text-green-600' :
                  quizData.score >= (quizData.total_points * 0.5) ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {quizData.score}/{quizData.total_points}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  quizData.score >= (quizData.total_points * 0.7) ? 'bg-green-100 text-green-700' :
                  quizData.score >= (quizData.total_points * 0.5) ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {Math.round((quizData.score / quizData.total_points) * 100)}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  quizData.score >= (quizData.total_points * 0.7) ? 'bg-green-500' :
                  quizData.score >= (quizData.total_points * 0.5) ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(quizData.score / quizData.total_points) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Teacher info section */}
        {isTeacher && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total Points</p>
              <p className="text-lg font-bold text-[#E6501B]">{quizData.total_points}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <p className="text-lg font-bold text-gray-800">{quizData.assessment_type}</p>
            </div>
          </div>
        )}

        {/* Bottom section */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              {quizData.assessment_type == "Quiz" ? 
                <MdQuiz className="text-orange-600 text-lg" /> : 
                <MdOutlineEditNote className="text-orange-600 text-lg" />
              }
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Created</p>
              <p className="text-sm font-semibold text-gray-800">{formattedDate}</p>
            </div>
          </div>
          
          {/* Action indicator */}
          <div className={`px-3 py-1.5 rounded-lg ${
            isStudent && !isAccessible && !hasSubmission 
              ? 'bg-gray-100 text-gray-500' 
              : 'bg-gradient-to-r from-[#E6501B] to-orange-500 text-white'
          }`}>
            <span className="text-xs font-semibold">
              {isTeacher ? "Monitor" : 
               hasSubmission ? "View Results" : 
               !isAccessible ? "Closed" : "Take Quiz"}
            </span>
          </div>
        </div>
      </div>

      {/* Closed overlay for students */}
      {isStudent && !isAccessible && !hasSubmission && !isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-3">
              <MdLock className="text-gray-500 text-2xl" />
            </div>
            <h4 className="font-bold text-gray-700 mb-1">Quiz Closed</h4>
            <p className="text-sm text-gray-500 mb-3">Submission period has ended</p>
            <div className="text-xs text-gray-400">
              Due: {formatDueDate(quizData.closing_time)}
            </div>
          </div>
        </div>
      )}

      {/* Bottom accent bar */}
      <div 
        className={`absolute h-1.5 w-full bottom-0 left-0 rounded-b-xl ${
          isStudent && !isAccessible && !hasSubmission 
            ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
            : isStudent && hasSubmission
            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
            : 'bg-gradient-to-r from-[#E6501B] to-orange-500'
        }`}
      />
    </div>
  );
}