import axios from "axios";
import { useState } from "react";
import { MdClose } from "react-icons/md";

export default function DeleteUser({ userId, onClose, onSuccess}) {

    const [deleteError, setDeleteError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/user/archive/${userId}`, )
            if(onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.data?.detail) {
                setDeleteError(err.response.data.detail)
            } else {
                setDeleteError("Network Error")
            }
        }
    }


    return (
        <div className="w-full h-auto max-w-lg flex flex-col bg-white px-8 py-6
                gap-2 shadow-xl rounded-xl items-center h-full">
            {deleteError && (<p className="text-red-800">{deleteError}</p>)}
            <div 
                className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1 
                    transition-transform duration-300 hover:scale-110 mt-2" 
                onClick={onClose}
            >
                  <MdClose className="text-[#393E46] text-2xl" />
            </div>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-4 text-left rounded-2xl mt-7"
            >
                <h1 className="text-[#10375C] font-bold xl:text-2xl"> Are You Sure You Want To Archive This User With Id Number {userId} ?</h1>
                <p className="text-[#10375C] xl:text-md"> This action will move the user to the archive and hide it from the list.</p>
                <div className="w-full flex ">
                    <button
                        type="submit"
                        className="w-full mt-1 bg-[#8E1616] text-white transition-transform duration-200 
                            hover:scale-95 shadow-md rounded-2xl mb-5 xl:text-lg p-3"
                    >
                        Archive User
                    </button>
                </div>
                
            </form>
        </div>
    )
}