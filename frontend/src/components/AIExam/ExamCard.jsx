import { useNavigate } from "react-router-dom";
import { 
  FaClock, 
  FaHourglassHalf,
} from "react-icons/fa";
import { FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { useState, useEffect } from "react";
import axios from "axios"; // Import axios

export default function ExamCard({ 
  examData,
  userRole = "student", 
  lessonTitle = "" 
}) {
  const navigate = useNavigate();
  const [isExamClosed, setIsExamClosed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Get API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Check user role
  const isTeacher = userRole === "teacher";
  
  // Teacher data structure
  const teacherData = isTeacher ? {
    id: examData.id,
    title: examData.title,
    totalPoints: examData.total_points,
    instructions: examData.instructions,
    duration: examData.duration,
    passingScore: examData.passing_score,
    shuffleQuestions: examData.shuffle_questions,
    createdAt: examData.created_at,
    isArchive: examData.is_archive || false
  } : null;
  
  // Student data structure - based on API responses
  const studentData = !isTeacher ? {
    id: examData.id || examData.exam?.id, 
    studentId: examData.student_id,
    examId: examData.exam_id || examData.exam?.id,
    status: examData.status,
    score: examData.score,
    answers: examData.answers || {},
    startTime: examData.start_time,
    createdAt: examData.created_at,
    updatedAt: examData.updated_at,
    examTitle: examData.title || examData.exam?.title || examData.exam_title,
    examTotalPoints: examData.total_points || examData.exam?.total_points,
    examDuration: examData.duration || examData.exam?.duration,
    examInstructions: examData.instructions || examData.exam?.instructions,
    examPassingScore: examData.passing_score || examData.exam?.passing_score,
    closingTime: examData.closing_time || examData.exam?.closing_time
  } : null;

  // Check exam availability based on student_exam_reopens table
  useEffect(() => {
    const checkExamAvailability = async () => {
      if (isTeacher || !studentData || studentData.status !== "assigned") return;
      
      setIsChecking(true);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/exam/student/${studentData.examId}/check-availability`,
          {
            studentId: studentData.studentId
          }
        );
        
        setIsExamClosed(!response.data.isAvailable);
      } catch (error) {
        console.error('Error checking exam availability:', error);
        // Only fall back if it's NOT a 404 error (endpoint doesn't exist)
        if (error.response?.status !== 404 && studentData.closingTime) {
          const currentDateTime = new Date();
          const closingDateTime = new Date(studentData.closingTime);
          setIsExamClosed(currentDateTime > closingDateTime);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkExamAvailability();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // You can add cleanup logic here if needed
    };
  }, [studentData?.examId, studentData?.studentId, studentData?.status, isTeacher]);

  // Teacher: Navigate to monitoring page
  const handleClick = () => {
    if (isTeacher && teacherData) {
      navigate(`/teacher/exam/monitoring/${teacherData.id}`);
    }
  };

  // Student: Start/Continue exam
  const handleExam = async (e) => {
    e.stopPropagation();
    if (!studentData) return;
    
    // For in_progress and submitted, just navigate
    if (studentData.status === "in_progress" || studentData.status === "submitted") {
      navigate(`/student/exam/${studentData.examId}`);
      return;
    }
    
    // For assigned status, check availability
    if (studentData.status === "assigned") {
      setIsChecking(true);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/exam/student/${studentData.examId}/check-availability`,
          {
            studentId: studentData.studentId
          }
        );
        
        if (response.data.isAvailable) {
          // Exam is available - navigate
          navigate(`/student/exam/${studentData.examId}`);
        } else {
          // Exam is not available - show message
          alert(response.data.reason || "This exam is not available.");
          setIsExamClosed(true);
        }
      } catch (error) {
        console.error('Error checking exam availability:', error);
        alert("Error checking exam availability. Please try again.");
      } finally {
        setIsChecking(false);
      }
    }
  };


  // Status badge styling for students
  const getStatusBadge = (status) => {
    const statusConfig = {
      "assigned": {
        text: "Not Started",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: <FiClock className="text-blue-600" />,
        buttonText: "Start Exam",
        buttonColor: "bg-blue-600 hover:bg-blue-700"
      },
      "in_progress": {
        text: "In Progress",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        icon: <FaHourglassHalf className="text-yellow-600" />,
        buttonText: "Continue",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700"
      },
      "submitted": {
        text: "Completed",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        icon: <FiCheckCircle className="text-green-600" />,
        buttonText: "View Results",
        buttonColor: "bg-green-600 hover:bg-green-700"
      }
    };
    
    return statusConfig[status] || statusConfig.assigned;
  };
  // Teacher view 
  if (isTeacher && teacherData) {
    return (
      <div 
        className="p-5 rounded-2xl relative bg-blue-50 border
          hover:shadow-md transition-shadow cursor-pointer w-full border-blue-100"
        onClick={handleClick}
      >
        {/* Shadow at bottom */}
        <div 
          className={`absolute h-[4%] w-full bg-[#E78B48]/20 bottom-0 left-0
            rounded-br-2xl rounded-bl-2xl`}
        ></div>

        {/* Archive badge if archived */}
        {teacherData.isArchive && (
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              Archived
            </span>
          </div>
        )}

        <h3 className="font-bold text-lg text-gray-800 truncate mb-1 text-[#102E50]">
          {teacherData.title}
        </h3>
    
        {/* Exam Details */}
        <div className="flex justify-between mb-3">
          {teacherData.totalPoints > 0 && (
            <div className="flex items-center gap-2 text-sm text-[#102E50]">
              <span className="text-gray-700">
                Total: <span className="font-semibold">{teacherData.totalPoints} points</span>
              </span>
            </div>
          )}
          
          {teacherData.duration > 0 && (
            <div className="flex items-center justify-center gap-1 text-sm text-[#102E50]">
              <FaClock className="text-gray-400 text-xs" />
              <span className="text-gray-700">{teacherData.duration} minutes</span>
            </div>
          )}
        </div>

        {/* Passing score if available */}
        {teacherData.passingScore > 0 && (
          <div className="text-sm text-gray-700 mb-2">
            Passing: {teacherData.passingScore} points
          </div>
        )}


        {/* Created date */}
        {teacherData.createdAt && (
          <div className="text-xs text-gray-500 mt-2">
           Created: {new Date(teacherData.createdAt).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric' 
          })}
          </div>
        )}
      </div>
    );
  }

  // Student view
  if (!isTeacher && studentData) {
    const statusBadge = getStatusBadge(studentData.status);
    const percentage = studentData.score !== null && studentData.score !== undefined && studentData.examTotalPoints 
      ? Math.round((studentData.score / studentData.examTotalPoints) * 100)
      : null;
    
    const isPassing = studentData.score !== null && studentData.score !== undefined && studentData.examPassingScore
      ? studentData.score >= studentData.examPassingScore
      : null;

    return (
      <div 
        className="p-5 rounded-2xl shadow-md relative bg-blue-50 relative
          hover:shadow-md transition-shadow w-full border border-blue-100"
      >
        {/* Shadow at bottom */}
        <div 
          className="absolute h-[2%] w-full bg-[#102E50]/20 bottom-0 left-0
            rounded-2xl"
        >
        </div>

        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-end mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                studentData.status === "submitted" 
                  ? "bg-green-100 text-green-800" 
                  : studentData.status === "in_progress"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                <div className="flex items-center gap-1">
                  {statusBadge.icon}
                  {statusBadge.text}
                </div>
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 truncate text-[#102E50]">
              {studentData.examTitle}
            </h3>
          </div>
        </div>

        {/* Exam Details */}
        <div className="flex justify-between mb-3">
          {studentData.examTotalPoints > 0 && (
            <div className="flex items-center gap-2 text-sm text-[#102E50]">
              <span className="text-gray-700 text-sm">
                Total: <span className="font-semibold">{studentData.examTotalPoints} points</span>
              </span>
            </div>
          )}
          
          {studentData.examDuration > 0 && (
            <div className="flex items-center justify-center gap-1 text-sm text-[#102E50]">
              <FaClock className="text-gray-400 text-sm" />
              <span className="text-gray-700">{studentData.examDuration} minutes</span>
            </div>
          )}
        </div>

        {/* Passing score if available */}
        {studentData.examPassingScore > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            Passing Score: {studentData.examPassingScore} points
          </div>
        )}

        {/* Score display for submitted exams */}
        {studentData.status === "submitted" && studentData.score !== null && studentData.score !== undefined && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-[#102E50]">
              
              <span className="text-gray-700">
                Score: <span className={`font-semibold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                  {studentData.score}
                  {percentage !== null && ` (${percentage}%)`}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Start time if in progress */}
        {studentData.status === "in_progress" && studentData.startTime && (
          <div className="text-xs text-gray-500 mb-2">
            Started: {new Date(studentData.startTime).toLocaleDateString()}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-100 pt-3">
          <span className="text-sm">
            {studentData.createdAt ? 
              `${new Date(studentData.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })}` : 'Recently assigned'
            }
          </span>
          
          {studentData.status === "assigned" && (
            <>
              {isChecking ? (
                <button
                  disabled
                  className="text-white bg-gray-400 text-xs px-3 py-1 rounded-full font-medium cursor-not-allowed opacity-60"
                >
                  Checking...
                </button>
              ) : isExamClosed ? (
                <button
                  disabled
                  className="text-white bg-gray-400 text-xs px-3 py-1 rounded-full font-medium cursor-not-allowed opacity-60"
                >
                  Exam Closed
                </button>
              ) : (
                <button
                  onClick={handleExam}
                  className="text-white bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 rounded-full font-medium transition-colors"
                >
                  Start Exam
                </button>
              )}
            </>
          )}
          
          {studentData.status === "in_progress" && (
            <button
              onClick={handleExam}
              className="text-white bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1 rounded-full font-medium transition-colors"
            >
              Continue
            </button>
          )}
          
          {studentData.status === "submitted" && (
            <button
              onClick={handleExam}
              className="text-white bg-[#102E50] text-md px-3 py-1 rounded-full font-medium 
                hover:brightness-110 transition-colors"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fallback for invalid data
  return (
    <div className="bg-gray-100 p-5 rounded-xl border border-gray-300 w-full max-w-xs">
      <div className="text-center text-gray-500">
        <FiAlertCircle className="text-2xl mx-auto mb-2" />
        <p>Invalid exam data</p>
      </div>
    </div>
  );
}