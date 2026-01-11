import { useState, useEffect } from "react"
import axios from "axios";



export default function EditSubject({ subject_id, onClose, onSuccess }) {


    const [formData, setFormData] = useState({
        name : "",
        description: ""
    })

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");


    const getSubjects = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/subject/getById/${subject_id}`, {
                params: {query : subject_id}
            })
            setFormData({
                name: response.data.name,
                description: response.data.description
            })
        } catch (err) {
            console.error("Error fetching subjects", err);
        }
    }


    useEffect(() => {
        if(subject_id) {
            getSubjects()
        }
    }, [subject_id])

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}))
    }


    const validate = () => {

        const currentErrors = {};

        if(!formData.name) {currentErrors.name = "Subject Name is Required"}
        if(!formData.description) {currentErrors.description = "Subject Description is Required"}

        return currentErrors;
    }


    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const validationErrors = validate()

        if(Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        setErrors({})
        setLoading(true)

        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/subject/update/${subject_id}`, {
                name: formData.name,
                description: formData.description
            })

            setSuccess(`Subject with subject_id: ${response.data.id} has been updated`)

            if(onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.data?.detail) {
                setErrors({api : err.response.data.detail})
            } else {
                setErrors({api : "Network Error"})
            }
        } finally {
            setLoading(false)
        }

    }


    const labelClass = "text-[#102E50] font-bold opacity-75"

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white py-4 px-6 
                shadow-xl rounded-xl"
        >
            {errors.api && (<p>{errors.api}</p>)}
            {success && (<p>{success}</p>)}
            
            <form 
                method="post"
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-2 text-left rounded-2xl mt-2"
            >

                <label className={labelClass}>Subject Name:</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                        focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                />

                <label className={labelClass}>Description:</label>
                <textarea
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                        focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                    rows="5"
                    cols="5"
                />
                <div className="flex gap-2 my-4">
                    <button 
                        className="w-1/2 mt-[1%] bg-[#EBEBEB] font-bold text-[#102E50] transition-transform 
                            duration-200 hover:scale-95 shadow-md xl:text-lg p-2"
                        onClick={onClose}
                        type="button"
                    >CANCEL
                        
                    </button>
                    <button
                        type="submit"
                        className="w-1/2 mt-[1%] bg-[#10375C] text-white transition-transform duration-200 
                            hover:scale-95 shadow-md xl:text-lg p-2"
                        >
                        {loading ? "SUBMITTING..." : "SUBMIT"}
                    </button>
                </div>
                
            </form>
        </div>
    )
}