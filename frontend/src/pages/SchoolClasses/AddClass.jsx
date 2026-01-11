
import { useState, useEffect } from "react"
import axios from "axios";

export default function AddClass({ onClose, onSuccess}) {


    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        name: ""
    })

    // For optionsss
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("")

    const [errors, setErrors] = useState({
        teacherError: "",
        subjectError: "",
        postError: ""
    })

    const [inputErrors, setInputErrors] = useState({})

    const labelClass = "text-[#102E50] font-bold opacity-75"

    const getTeachers = async () => {
        try{
            const response = await axios.get("http://localhost:8000/user/get_teachers")

            setTeachers(response.data)
        } catch(err) {
            if(err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, teacherError: err.response.data.detail}))
            } else {
                setErrors(prev => ({ ...prev, teacherError: "Network Error"}))
            }
        }
    }

    const getSubjects = async () => {
        try {
            const response = await axios.get("http://localhost:8000/subject/get")

            setSubjects(response.data)
        } catch(err) {
            if (err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, subjectError: err.response.data.detail}))
            } else {
                setErrors(prev => ({ ...prev, subjectError: "Network Error"}))
            }
        }
    }


     
    useEffect(()=> {
        getTeachers();
        getSubjects();
    }, [])

    
    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData((prev) => ({...prev, [name] : value}))
    }


    const validate = () => {
        const currentErrors = {};

        if (!formData.subject_id) {
            currentErrors.subject_id = "Subject Id is required"
        }

        if (!formData.teacher_id) {
            currentErrors.teacher_id = "Teacher Id is required"
        }

        if (!formData.name) {
            currentErrors.name = "Class name is required"
        }

        return currentErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true);
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setInputErrors(validationErrors)
            return
        }

        setErrors({ teacherError: "", subjectError: "", postError: "" });
        setSuccess("");


        try {
            const response = await axios.post("http://localhost:8000/classes/create", formData, 
                {headers: {'Content-Type' : 'application/json'}}
            )

            setSuccess(`Class ${response.data.name} is created successfully`)

            setFormData({
                subject_id: "",
                teacher_id: "",
                name: ""
            })

            if (onSuccess) onSuccess();

        } catch(err) {
            setErrors((prev) => ({...prev, postError: err.response?.data?.detail || "Network Error" })) 
        } finally {
            setLoading(false);
        }


    }


    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white 
                py-6 px-4 shadow-2xl rounded-lg"
        >
            {inputErrors.name && <p className="text-red-800">{inputErrors.name}</p>}
            {inputErrors.subject_id && <p className="text-red-800">{inputErrors.subject_id}</p>}
            {inputErrors.teacher_id && <p className="text-red-800">{inputErrors.teacher_id}</p>}
            
            {success && <p className="text-green-800">{success}</p>}
            {errors && (
                <>
                    <p className="text-red-800">{errors.teacherError}</p>
                    <p className="text-red-800">{errors.subjectError}</p>
                    <p className="text-red-800">{errors.postError}</p>
                </>
            )}
            <form
                method="post"
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-3 text-left rounded-2xl"
            >

                <label htmlFor="name" className={labelClass}>Class Name:</label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                        focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                />

                <label htmlFor="subject_id" className={labelClass}>Subject:</label>
                <select 
                    id="subject_id" 
                    name="subject_id" 
                    value={formData.subject_id} 
                    onChange={handleChange} 
                    className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                >
                    <option 
                        value=""
                        className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                        >
                        select a subject
                    </option>
                    {subjects.length > 0 ? (
                        subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)
                    ) : (<option disabled>Error fetching subjects</option>)}
                </select>

                <label htmlFor="teacher_id" className={labelClass}>Teacher:</label>
                <select 
                    id="teacher_id" 
                    name="teacher_id" 
                    value={formData.teacher_id} 
                    onChange={handleChange} 
                    className="w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200"
                >
                    <option value="">select a teacher</option>
                    {teachers.length > 0 ? (
                        teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.firstName} {teacher.lastName}</option>)
                    ) : (<option disabled>Error fetching teachers</option>)}
                </select>

                
                <div className="flex gap-2 mt-4">
                    <button 
                        className="w-1/2 mt-[1%] bg-[#EBEBEB] font-bold text-[#102E50] transition-transform duration-200 hover:scale-95 shadow-md"
                        onClick={onClose}
                        type="button"
                    >CANCEL
                        
                    </button>
                    <button
                        type="submit"
                        className="w-1/2 mt-[1%] bg-[#10375C] text-white transition-transform duration-200 hover:scale-95 shadow-md"
                    >
                        {loading ? "ADDING..." : "ADD CLASS"}
                    </button>
                </div>
                
            </form>
        </div>
    )
}