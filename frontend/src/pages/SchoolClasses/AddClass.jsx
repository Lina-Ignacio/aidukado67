import { useState, useEffect } from "react"
import axios from "axios";

export default function AddClass({ onClose, onSuccess }) {

    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        name: "",
        schedule_days: [],      // Array for selected days like ['M', 'W']
        schedule_start: "",     // 24h format like "11:00"
        schedule_end: ""        // 24h format like "12:30"
    })

    // For dropdown options
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

    const labelClass = "text-[#102E50] font-bold opacity-75 mb-1"

    // Day options with single-letter codes
    const dayOptions = [
        { value: 'M', label: 'Monday' },
        { value: 'T', label: 'Tuesday' },
        { value: 'W', label: 'Wednesday' },
        { value: 'R', label: 'Thursday' },
        { value: 'F', label: 'Friday' },
        { value: 'S', label: 'Saturday' },
        { value: 'U', label: 'Sunday' }
    ]

    // Fetch teachers
    const getTeachers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/get_teachers`)
            setTeachers(response.data)
        } catch (err) {
            if (err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, teacherError: err.response.data.detail }))
            } else {
                setErrors(prev => ({ ...prev, teacherError: "Network Error" }))
            }
        }
    }

    // Fetch subjects
    const getSubjects = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/subject/get`)
            setSubjects(response.data)
        } catch (err) {
            if (err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, subjectError: err.response.data.detail }))
            } else {
                setErrors(prev => ({ ...prev, subjectError: "Network Error" }))
            }
        }
    }

    useEffect(() => {
        getTeachers();
        getSubjects();
    }, [])

    // Handle text/select inputs
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Clear error for this field when user types
        if (inputErrors[name]) {
            setInputErrors(prev => ({ ...prev, [name]: "" }))
        }
    }

    // Handle day checkboxes
    const handleDayChange = (dayValue) => {
        setFormData(prev => {
            const currentDays = [...prev.schedule_days];
            if (currentDays.includes(dayValue)) {
                // Remove if already selected
                return {
                    ...prev,
                    schedule_days: currentDays.filter(day => day !== dayValue)
                }
            } else {
                // Add if not selected
                return {
                    ...prev,
                    schedule_days: [...currentDays, dayValue]
                }
            }
        })
        // Clear day error when user selects a day
        if (inputErrors.schedule_days) {
            setInputErrors(prev => ({ ...prev, schedule_days: "" }))
        }
    }

    // Convert 24h time to 12h format (11:00 → 11:00am)
    const formatTime12h = (time24) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'pm' : 'am';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
    }

    // Format schedule string for backend: "MW: 11:00am-12:30pm"
    const formatScheduleString = () => {
        const { schedule_days, schedule_start, schedule_end } = formData;

        if (schedule_days.length === 0 || !schedule_start || !schedule_end) {
            return null;
        }

        // Sort days in standard order: M, T, W, R, F, S, U
        const dayOrder = { 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'S': 6, 'U': 7 };
        const sortedDays = [...schedule_days].sort((a, b) => dayOrder[a] - dayOrder[b]);
        const daysCode = sortedDays.join('');

        // Format times
        const start12h = formatTime12h(schedule_start);
        const end12h = formatTime12h(schedule_end);

        return `${daysCode}: ${start12h}-${end12h}`;
    }

    // Form validation
    const validate = () => {
        const currentErrors = {};

        if (!formData.subject_id) {
            currentErrors.subject_id = "Subject is required"
        }

        if (!formData.teacher_id) {
            currentErrors.teacher_id = "Teacher is required"
        }

        if (!formData.name) {
            currentErrors.name = "Class name is required"
        }

        // Schedule validation
        if (formData.schedule_days.length === 0) {
            currentErrors.schedule_days = "Select at least one day"
        }

        if (!formData.schedule_start) {
            currentErrors.schedule_start = "Start time is required"
        }

        if (!formData.schedule_end) {
            currentErrors.schedule_end = "End time is required"
        }

        // Time validation: end time should be after start time
        if (formData.schedule_start && formData.schedule_end) {
            const start = new Date(`2000-01-01T${formData.schedule_start}`);
            const end = new Date(`2000-01-01T${formData.schedule_end}`);
            if (end <= start) {
                currentErrors.schedule_end = "End time must be after start time"
            }
        }

        return currentErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true);
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setInputErrors(validationErrors)
            setLoading(false);
            return
        }

        setErrors({ teacherError: "", subjectError: "", postError: "" });
        setSuccess("");
        setInputErrors({});

        // Format schedule string
        const scheduleString = formatScheduleString();

        // Prepare API data
        const apiData = {
            subject_id: formData.subject_id,
            teacher_id: formData.teacher_id,
            name: formData.name,
            schedule: scheduleString  // Send formatted string
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/classes/create`,
                apiData,
                { headers: { 'Content-Type': 'application/json' } }
            )

            setSuccess(`Class "${response.data.name}" created successfully`)

            // Reset form
            setFormData({
                subject_id: "",
                teacher_id: "",
                name: "",
                schedule_days: [],
                schedule_start: "",
                schedule_end: ""
            })

            // Call success callback after delay
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Network Error";
            setErrors(prev => ({ ...prev, postError: errorMsg }))
        } finally {
            setLoading(false);
        }
    }

    // Preview the schedule string
    const schedulePreview = formatScheduleString();

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white 
                py-6 px-4 shadow-2xl rounded-lg max-w-md mx-auto"
        >
            <h2 className="text-xl font-bold text-[#102E50] mb-4">Add New Class</h2>

            {/* Error Messages */}
            {inputErrors.name && <p className="text-red-600 text-sm mb-2">{inputErrors.name}</p>}
            {inputErrors.subject_id && <p className="text-red-600 text-sm mb-2">{inputErrors.subject_id}</p>}
            {inputErrors.teacher_id && <p className="text-red-600 text-sm mb-2">{inputErrors.teacher_id}</p>}
            {inputErrors.schedule_days && <p className="text-red-600 text-sm mb-2">{inputErrors.schedule_days}</p>}
            {inputErrors.schedule_start && <p className="text-red-600 text-sm mb-2">{inputErrors.schedule_start}</p>}
            {inputErrors.schedule_end && <p className="text-red-600 text-sm mb-2">{inputErrors.schedule_end}</p>}

            {success && <p className="text-green-600 font-medium mb-4">{success}</p>}

            {errors.postError && <p className="text-red-600 text-sm mb-4">{errors.postError}</p>}
            {errors.teacherError && <p className="text-red-600 text-sm mb-4">{errors.teacherError}</p>}
            {errors.subjectError && <p className="text-red-600 text-sm mb-4">{errors.subjectError}</p>}

            {/* Schedule Preview */}
            {schedulePreview && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded w-full">
                    <p className="text-blue-800 font-semibold text-sm">Schedule Preview:</p>
                    <p className="text-blue-600 font-medium">{schedulePreview}</p>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full h-auto gap-4 text-left"
            >
                {/* Class Name */}
                <div>
                    <label htmlFor="name" className={labelClass}>Class Name:</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Biology 101"
                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject_id" className={labelClass}>Subject:</label>
                    <select
                        id="subject_id"
                        name="subject_id"
                        value={formData.subject_id}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                    >
                        <option value="">Select a subject</option>
                        {subjects.length > 0 ? (
                            subjects.map((subject) => (
                                <option value={subject.id} key={subject.id}>
                                    {subject.name}
                                </option>
                            ))
                        ) : (
                            <option disabled>Loading subjects...</option>
                        )}
                    </select>
                </div>

                {/* Teacher */}
                <div>
                    <label htmlFor="teacher_id" className={labelClass}>Teacher:</label>
                    <select
                        id="teacher_id"
                        name="teacher_id"
                        value={formData.teacher_id}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                    >
                        <option value="">Select a teacher</option>
                        {teachers.length > 0 ? (
                            teachers.map((teacher) => (
                                <option value={teacher.id} key={teacher.id}>
                                    {teacher.firstName} {teacher.lastName}
                                </option>
                            ))
                        ) : (
                            <option disabled>Loading teachers...</option>
                        )}
                    </select>
                </div>

                {/* Schedule Section */}
                <div className="mt-2 pt-4 border-t border-gray-200">
                    <h3 className="text-[#102E50] font-bold text-lg mb-3">Schedule</h3>

                    {/* Days Selection */}
                    <div className="mb-4">
                        <label className={`${labelClass} block mb-2`}>Meeting Days:</label>
                        <div className="flex flex-wrap gap-2">
                            {dayOptions.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => handleDayChange(day.value)}
                                    className={`px-3 py-2 rounded-lg border transition-all ${formData.schedule_days.includes(day.value)
                                            ? 'bg-[#10375C] text-white border-[#10375C]'
                                            : 'bg-gray-100 text-[#102E50] border-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="schedule_start" className={labelClass}>Start Time:</label>
                            
                            <input
                                id="schedule_start"
                                type="time"
                                name="schedule_start"
                                value={formData.schedule_start}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent
                                    [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert 
                                    [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="schedule_end" className={labelClass}>End Time:</label>
                            <input
                                id="schedule_end"
                                type="time"
                                name="schedule_end"
                                value={formData.schedule_end}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent
                                    [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert 
                                    [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 text-[#102E50] font-medium rounded-lg
                            hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-[#10375C] text-white font-medium rounded-lg
                            hover:bg-[#102E50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Add Class"}
                    </button>
                </div>
            </form>
        </div>
    )
}