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


    

    return (
        <>
            {isVisible ? (
                <div className="sm:w-3/5 sm:h-auto">
                    <FileView 
                        fileExtension={materialData.fileExtension}
                        fileUrl={materialData.fileUrl}
                    />
                </div>
            ) : (
                <div className="sm:w-[55%] sm:h-auto bg-gray-800 p-3 rounded-xl">
                    <div className="w-full h-full flex flex-col sm:h-auto sm:min-h-[250px] rounded-md p-4 bg-[#F4F6FF]">
                        <h2 className="sm:w-full font-bold text-3xl text-[#102E50]">{materialData.title}</h2>
                        <p className="sm:min-h-[20px] sm:h-auto text-lg text-[#102E50]">{materialData.description}</p>
                        <p className="text-md text-[#102E50]">October 10</p>
                        
                        <button className="w-1/2 mt-2 bg-white text-[#BE3D2A] shadow-xl" onClick={() => setIsVisible(true)}>
                            <MdVisibilityOff className="text-green-800 m-auto" size={30} />
                            <p className="text-[#102E50] font-bold">View File</p>
                        </button>

                        <div className="flex items-center gap-2 sm:w-full mt-4">
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
                </div> 
            )}

            
        </>
    )
}
