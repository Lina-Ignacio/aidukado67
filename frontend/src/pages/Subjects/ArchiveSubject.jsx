import axios from "../../services/axiosConfig"
import { useState } from "react"
import { MdClose } from "react-icons/md"

export default function DeleteSubject({ subject_id, onClose, onSuccess}) {
    

    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/subject/archive/${subject_id}`)

            if(onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else {
                setError("Network Error")
            }
        }
    }



    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white px-6 py-4 shadow-xl rounded-2xl">
            {error && (<p className="text-sm text-[#8E1616]/80">{error}</p>)}
            <div 
                className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1 
                    transition-transform duration-300 hover:scale-110 mt-3 mb-6" 
                onClick={onClose}
            >
                <MdClose className="text-[#393E46] text-2xl" />
            </div>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-3 text-left"
            >
                <h1 className="text-[#10375C] font-bold xl:text-2xl"> Are You Sure You Want To Archive This Subject With Id Number {subject_id} ?</h1>
                <p className="text-[#10375C] xl:text-md"> This action will move this subject to the archive and hide it from the list.</p>
                <div className="w-full flex gap-2 my-2">
                    <button
                        type="submit"
                        className="w-full mt-[1%] bg-[#8E1616] text-white transition-transform duration-200 
                            hover:scale-95 shadow-md xl:text-lg p-2"
                    >
                        Archive Subject
                    </button>
                </div>
                
            </form>
        </div>
    )
}