import { useNavigate } from "react-router-dom";
import { 
  FaClock, 
  FaHourglassHalf,
} from "react-icons/fa";
import { FiCheckCircle, FiClock, FiAlertCircle, FiBookOpen, FiTarget, FiCalendar } from "react-icons/fi";
import { useState, useEffect } from "react";
import axios from "../../services/axiosConfig";

export default function ExamCard({ 
  examData,
  userRole = "student", 
  lessonTitle = "" 
}) {
  const navigate = useNavigate();
  const [isExamClosed, setIsExamClosed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
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
    isArchive: examData.is_archive || false,
    closingTime: examData.closing_time
  } : null;
  
  // Student data structure - Handles both flat and nested exam data
  const studentData = !isTeacher ? {
    // The exam progress record fields
    id: examData.id,
    studentId: examData.student_id,
    examId: examData.exam_id,
    status: examData.status,
    score: examData.score,
    answers: examData.answers || {},
    startTime: examData.start_time,
    createdAt: examData.created_at,
    updatedAt: examData.updated_at,
    
    // The exam details fields - Check if exam object exists, otherwise use direct properties
    examTitle: examData.exam?.title || examData.title,
    examTotalPoints: examData.exam?.total_points || examData.total_points,
    examDuration: examData.exam?.duration || examData.duration,
    examInstructions: examData.exam?.instructions || examData.instructions,
    examPassingScore: examData.exam?.passing_score || examData.passing_score,
    closingTime: examData.exam?.closing_time || examData.closing_time,
    allowReopen: examData.exam?.allow_reopen || examData.allow_reopen
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
        bgColor: "bg-gradient-to-r from-blue-50 to-blue-100",
        textColor: "text-blue-700",
        borderColor: "border border-blue-200",
        icon: <FiClock className="text-blue-600" />,
        buttonText: "Start Exam",
        buttonColor: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
      },
      "in_progress": {
        text: "In Progress",
        bgColor: "bg-gradient-to-r from-amber-50 to-amber-100",
        textColor: "text-amber-700",
        borderColor: "border border-amber-200",
        icon: <FaHourglassHalf className="text-amber-600" />,
        buttonText: "Continue",
        buttonColor: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
      },
      "submitted": {
        text: "Completed",
        bgColor: "bg-gradient-to-r from-emerald-50 to-emerald-100",
        textColor: "text-emerald-700",
        borderColor: "border border-emerald-200",
        icon: <FiCheckCircle className="text-emerald-600" />,
        buttonText: "View Results",
        buttonColor: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
      }
    };
    
    return statusConfig[status] || statusConfig.assigned;
  };

  // Format due date
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

  // Teacher view 
  if (isTeacher && teacherData) {
    return (
      <div 
        className="relative w-full rounded-xl border transition-all duration-200 
                   bg-gradient-to-br from-slate-50 to-white border-slate-200 
                   hover:border-blue-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
        onClick={handleClick}
      >
        {/* Bottom accent bar */}
        <div className="absolute h-1.5 w-full bottom-0 left-0 rounded-b-xl bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        {/* Main content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-12">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight">
                {teacherData.title}
              </h3>
              
              {/* Exam type badge */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200">
                  <FiBookOpen className="text-blue-600 text-xs" />
                  <span className="text-xs font-medium text-blue-700">Exam</span>
                </div>
                
                {/* Archive badge if archived */}
                {teacherData.isArchive && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300">
                    <span className="text-xs font-medium text-slate-600">Archived</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Total Points</p>
              <p className="text-lg font-bold text-blue-600">{teacherData.totalPoints}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <p className="text-lg font-bold text-slate-800">{teacherData.duration} min</p>
            </div>
          </div>

          {/* Additional info */}
          <div className="space-y-2">
            {teacherData.passingScore > 0 && (
              <div className="flex items-center gap-2">
                <FiTarget className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600">
                  Passing: <span className="font-semibold text-slate-800">{teacherData.passingScore} points</span>
                </span>
              </div>
            )}
            
            {teacherData.closingTime && (
              <div className="flex items-center gap-2">
                <FiCalendar className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600">
                  Due: <span className="font-semibold text-slate-800">{formatDueDate(teacherData.closingTime)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-500">Created</div>
              <div className="text-sm font-medium text-slate-700">
                {teacherData.createdAt ? 
                  new Date(teacherData.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Recently'
                }
              </div>
            </div>
            
            <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <span className="text-xs font-semibold">Monitor</span>
            </div>
          </div>
        </div>
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
      <div className="relative w-full rounded-xl border transition-all duration-200 
                      bg-gradient-to-br from-slate-50 to-white border-slate-200 
                      hover:border-slate-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        
        {/* Bottom accent bar based on status */}
        <div className={`absolute h-1.5 w-full bottom-0 left-0 rounded-b-xl ${
          studentData.status === "submitted" ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
          studentData.status === "in_progress" ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
          'bg-gradient-to-r from-blue-500 to-indigo-600'
        }`} />
        
        {/* Main content */}
        <div className="p-5">
          {/* Header with title and status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-12">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight">
                {studentData.examTitle || "Untitled Exam"}
              </h3>
              
              {/* Exam type badge */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200">
                  <FiBookOpen className="text-blue-600 text-xs" />
                  <span className="text-xs font-medium text-blue-700">Exam</span>
                </div>
              </div>
            </div>
            
            {/* Status badge */}
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${statusBadge.bgColor} ${statusBadge.borderColor}`}>
              <div className="h-2 w-2 rounded-full bg-current opacity-75" />
              <span className={`text-xs font-semibold ${statusBadge.textColor}`}>
                {statusBadge.text}
              </span>
            </div>
          </div>

          {/* Exam details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Total Points</p>
              <p className="text-lg font-bold text-blue-600">{studentData.examTotalPoints || 0}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <div className="flex items-center gap-1">
                <FaClock className="text-slate-400 text-sm" />
                <p className="text-lg font-bold text-slate-800">{studentData.examDuration || 0} min</p>
              </div>
            </div>
          </div>

          {/* Score display for submitted exams */}
          {studentData.status === "submitted" && studentData.score !== null && studentData.score !== undefined && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 mb-1">Your Score</p>
                  <p className="text-xl font-bold text-emerald-800">
                    {studentData.score}
                    <span className="text-lg text-emerald-600">/{studentData.examTotalPoints}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {percentage}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPassing ? 'Passed ✓' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    isPassing ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Additional info */}
          <div className="space-y-2 mb-4">
            {studentData.examPassingScore > 0 && (
              <div className="flex items-center gap-2">
                <FiTarget className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600">
                  Passing: <span className="font-semibold text-slate-800">{studentData.examPassingScore} points</span>
                </span>
              </div>
            )}
            
            {studentData.closingTime && (
              <div className="flex items-center gap-2">
                <FiCalendar className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600">
                  Due: <span className="font-semibold text-slate-800">{formatDueDate(studentData.closingTime)}</span>
                </span>
              </div>
            )}
            
            {studentData.status === "in_progress" && studentData.startTime && (
              <div className="flex items-center gap-2">
                <FiClock className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600">
                  Started: <span className="font-semibold text-slate-800">
                    {new Date(studentData.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Footer with action button */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-500">Assigned</div>
              <div className="text-sm font-medium text-slate-700">
                {studentData.createdAt ? 
                  new Date(studentData.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Recently'
                }
              </div>
            </div>
            
            {/* Action button */}
            {studentData.status === "assigned" ? (
              <>
                {isChecking ? (
                  <button
                    disabled
                    className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold cursor-not-allowed"
                  >
                    Checking...
                  </button>
                ) : isExamClosed ? (
                  <button
                    disabled
                    className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold cursor-not-allowed"
                  >
                    Exam Closed
                  </button>
                ) : (
                  <button
                    onClick={handleExam}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Start Exam
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleExam}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusBadge.buttonColor}`}
              >
                {statusBadge.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* Closed exam overlay */}
        {studentData.status === "assigned" && isExamClosed && !isChecking && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto mb-3">
                <FiAlertCircle className="text-slate-500 text-2xl" />
              </div>
              <h4 className="font-bold text-slate-700 mb-1">Exam Closed</h4>
              <p className="text-sm text-slate-500 mb-3">Submission period has ended</p>
              {studentData.closingTime && (
                <div className="text-xs text-slate-400">
                  Was due: {formatDueDate(studentData.closingTime)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for invalid data
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mx-auto mb-3">
          <FiAlertCircle className="text-slate-400 text-xl" />
        </div>
        <p className="text-slate-600 font-medium">Invalid exam data</p>
        <p className="text-sm text-slate-400 mt-1">Unable to load exam information</p>
      </div>
    </div>
  );
}