import axios from "../../services/axiosConfig";
import { useState } from "react"
import { MdClose } from "react-icons/md";

export default function DeleteEnrollment({enrollmentId, setSuccess, onClose, onSuccess}) {

    const [deleteError, setDeleteError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/enrollment/archive/${enrollmentId}`)
            setSuccess(response.data.message);

            if (onSuccess) onSuccess();
        } catch(err) {
            if (err.response?.data?.detail) {
                setDeleteError(err.response.data.detail)
            } else {
                setDeleteError("Network Error")
            }
        }
    }

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white px-8 py-6 shadow-xl rounded-2xl">
            {deleteError && (<p className="text-red-800">{deleteError}</p>)}
            <div 
                className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1 
                    transition-transform duration-300 hover:scale-110 mt-3 mb-6" 
                onClick={onClose}
                >
                <MdClose className="text-[#393E46] text-2xl" />
            </div>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-3 text-left rounded-2xl"
            >
                <h1 className="text-[#10375C] font-bold xl:text-2xl"> Are You Sure You Want To Archive This Enrollment With Id Number {enrollmentId} ?</h1>
                <p className="text-[#10375C] xl:text-md"> This action will move the enrollment to the archive and hide it from the list.</p>
                <div className="w-full flex gap-2 mt-2">
                    
                    <button
                        type="submit"
                        className="w-full mt-[1%] bg-[#8E1616] text-white transition-transform 
                            duration-200 hover:scale-95 shadow-md mb-3 rounded-xl xl:text-lg p-2"
                    >
                        Archive Enrollment
                    </button>
                </div>
                
            </form>
        </div>
    )
}