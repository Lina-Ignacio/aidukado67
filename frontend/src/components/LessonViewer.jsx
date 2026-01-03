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
                <div className="sm:w-3/4 h-[90%]">
                    <FileView 
                        fileExtension={materialData.fileExtension}
                        fileUrl={materialData.fileUrl}
                    />
                </div>
            ) : (
                
                    <div className="md:w-3/4 xl:w-3/5 sm:h-auto flex flex-col sm:h-auto sm:min-h-[250px] rounded-md p-[20px] 
                            bg-[#F4F6FF] mt-[5%] gap-4 shadow-md m-8 lg:mx-5"
                    >
                        <h2 className="font-bold text-2xl md:text-4xl text-[#102E50]">{materialData.title}</h2>
                        <p className="text-base md:text-xl text-[#102E50]/80">{materialData.description}</p>
                        <p className="text-[#F5C45E]/90 font-semibold gap-2 text-sm md:text-lg">
                            {formattedDate}
                        </p>
                        
                        <hr className="h-[1px] bg-[#102E50] border-0" />

                        <button className="bg-[#102E50] text-white py-2 rounded-md hover:bg-[#0B2239]
                                    flex justify-center items-center gap-1 w-full sm:w-1/2 lg:w-1/2 
                                    xl:w-1/3" 
                                onClick={() => setIsVisible(true)}
                        >
                            <MdVisibility className="text-lg lg:text-xl xl:text-2xl text-white"/>
                            <span className="text-md lg:text-lg">View Material</span>
                        </button>

                        <div className="flex items-center gap-2 sm:w-full">
                            <button onClick={handleClick} className="bg-[#102E50] text-white py-2 rounded-md hover:bg-[#0B2239]
                                    flex justify-center items-center gap-1 w-full sm:w-1/2 lg:w-1/2 xl:w-1/3" >
                                {teacherRole ? 
                                    <MdAssessment className="text-lg lg:text-xl xl:text-2xl text-white"/> : 
                                    <MdDescription className="text-lg lg:text-xl xl:text-2xl text-white"/>}
                                
                                <span className="text-md lg:text-lg">{teacherRole ? "Generate Quiz AI" : "Lesson Summary" }</span>
                            </button>
                            {usersRole == "teacher" && (
                                <div className="h-full flex gap-2 ml-auto">
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#102E50] gap-1"
                                        onClick={() => {setEditMaterialOpen(true)}} 
                                    >
                                        <MdEdit className="text-lg xl:text-2xl"/>
                                        <span className="text-md xl:text-lg">Edit</span> 
                                    </button>
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#BE3D2A] gap-1"
                                        onClick={() => {setArchiveMaterialOpen(true)}} 
                                    >
                                        <MdArchive className="text-lg xl:text-2xl"/>
                                        <span className="text-md xl:text-lg">Archive</span> 
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>   
                
            )}

            
        </>
    )
}
