import { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdRemoveRedEye, MdVisibilityOff, MdArchive } from "react-icons/md";
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
                
                    <div className="sm:w-[60%] sm:h-auto flex flex-col sm:h-auto sm:min-h-[250px] rounded-md p-5 bg-[#F4F6FF] mt-[5%] gap-4 shadow-md">
                        <h2 className="sm:w-full font-bold text-3xl text-[#102E50]">{materialData.title}</h2>
                        <p className="sm:min-h-[20px] sm:h-auto text-lg text-[#102E50]">{materialData.description}</p>
                        <p className="text-md text-[#F3C623] font-semibold">{formattedDate}</p>
                        
                        <hr className="h-[1px] bg-[#102E50] border-0" />

                        <button className="w-1/2 mt-2 bg-white text-[#10375C] shadow-xl font-bold" onClick={() => setIsVisible(true)}>
                            View Material
                        </button>

                        <div className="flex items-center gap-2 sm:w-full">
                            <button onClick={handleClick} className="flex sm:h-[50px] w-1/2 bg-[#102E50] text-white font-bold items-center justify-center" >
                                {teacherRole ? "Generate Quiz AI" : "Lesson Summary" }
                            </button>
                            {usersRole == "teacher" && (
                                <div className="h-full flex gap-2 ml-auto">
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#F5C45E]"
                                        onClick={() => {setEditMaterialOpen(true)}} 
                                    >
                                        <MdEdit size={24} 
                                        />
                                    </button>
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#BE3D2A]"
                                        onClick={() => {setArchiveMaterialOpen(true)}} 
                                    >
                                        <MdArchive 
                                            size={24} 
                                        />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>   
                
            )}

            
        </>
    )
}
