import { useState } from "react";
import { MdEdit, MdRemoveRedEye, MdVisibilityOff, MdArchive } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import FileView from "../pages/Lesson/FileView";
import FileUploader from "./FileUploader";
import useUserStore from "../store/useUserStore";
import axios from "axios";
import ArchiveMaterial from "../pages/Lesson/ArchiveMaterial";
import Modal from "./Modal";

export default function TaskViewer({materialData, setIsVisible, isVisible, setArchiveMaterialOpen, setEditMaterialOpen}) {

    const navigate = useNavigate();
    
    const [file, setFile] = useState(null)

    const userId = useUserStore((state) => state.userId);
    const userRole = useUserStore((state) => state.userRole);

    
    const [metaData, setMetaData] = useState({
        materialId: materialData.materialId,
        type: materialData.materialType,
        studentId: userId,
    })

    const [uploadError, setUploadError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const maxFileSize = 5 * 1024 * 1024;
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > maxFileSize) {
            alert("File size exceeds 5 MB. Please upload a smaller file.");
            e.target.value = "";
            return;
        }
        setFile(selectedFile);
    };

    
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metaData));
    formData.append("file", file);


    const handleSubmit = async(e) => {
        e.preventDefault();

        const url = "http://localhost:8000/student_submission/upload"

        try {
            const response = await axios.post(url, formData, {
                headers: { "Content-Type" : "multipart/form-data"}
            })
            setSuccessMessage(response.data.message)
            setUploadError("");

        } catch (err) {
            if (err.response?.data?.detail) {
                setUploadError(err.response.data.detail)
            } else {
                setUploadError("Network Error")
            }
        }
    }

    const panelStyleEdit = "w-full h-2/5 max-w-lg rounded-xl shadow-xl"
    const panelStyleArchive = "w-full h-1/5 max-w-lg rounded-xl shadow-xl"

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
                <div className="sm:w-1/2 sm:h-auto bg-gray-800 p-3 rounded-xl">
                    <div className="w-full h-full flex flex-col sm:h-auto sm:min-h-[250px] rounded-md p-4 bg-[#F4F6FF]">
                        {successMessage && <p className="text-green-800">{successMessage}</p>}
                        {uploadError && <p className="text-red-800">{uploadError}</p>}
                        <h2 className="sm:w-full font-bold text-3xl text-[#102E50]">{materialData.title}</h2>
                        <p className="sm:min-h-[20px] sm:h-auto text-lg text-[#102E50]">{materialData.description}</p>
                        <p className="text-md text-[#F5C45E]">October 10</p>
                        
                        <div className="flex w-full h-[200px] gap-4 mt-4">
                            {userRole == "student" && (
                                <div className="flex flex-col gap-4 w-1/2 h-full shadow-lg">
                                    <FileUploader 
                                        type=".pdf, .doc, .docx"
                                        handleFileChange={handleFileChange}
                                    />
                                    <button 
                                        onClick={handleSubmit}
                                        className="w-full bg-[#102E50]">
                                        Submit File
                                    </button>   
                                </div>
                            )}
                            <div className="w-1/2 h-full flex flex-col gap-2">
                                <button
                                    className="w-full h-1/2 bg-white text-[#BE3D2A] shadow-xl flex flex-col items-center justify-center"
                                    onClick={() => setIsVisible(true)}
                                >
                                    <MdVisibilityOff className="text-green-800" size={30} />
                                    <p className="text-[#102E50] font-bold">View Material</p>
                                </button>
                                <img
                                    className="w-1/2 h-1/2 object-contain rounded-b-lg m-auto"
                                    src="/studying.png"
                                    alt="Lesson Preview"
                                />
                            </div>
                            {userRole == "teacher" && (
                                <div className="flex items-end justify-end self-end w-1/2 gap-2 ml-auto">
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#F5C45E]"
                                        onClick={() => setEditMaterialOpen(true)}
                                    >
                                        <MdEdit size={24} />
                                    </button>
                                    <button 
                                        className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#BE3D2A]"
                                        onClick={() => setArchiveMaterialOpen(true)} 
                                    >
                                        <MdArchive size={24} />
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