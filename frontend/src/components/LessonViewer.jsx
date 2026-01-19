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
                        fileUrl={materialData.fileUrl}
                        isVisible={isVisible}
                        setIsVisible={setIsVisible}
                    />
                </div>
            ) : (
                
                    <div className="w-[90%] sm:w-[95%] md:w-3/5 lg:w-4/5 xl:w-3/5 min-h-[250px]
                            flex flex-col rounded-2xl p-4 sm:p-6 pb-12 relative
                            bg-[#F4F6FF] shadow-md mx-auto mt-6 overflow-hidden
                            transition-all duration-200 ease-in-out">

                    
                    <div className="absolute h-[2%] w-full bg-black/10 bottom-0 left-0"></div>

                    {/* CONTENT SECTION */}
                    <div className="relative z-10">
                        <h2 className="font-bold text-2xl md:text-4xl text-[#102E50] mb-1">
                            {materialData.title}
                        </h2>

                        <p className="text-md md:text-xl text-[#102E50]/70 mb-8 lg:mb-12">
                            {materialData.description}
                        </p>

                        <p className="text-sm md:text-lg text-[#E78B48]/90 self-end mb-2">
                            {formattedDate}
                        </p>

                        <hr className="h-px bg-[#102E50]/50 border-0 mb-8" />

                        {/* View Button Group */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-2 mb-4">
                            <ClassicButton 
                                buttonName="View Material"
                                onClick={() => setIsVisible(true)}
                                className="w-full lg:w-4/5 shadow-md xl:text-lg"
                                mainColor="#102E50" 
                                darkColor="#0B2239"
                                icon={MdVisibility}
                            />
                        </div>

                        {/* Action Buttons Group */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-2 mb-3">
                            <ClassicButton 
                                buttonName={teacherRole ? "Generate Assessment" : "Lesson Summary"}
                                onClick={handleClick}
                                className="w-full lg:w-4/5 shadow-md"
                                mainColor="#102E50" 
                                darkColor="#0B2239"
                                icon={teacherRole ? MdAssessment : MdDescription}
                            />

                            {usersRole === "teacher" && (
                                <>
                                    <ClassicButton 
                                        buttonName="Edit"
                                        className="shadow-md w-full text-md"
                                        onClick={() => setEditMaterialOpen(true)}
                                        mainColor="#E78B48" 
                                        darkColor="#B9652B"
                                        icon={MdEdit}
                                    />
                                    <ClassicButton 
                                        buttonName="Archive"
                                        className="shadow-md w-full text-md"
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
