import { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdRemoveRedEye, MdVisibilityOff, MdArchive, MdOutlinePreview, 
MdOutlineCancel, MdVisibility, MdDescription, MdAssessment } from "react-icons/md";
import FileView from "../pages/Lesson/FileView";
import {useNavigate } from 'react-router-dom';
import userRole from '../store/useUserStore'
import useClassStore from "../store/useClassStore";
import { useParams } from "react-router-dom";
import Modal from "./Modal";
import ArchiveMaterial from "../pages/Lesson/ArchiveMaterial";
import EditMaterial from "../pages/Lesson/EditMaterial";
import axios from "axios";


export default function LessonViewer({materialData, setIsVisible, isVisible, setArchiveMaterialOpen, setEditMaterialOpen}) {
    const navigate = useNavigate();
    const usersRole = userRole((state) => state.userRole);

    const classId = useClassStore((state) => state.classId);
    

    const teacherRole = usersRole.toLowerCase() === "teacher";

    const handleClick = () => {
        if(usersRole.toLowerCase() === "teacher"){
            navigate(`/createQuiz/${classId}/${materialData.materialId}`);
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
                <div className="w-full h-auto min-h-screen bg-black p-2">
                    <FileView 
                        fileExtension={materialData.fileExtension}
                        fileUrl={materialData.fileUrl}
                    />
                </div>
            ) : (
                
                    <div className="w-[90%] sm:w-[95%] md:w-3/4 2xl:w-3/5 min-h-[250px]
                            flex flex-col gap-3 rounded-2xl p-4 sm:p-6
                            bg-[#F4F6FF] shadow-md mx-auto mt-6">

                        <h2 className="font-bold text-2xl md:text-4xl text-[#102E50]">
                            {materialData.title}
                        </h2>

                        <p className="text-md md:text-xl text-[#102E50]/80">
                            {materialData.description}
                        </p>

                        <p className="text-sm md:text-lg font-semibold text-[#E78B48]/90 self-end">
                            {formattedDate}
                        </p>

                        <hr className="h-px bg-[#102E50] border-0" />

                        {/* View Button */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-2">
                            <button
                                onClick={() => setIsVisible(true)}
                                className="w-full lg:w-4/5 bg-[#102E50] text-white py-2 rounded-md
                                        hover:bg-[#0B2239] flex items-center justify-center gap-2"
                            >
                                <MdVisibility className="text-lg md:text-2xl" />
                                <span className="text-md md:text-lg">View Material</span>
                            </button>
                        </div>
                        

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] w-full gap-2">

                            <button
                            onClick={handleClick}
                            className="w-full lg:w-4/5 bg-[#102E50] text-white py-2 rounded-md
                                        hover:bg-[#0B2239] flex items-center justify-center gap-2"
                            >
                            {teacherRole ? <MdAssessment className="text-lg md:text-2xl" /> :
                                            <MdDescription className="text-lg md:text-2xl" />}
                            <span className="text-md md:text-lg">
                                {teacherRole ? "Generate Quiz AI" : "Lesson Summary"}
                            </span>
                            </button>

                            {usersRole === "teacher" && (
                            <>
                                <button
                                    onClick={() => setEditMaterialOpen(true)}
                                    className="w-full h-[44px] sm:h-[50px] bg-[#102E50] text-white rounded-lg
                                                flex items-center justify-center gap-2"
                                >
                                    <MdEdit className="text-lg md:text-2xl" />
                                    <span className="text-md md:text-lg">Edit</span>
                                </button>

                                <button
                                    onClick={() => setArchiveMaterialOpen(true)}
                                    className="w-full h-[44px] sm:h-[50px] bg-[#BE3D2A] text-white rounded-lg
                                                flex items-center justify-center gap-2"
                                >
                                    <MdArchive className="text-lg md:text-2xl" />
                                    <span className="text-md md:text-lg">Archive</span>
                                </button>
                            </>
                            )}
                        </div>
                        </div>

                
            )}

            
        </>
    )
}
