import axios from "axios";


export default function ArchiveMaterial ({setArchiveLessonOpen, materialType, materialId, setSuccessMessage, setArchiveError, onSuccess}) {

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        try {
            const response = await axios.patch(`http://localhost:8000/class_material/toggleArchive/${materialId}`);
    
            setSuccessMessage(response.data.message);
            setArchiveError("");
            if (onSuccess) onSuccess();
        } catch(err) {
            if (err.response?.data?.detail) {
                setArchiveError(err.response.data.detail);
            } else {
                setArchiveError("Network Error");
            }
        }
    }



    return (
        <div className="flex flex-col w-full h-[200px] gap-4 p-5 items-center justify-center bg-white rounded-xl">
            <h2 className="text-black font-bold text-xl w-full">Are you sure you want to archive this {materialType} </h2>
            <div className="flex gap-2 w-full">
                <button 
                    className="w-1/2 rounded-md bg-[#102E50]"
                    onClick={() => setArchiveLessonOpen(false)}
                >
                    Close
                </button>
                <button 
                    className="w-1/2 rounded-md bg-[#BE3D2A]"
                    onClick={handleSubmit}
                >
                    Confirm
                </button>
            </div>
        </div>
    )
}