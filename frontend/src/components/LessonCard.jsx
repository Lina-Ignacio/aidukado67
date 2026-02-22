import { useNavigate } from "react-router-dom"
import { MdMenuBook, MdAssignment, MdTaskAlt, MdWorkOutline, MdScience, MdLock, MdCalendarToday, MdAccessTime } from "react-icons/md";
import { useState, useEffect } from "react";
import axios from "../services/axiosConfig";
import useUserStore from "../store/useUserStore";

export default function LessonCard({ 
    materialName, 
    materialId, 
    creationDate, 
    materialType, 
    classId, 
    totalScore = null,
    dueDate = null,
    status = null,
    submissionData = null
}) {
    
    const navigate = useNavigate();
    const userRole = useUserStore((state) => state.userRole);
    const [isAccessible, setIsAccessible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const isStudent = userRole?.toLowerCase() === "student";
    const isTeacher = userRole?.toLowerCase() === "teacher";
    
    // Check if student has submission (for activities, assignments, etc.)
    const hasSubmission = isStudent && (totalScore !== null || status === "completed" || status === "done" || submissionData);

    const date = new Date(creationDate);
    const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    // Format due date if available
    const formatDueDate = (dateString) => {
        if (!dateString) return null;
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

    // Get icon based on material type
    const getIcon = () => {
        const iconStyle = "text-white text-lg";
        switch (materialType?.toLowerCase()) {
            case "lesson":
                return <MdMenuBook size={24} className={iconStyle}/>;
            case "assignment":
                return <MdAssignment size={24} className={iconStyle}/>;
            case "activity":
                return <MdTaskAlt size={24} className={iconStyle}/>;
            case "project":
                return <MdWorkOutline size={24} className={iconStyle}/>;
            case "laboratory activity":
                return <MdScience size={24} className={iconStyle}/>;
            default:
                return <MdMenuBook size={24} className={iconStyle}/>; 
        }
    };

    // Get color scheme based on type (using 102E50 as base)
    const getTypeColor = () => {
        switch (materialType?.toLowerCase()) {
            case "lesson":
                return "from-[#102E50] to-[#1a3f6a]";
            case "assignment":
                return "from-[#102E50] to-[#2a4a7a]";
            case "activity":
                return "from-[#102E50] to-[#1f3f60]";
            case "project":
                return "from-[#102E50] to-[#1e3a5a]";
            case "laboratory activity":
                return "from-[#102E50] to-[#1d3557]";
            default:
                return "from-[#102E50] to-[#2d4a7a]";
        }
    };

    const handleClick = () => {
        if (isStudent && !isAccessible && !hasSubmission) return;
        navigate(`/selectedLesson/${materialId}/${materialType}`);
    };

    return (
        <div
            className={`relative w-full lg:w-[48%] xl:w-[32%] 
                        rounded-xl border transition-all duration-200
                        ${isStudent && !isAccessible && !hasSubmission 
                            ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm' 
                            : 'bg-gradient-to-br from-blue-50 to-white border-[#102E50]/20 shadow-md hover:shadow-lg hover:border-[#102E50]/40 hover:scale-[1.02] cursor-pointer'
                        }`}
            onClick={handleClick}
        >
            {/* Main content container */}
            <div className="p-5">
                {/* Top section with title and type */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-12">
                        <h3 className={`text-lg font-bold line-clamp-2 leading-tight ${
                            isStudent && !isAccessible && !hasSubmission 
                                ? 'text-gray-700' 
                                : 'text-[#102E50]'
                        }`}>
                            {materialName}
                        </h3>
                        
                        {/* Material type and points if available */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50]">
                                {materialType}
                            </span>
                            {totalScore !== null && (
                                <>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-600">
                                        {totalScore} points
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Status indicator for students */}
                    {isStudent && (
                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5
                            ${hasSubmission ? "bg-green-100 border border-green-200" : 
                              !isAccessible ? "bg-gray-100 border border-gray-200" : 
                              "bg-[#102E50]/10 border border-[#102E50]/20"
                            }`}>
                            <div className={`h-2 w-2 rounded-full ${
                                hasSubmission ? 'bg-green-500' : 
                                !isAccessible ? 'bg-gray-400' : 
                                'bg-[#102E50] animate-pulse'
                            }`} />
                            <span className={`text-xs font-semibold ${
                                hasSubmission ? "text-green-700" : 
                                !isAccessible ? "text-gray-600" : 
                                "text-[#102E50]"
                            }`}>
                                {hasSubmission ? "Completed" : !isAccessible ? "Closed" : "Available"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Due date section - only if dueDate exists */}
                {dueDate && (
                    <div className={`mb-4 p-3 rounded-lg ${
                        isStudent && !isAccessible && !hasSubmission 
                            ? 'bg-gray-100 border border-gray-200' 
                            : 'bg-gradient-to-r from-[#102E50]/5 to-blue-50/50 border border-[#102E50]/10'
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white border border-[#102E50]/10">
                                <MdCalendarToday className="text-[#102E50] text-sm" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-700">Due Date</p>
                                <p className={`text-sm font-medium mt-0.5 ${
                                    isStudent && !isAccessible && !hasSubmission 
                                        ? 'text-gray-600' 
                                        : 'text-[#102E50]'
                                }`}>
                                    {formatDueDate(dueDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Score display for students - only if totalScore exists */}
                {isStudent && hasSubmission && totalScore !== null && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Your Score:</span>
                                <span className={`text-lg font-bold ${
                                    totalScore >= 80 ? 'text-green-600' :
                                    totalScore >= 60 ? 'text-[#102E50]' :
                                    'text-red-600'
                                }`}>
                                    {totalScore}
                                </span>
                            </div>
                            {totalScore > 0 && (
                                <div className="text-right">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        totalScore >= 80 ? 'bg-green-100 text-green-700' :
                                        totalScore >= 60 ? 'bg-[#102E50]/10 text-[#102E50]' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {totalScore}%
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Progress bar for scores */}
                        {totalScore > 0 && (
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        totalScore >= 80 ? 'bg-green-500' :
                                        totalScore >= 60 ? 'bg-[#102E50]' :
                                        'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(totalScore, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Teacher view - different layout for teachers */}
                {isTeacher && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Type</p>
                            <p className="text-lg font-bold text-gray-800 capitalize">{materialType}</p>
                        </div>
                        {totalScore !== null && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Points</p>
                                <p className="text-lg font-bold text-[#102E50]">{totalScore}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom section with creation date */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor()} flex items-center justify-center`}>
                            {getIcon()}
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
                            : 'bg-gradient-to-r from-[#102E50] to-[#1a3f6a] text-white'
                    }`}>
                        <span className="text-xs font-semibold">
                            {isTeacher ? "View" : 
                             hasSubmission ? "View Results" : 
                             !isAccessible ? "Closed" : "Open"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Closed overlay for students - only if not accessible and no submission */}
            {isStudent && !isAccessible && !hasSubmission && !isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                    <div className="p-4 bg-white rounded-lg border border-gray-300 shadow-lg text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-3">
                            <MdLock className="text-gray-500 text-2xl" />
                        </div>
                        <h4 className="font-bold text-gray-700 mb-1">Material Closed</h4>
                        <p className="text-sm text-gray-500 mb-3">This lesson is no longer available</p>
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
                        : 'bg-gradient-to-r from-[#102E50] to-[#2a4a7a]'
                }`}
            />
        </div>
    );
}