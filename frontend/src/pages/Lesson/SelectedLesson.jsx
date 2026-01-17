import PdfViewer from "../../components/PdfViewer";
import FileViewer from "../../components/FileViewer";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate} from "react-router-dom";
import useUserStore from "../../store/useUserStore";

import LessonViewer from "../../components/LessonViewer";
import { MdClose } from "react-icons/md";
import TaskViewer from "../../components/TaskViewer";
import Modal from "../../components/Modal";
import ArchiveMaterial from "./ArchiveMaterial";
import EditMaterial from "./EditMaterial";
import { MdArrowBack } from "react-icons/md";
import ClassicButton from "../../components/classicButton";

export default function SelectedLesson() {

    const navigate = useNavigate();

    const { materialId, materialType} = useParams();
    

    const [material, setMaterial] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    
    const [editMaterialOpen, setEditMaterialOpen] = useState(false);
    const [archiveMaterialOpen, setArchiveMaterialOpen] = useState(false);

    // Error and Messages
    const [archiveError, setArchiveError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    

    const panelStyleEdit = "w-full h-4/5 5 max-w-lg rounded-xl shadow-xl"
    const panelStyleArchive = "w-full h-1/5 max-w-lg rounded-xl shadow-xl"

    const userRole = useUserStore((state) => state.userRole);

    const [fetchFileError, setFetchFileError] = useState("");

    const getMaterial = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/class_material/getMaterialById/${materialId}`)

            setMaterial(response.data);
            console.log("ge", response.data)
        } catch (err) {
            if (err.response?.data?.detail) {
                setFetchFileError(err.response.data.detail)
            } else {
                setFetchFileError("Network Error")
            }
        }
    }

    useEffect(() => {
        getMaterial();
    }, [materialId])

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    
    const fileUrl = material?.fileUrl || "";
    const title = material?.title || "";
    const description = material?.description || "";
    const fileKey = material?.fileKey || "";
    const fileExtension = fileKey.split(".").pop().toLowerCase();
    const totalScore = material?.totalScore || 0;
    const dueDate = material?.dueDate || "";
    const createdAt = material?.createdAt || "";

    const materialData = {
        materialId: materialId,
        materialType: materialType,
        fileExtension: fileExtension,
        fileUrl: fileUrl,
        title: title,
        description: description,
        totalScore: totalScore,
        dueDate: dueDate,
        createdAt: createdAt
    }

    return (
        <div className="w-full h-auto min-h-screen flex flex-col gap-[2%] items-center px-[10px] 
                md:px-[50px] lg:px-[100px] py-[50px] bg-gray-100 relative">

            
            
            {isVisible && (
                <div className="w-[30px] h-[30px] bg-[#BE3D2A] flex mt-2" onClick={() => setIsVisible(false)}>
                    <MdClose size={24} className="text-white font-bold m-auto" />
                </div>
            )}
            {materialType == "lesson" && (
                <LessonViewer 
                    materialData={materialData}
                    setIsVisible={setIsVisible}
                    isVisible={isVisible}
                    setArchiveMaterialOpen={setArchiveMaterialOpen}
                    setEditMaterialOpen={setEditMaterialOpen}
                />
            )}
            {materialType != "lesson" && (
                <TaskViewer 
                    materialData={materialData}
                    setIsVisible={setIsVisible}
                    isVisible={isVisible}
                    setArchiveMaterialOpen={setArchiveMaterialOpen}
                    setEditMaterialOpen={setEditMaterialOpen}
                />
            )}

            <div className="block lg:hidden w-full mt-8 ">
              <ClassicButton 
                buttonName="Back"
                className="shadow-md w-1/2 md:w-1/3 text-md"
                onClick={() => navigate(-1)}
                mainColor="#102E50" 
                darkColor="#0B2239"
                icon={MdArrowBack}
            />
            </div>

            

            <Modal isOpen={archiveMaterialOpen} onClose={() => setArchiveMaterialOpen(false)} title="Archive Lesson" panelStyle={panelStyleArchive}>
                <ArchiveMaterial 
                    setArchiveLessonOpen={setArchiveMaterialOpen}
                    materialId={materialData.materialId}
                    materialType={materialData.materialType}
                    setArchiveError={setArchiveError}
                    setSuccessMessage={setSuccessMessage}
                    onSuccess={() => {
                        setTimeout(() => {
                            setArchiveMaterialOpen(false);
                            navigate(-1, { state: { refresh: true } });
                        }, 800);
                    }}
                />
            </Modal>
            
            <Modal isOpen={editMaterialOpen} onClose={() => setEditMaterialOpen(false)} title="Edit Lesson" panelStyle={panelStyleEdit}>
                <EditMaterial 
                    materialId={materialId}
                    setEditMaterialOpen={setEditMaterialOpen}
                    setSuccessMessage={setSuccessMessage}
                    onSuccess={() => {
                        setTimeout(() => {
                            setEditMaterialOpen(false);
                            navigate(-1, { state: { refresh: true } });
                        }, 800);
                    }}
                />  
            </Modal>
            
        </div>
    )
}

