import { MdEdit, MdDelete, MdRemoveRedEye, MdVisibilityOff, MdArchive, MdOutlinePreview, 
MdOutlineCancel, MdVisibility, MdDescription, MdAssessment } from "react-icons/md";
import FileView from "../pages/Lesson/FileView";
import {useNavigate } from 'react-router-dom';
import userRole from '../store/useUserStore'
import useClassStore from "../store/useClassStore";
import ClassicButton from "./classicButton";


export default function LessonViewer({materialData, setIsVisible, isVisible, setArchiveMaterialOpen, setEditMaterialOpen}) {
    const navigate = useNavigate();
    const usersRole = userRole((state) => state.userRole);

    const classId = useClassStore((state) => state.classId);
    

    const teacherRole = usersRole.toLowerCase() === "teacher";

    const handleClick = () => {
        if(usersRole.toLowerCase() === "teacher"){
            navigate(`/AIQuiz/${materialData.materialId}`);
        }
        else if(usersRole.toLowerCase() === "student"){
            navigate(`/lessonSummary/${materialData.materialId}`)
        }
        else{
            navigate("/login")
        }
    }


    const due = new Date(materialData.createdAt);

    const formattedDate = due.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <>
            {isVisible ? (
                <div className="w-full h-auto min-h-screen">
                    <FileView 
                        fileExtension={materialData.fileExtension}
                        fileName={materialData.title}
                        fileUrl={materialData.fileUrl}
                        isVisible={isVisible}
                        setIsVisible={setIsVisible}
                    />
                </div>
            ) : (
                <div className="w-[90%] sm:w-[95%] md:w-4/5 lg:w-3/4 xl:w-3/5 min-h-[280px]
                        flex flex-col rounded-2xl p-6 sm:p-8 pb-8 relative
                        bg-white shadow-xl mx-auto mt-8 overflow-hidden
                        border-l-4 border-[#E78B48] hover:shadow-2xl transition-all duration-300">
                    
                    {/* Decorative header accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C45E]/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#102E50]/5 rounded-full blur-3xl"></div>
                    
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E78B48] via-[#F5C45E] to-[#E78B48]"></div>

                    {/* CONTENT SECTION */}
                    <div className="relative z-10">
                        {/* Header with type indicator */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-[#102E50] text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        {materialData.type || "Material"}
                                    </span>
                                    {materialData.total_score && (
                                        <span className="bg-[#F5C45E] text-[#102E50] text-xs font-semibold px-3 py-1 rounded-full">
                                            {materialData.total_score} pts
                                        </span>
                                    )}
                                </div>
                                <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl text-[#102E50] leading-tight mb-2">
                                    {materialData.title}
                                </h2>
                            </div>
                            <div className="bg-[#F5C45E]/20 p-2 rounded-lg flex-shrink-0">
                                <MdDescription className="w-6 h-6 text-[#E78B48]" />
                            </div>
                        </div>

                        {/* Description with better visual hierarchy */}
                        <div className="bg-gray-50 p-4 rounded-xl mb-5 border border-gray-100">
                            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                {materialData.description || "No description provided"}
                            </p>
                        </div>

                        {/* Metadata section */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="bg-[#102E50]/10 p-1.5 rounded-full">
                                    <svg className="w-4 h-4 text-[#102E50]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-500">Posted:</span>
                                <span className="text-sm font-medium text-[#102E50]">{formattedDate}</span>
                            </div>
                            
                            {materialData.due_date && (
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#E78B48]/10 p-1.5 rounded-full">
                                        <svg className="w-4 h-4 text-[#E78B48]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-500">Due:</span>
                                    <span className="text-sm font-medium text-[#E78B48]">
                                        {new Date(materialData.due_date).toLocaleDateString("en-US", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <hr className="h-px bg-gradient-to-r from-transparent via-[#102E50]/30 to-transparent border-0 mb-6" />

                        {/* View Button Group */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-3 mb-4">
                            <ClassicButton 
                                buttonName="View Material"    
                                onClick={() => setIsVisible(true)}
                                className="w-full lg:w-4/5 shadow-md hover:shadow-lg text-sm lg:text-base"
                                mainColor="#102E50" 
                                darkColor="#0B2239"
                                icon={MdVisibility}
                            />
                        </div>

                        {/* Action Buttons Group */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-3">
                            <ClassicButton 
                                buttonName={teacherRole ? "Generate Assessment" : "Lesson Summary"}
                                onClick={handleClick}
                                className="w-full lg:w-4/5 shadow-md hover:shadow-lg text-sm lg:text-base"
                                mainColor="#102E50" 
                                darkColor="#0B2239"
                                icon={teacherRole ? MdAssessment : MdDescription}
                            />

                            {usersRole === "teacher" && (
                                <>
                                    <ClassicButton 
                                        buttonName="Edit"
                                        className="shadow-md hover:shadow-lg w-full text-sm lg:text-base"
                                        onClick={() => setEditMaterialOpen(true)}
                                        mainColor="#E78B48" 
                                        darkColor="#B9652B"
                                        icon={MdEdit}
                                    />
                                    <ClassicButton 
                                        buttonName="Archive"
                                        className="shadow-md hover:shadow-lg w-full text-sm lg:text-base"
                                        onClick={() => setArchiveMaterialOpen(true)}
                                        mainColor="#8E1616"
                                        darkColor="#660F0F" 
                                        icon={MdArchive}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}