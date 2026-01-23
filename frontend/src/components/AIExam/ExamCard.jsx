// components/ExamCard.jsx
import { useNavigate } from "react-router-dom";
import { FaGraduationCap, FaClock, FaAward, FaBook } from "react-icons/fa";

export default function ExamCard({ 
  examId, 
  lessonTitle, 
  examTitle, 
  createdAt, 
  onArchive,
  totalPoints = 0,
  duration = 0,
  passingScore = null
}) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/exam/${examId}`);
  };

  const handleArchiveClick = (e) => {
    e.stopPropagation();
    if (onArchive && window.confirm("Are you sure you want to archive this exam?")) {
      onArchive(examId);
    }
  };

  return (
    <div 
      className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow cursor-pointer w-full max-w-xs"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FaGraduationCap className="text-blue-600 text-sm" />
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Exam</span>
          </div>
          <h3 className="font-bold text-lg text-gray-800 truncate">{examTitle}</h3>
        </div>
      </div>
      
      {/* Exam Details */}
      <div className="space-y-2 mb-3">
        {totalPoints > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Total: <span className="font-semibold">{totalPoints} points</span></span>
          </div>
        )}
        
        {duration > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <FaClock className="text-gray-400 text-xs" />
            <span className="text-gray-700">{duration} minutes</span>
          </div>
        )}
        
        {passingScore && (
          <div className="flex items-center gap-2 text-sm">
            <FaAward className="text-green-500 text-xs" />
            <span className="text-gray-700">Pass: <span className="font-semibold text-green-600">{passingScore} points</span></span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500 border-t border-blue-100 pt-3">
        <span className="text-xs">Created: {new Date(createdAt).toLocaleDateString()}</span>
        {onArchive && (
          <button
            onClick={handleArchiveClick}
            className="text-red-600 hover:text-red-800 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}