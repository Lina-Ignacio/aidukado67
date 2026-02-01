import { useState, useEffect } from "react"
import axios from "axios";

export default function EditClass({ classId, onClose, onSuccess }) {

    const [formData, setFormData] = useState({
        subjectId: "",
        teacherId: "",
        name: "",
        schedule_days: [],      // Array for days like ['M', 'W']
        schedule_start: "",     // Start time in 24h format
        schedule_end: ""        // End time in 24h format
    })

    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // For class data fetching error
    const [fetchError, setFetchError] = useState(""); 

    // For input errors
    const [formError, setFormError] = useState({});

    // For option errors
    const [errors, setErrors] = useState({});

    const [submitError, setSubmitError] = useState("");

    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

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

    // Getting List of Teachers
    const getTeachers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/get_teachers`)
            setTeachers(response.data)
        } catch(err) {
            if(err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, teacherError: err.response.data.detail}))
            } else {
                setErrors(prev => ({ ...prev, teacherError: "Network Error"}))
            }
        }
    }

    // Getting List of Subjects
    const getSubjects = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/subject/get`)
            setSubjects(response.data)
        } catch(err) {
            if (err.response?.data?.detail) {
                setErrors(prev => ({ ...prev, subjectError: err.response.data.detail}))
            } else {
                setErrors(prev => ({ ...prev, subjectError: "Network Error"}))
            }
        }
    }

    // Parse schedule string like "MW: 11:00am-12:30pm" to components
    const parseScheduleString = (scheduleString) => {
        if (!scheduleString) return { days: [], start: "", end: "" };
        
        try {
            const [daysPart, timePart] = scheduleString.split(": ");
            const [timeRange] = timePart ? [timePart] : [""];
            const [startTime12h, endTime12h] = timeRange ? timeRange.split("-") : ["", ""];
            
            // Convert 12h to 24h format
            const to24h = (time12h) => {
                if (!time12h) return "";
                const match = time12h.match(/(\d+):(\d+)(am|pm)/i);
                if (!match) return "";
                
                let [_, hours, minutes, period] = match;
                hours = parseInt(hours);
                minutes = parseInt(minutes);
                
                if (period.toLowerCase() === 'pm' && hours < 12) hours += 12;
                if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
                
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            };
            
            return {
                days: daysPart ? daysPart.split('') : [],
                start: to24h(startTime12h),
                end: to24h(endTime12h)
            };
        } catch (error) {
            console.error("Error parsing schedule:", error);
            return { days: [], start: "", end: "" };
        }
    }

    // Getting data for the form
    const getClass = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/getById/${classId}`)
            console.log("Class data:", response.data);
            
            // Parse schedule if it exists
            const scheduleData = response.data.schedule 
                ? parseScheduleString(response.data.schedule)
                : { days: [], start: "", end: "" };
            
            setFormData({
                subjectId: response.data.subject?.id || "",
                teacherId: response.data.userTeacher?.id || "",
                name: response.data.name || "",
                schedule_days: scheduleData.days,
                schedule_start: scheduleData.start,
                schedule_end: scheduleData.end
            });

        } catch (err) {
            if (err.response?.data?.detail) {
                setFetchError(err.response.data.detail)
            } else {
                setFetchError("Failed to load class data")
            }
        }
    }

    useEffect(() => {
        const fetchAll = async () => {
            try {
                await Promise.all([getTeachers(), getSubjects()]);
                await getClass();
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (classId) fetchAll();
    }, [classId]);

    // Handle text/select inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
        // Clear error for this field when user types
        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: "" }));
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
    }

    // Format schedule string for backend: "MW: 11:00am-12:30pm"
    const formatScheduleString = () => {
        const { schedule_days, schedule_start, schedule_end } = formData;

        if (schedule_days.length === 0 || !schedule_start || !schedule_end) {
            return "";
        }

        // Sort days in standard order: M, T, W, R, F, S, U
        const dayOrder = { 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'S': 6, 'U': 7 };
        const sortedDays = [...schedule_days].sort((a, b) => dayOrder[a] - dayOrder[b]);
        const daysCode = sortedDays.join('');

        // Convert 24h to 12h format
        const formatTime12h = (time24) => {
            if (!time24) return "";
            const [hours, minutes] = time24.split(':').map(Number);
            const period = hours >= 12 ? 'pm' : 'am';
            const hours12 = hours % 12 || 12;
            return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
        };

        const start12h = formatTime12h(schedule_start);
        const end12h = formatTime12h(schedule_end);

        return `${daysCode}: ${start12h}-${end12h}`;
    }

    const validate = () => {
        const formErrors = {};

        if (!formData.subjectId) formErrors.subjectId = "Subject is required!";
        if (!formData.teacherId) formErrors.teacherId = "Teacher is required!";
        if (!formData.name) formErrors.name = "Class Name is required!";
        
        // Schedule validation
        if (formData.schedule_days.length === 0) {
            formErrors.schedule_days = "Select at least one day";
        }
        if (!formData.schedule_start) {
            formErrors.schedule_start = "Start time is required";
        }
        if (!formData.schedule_end) {
            formErrors.schedule_end = "End time is required";
        }
        // Time validation
        if (formData.schedule_start && formData.schedule_end) {
            const start = new Date(`2000-01-01T${formData.schedule_start}`);
            const end = new Date(`2000-01-01T${formData.schedule_end}`);
            if (end <= start) {
                formErrors.schedule_end = "End time must be after start time";
            }
        }

        return formErrors;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }

        try {
            setLoading(true);
            
            // Format schedule string
            const scheduleString = formatScheduleString();
            
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/classes/patch/${classId}`, 
                {
                    subject_id: formData.subjectId,
                    teacher_id: formData.teacherId,
                    name: formData.name,
                    schedule: scheduleString  // Add schedule field
                }
            );

            setSuccess(`Class "${response.data.name}" has been updated`);
            setSubmitError("");
            setFormError({});

            if (onSuccess) onSuccess();

        } catch (err) {
            if (err.response?.data?.detail) {
                setSubmitError(err.response.data.detail);
            } else {
                setSubmitError("Network Error")
            }
        } finally {
            setLoading(false);
        }
    }

    const labelClass = "text-[#102E50] font-bold opacity-75 mb-1"

    // Schedule preview
    const schedulePreview = formatScheduleString();

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center 
                bg-white px-4 py-6 shadow-xl rounded-xl max-w-md mx-auto"
        >
            <h2 className="text-xl font-bold text-[#102E50] mb-4">Edit Class</h2>

            {success && <p className="text-green-600 font-medium mb-4">{success}</p>}
            {fetchError && <p className="text-red-600 mb-4">{fetchError}</p>}
            {submitError && <p className="text-red-600 mb-4">{submitError}</p>}

            {/* Schedule Preview */}
            {schedulePreview && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded w-full">
                    <p className="text-blue-800 font-semibold text-sm">Schedule:</p>
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
                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                    />
                    {formError.name && <span className="text-red-600 text-sm">{formError.name}</span>}
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subjectId" className={labelClass}>Subject:</label>
                    <select 
                        id="subjectId" 
                        name="subjectId" 
                        value={formData.subjectId} 
                        onChange={handleChange} 
                        className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50] 
                            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                    >
                        <option value="">Select a subject</option>
                        {subjects.length > 0 ? (
                            subjects.map((subject) => 
                                <option value={subject.id} key={subject.id}>{subject.name}</option>
                            )
                        ) : (
                            <option disabled>Loading subjects...</option>
                        )}
                    </select>
                    {formError.subjectId && <span className="text-red-600 text-sm">{formError.subjectId}</span>}
                </div>

                {/* Teacher */}
                <div>
                    <label htmlFor="teacherId" className={labelClass}>Teacher:</label>
                    <select 
                        id="teacherId" 
                        name="teacherId" 
                        value={formData.teacherId} 
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
                    {formError.teacherId && <span className="text-red-600 text-sm">{formError.teacherId}</span>}
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
                                    className={`px-3 py-2 rounded-lg border transition-all ${
                                        formData.schedule_days.includes(day.value)
                                            ? 'bg-[#10375C] text-white border-[#10375C]'
                                            : 'bg-gray-100 text-[#102E50] border-gray-300 hover:bg-gray-200'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {formError.schedule_days && (
                            <span className="text-red-600 text-sm">{formError.schedule_days}</span>
                        )}
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
                                    [&::-webkit-calendar-picker-indicator]:bg-[#10375C] 
                                    [&::-webkit-calendar-picker-indicator]:p-1 
                                    [&::-webkit-calendar-picker-indicator]:rounded 
                                    [&::-webkit-calendar-picker-indicator]:opacity-80
                                    [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                            />
                            {formError.schedule_start && (
                                <span className="text-red-600 text-sm">{formError.schedule_start}</span>
                            )}
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
                                    [&::-webkit-calendar-picker-indicator]:bg-[#10375C] 
                                    [&::-webkit-calendar-picker-indicator]:p-1 
                                    [&::-webkit-calendar-picker-indicator]:rounded 
                                    [&::-webkit-calendar-picker-indicator]:opacity-80
                                    [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                            />
                            {formError.schedule_end && (
                                <span className="text-red-600 text-sm">{formError.schedule_end}</span>
                            )}
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
                        {loading ? "Updating..." : "Update Class"}
                    </button>
                </div>
            </form>
        </div>
    )
}