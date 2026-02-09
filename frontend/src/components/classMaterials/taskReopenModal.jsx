
import { useState, useEffect } from 'react';
import axios from 'axios';
import ClassicButton from '../classicButton';
import { PiClockCounterClockwise, PiCalendar, PiCheck, PiNotePencil } from "react-icons/pi";
import { MdClose } from "react-icons/md";

export default function TaskReopenModal({ materialId, onClose, onSuccess }) {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [newDueDate, setNewDueDate] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    
    useEffect(() => {
        const setDefaultDateTime = () => {
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            
            // Format to YYYY-MM-DDTHH:MM
            const year = oneHourLater.getFullYear();
            const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
            const day = String(oneHourLater.getDate()).padStart(2, '0');
            const hours = String(oneHourLater.getHours()).padStart(2, '0');
            const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
            
            setNewDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        };
        
        setDefaultDateTime();
    }, []);

    // Fetch eligible students on modal open
    useEffect(() => {
        const fetchEligibleStudents = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/task_reopen/${materialId}/reopen-eligible`
                );
                setStudents(res.data || []);
            } catch (err) {
                console.error("Failed to fetch eligible students:", err);
                const errorMsg = err.response?.data?.detail || "Failed to load eligible students";
                setError(errorMsg);
                // If task is not past due, show specific message
                if (err.response?.status === 400 && errorMsg.includes("not past due")) {
                    setError("Task is not past due yet. Reopen is only available after the due date.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchEligibleStudents();
    }, [materialId]);

    // Calculate minimum datetime (current time + 30 minutes)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        return now.toISOString().slice(0, 16);
    };

    // Format date for display
    const formatDateTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (selectedStudents.length === 0) {
            setError("Please select at least one student");
            return;
        }
        
        if (!newDueDate) {
            setError("Please select a new due date and time");
            return;
        }

        // Validate new due date
        const selectedDateTimeStr = newDueDate;
        const minDateTimeStr = getMinDateTime();
        
        if (selectedDateTimeStr < minDateTimeStr) {
            setError("New due date must be at least 30 minutes from now");
            return;
        }

        // Convert to ISO string for API
        const [datePart, timePart] = selectedDateTimeStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        const selectedDate = new Date(year, month - 1, day, hours, minutes);
        const isoDateTime = selectedDate.toISOString();

        try {
            setSubmitting(true);
            setError("");

            await axios.post(
                `${import.meta.env.VITE_API_URL}/task_reopen/${materialId}/reopen`,
                {
                    student_ids: selectedStudents,
                    new_due_date: isoDateTime,
                    reason: reason || null
                }
            );

            // Success
            if (onSuccess) onSuccess();
            alert(`Task reopened for ${selectedStudents.length} student(s) until ${formatDateTime(isoDateTime)}`);
            onClose();
            
        } catch (err) {
            console.error("Failed to reopen task:", err);
            setError(err.response?.data?.detail || "Failed to reopen task");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-[#102E50] p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <PiClockCounterClockwise className="text-2xl text-[#E78B48]" />
                            <div>
                                <h2 className="text-xl font-bold">Reopen Task</h2>
                                <p className="text-sm text-gray-300">
                                    Allow selected students to submit after deadline
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            disabled={submitting}
                        >
                            <MdClose className="text-xl text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Date Time Picker */}
                    <div className="mb-6 p-4 bg-[#0B2239]/10 rounded-lg border border-[#102E50]/20">
                        <div className="flex items-center gap-2 mb-2">
                            <PiCalendar className="text-[#102E50]" />
                            <label className="font-semibold text-[#102E50]">
                                New Due Date & Time
                            </label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="datetime-local"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                min={getMinDateTime()}
                                className="flex-1 px-4 py-3 border border-[#102E50] rounded-lg bg-[#102E50]
                                    focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent
                                    text-white placeholder:text-white/70
                                    shadow-inner"
                                required
                            />
                            {newDueDate && (
                                <div className="text-sm text-[#102E50] bg-[#EBECF1] p-3 rounded border border-[#102E50]/20 grid place-items-center shadow-sm">
                                    Selected: {formatDateTime(newDueDate)}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-[#102E50]/70 mt-2">
                            Must be at least 30 minutes from now
                        </p>
                    </div>

                    // Reason Input section - Updated
                    <div className="mb-6 p-4 bg-[#EBECF1]/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <PiNotePencil className="text-[#102E50]" />
                            <label className="font-semibold text-[#102E50]">
                                Reason (Optional)
                            </label>
                        </div>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for reopening (e.g., 'Technical issues', 'Special consideration')"
                            className="w-full px-4 py-3 border border-[#102E50]/30 rounded-lg bg-white
                                focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent
                                resize-none h-24 text-[#102E50] placeholder:text-[#102E50]/60"
                            maxLength={500}
                        />
                        <p className="text-xs text-[#102E50]/70 mt-2">
                            {reason.length}/500 characters
                        </p>
                    </div>

                    {/* Student Selection */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-[#102E50]">
                                Eligible Students ({students.length})
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    (No submission or late submission)
                                </span>
                            </h3>
                            {students.length > 0 && (
                                <button
                                    onClick={selectAll}
                                    className="text-sm px-3 py-1.5 bg-[#102E50] text-white rounded-lg hover:bg-[#0B2239] transition-colors"
                                >
                                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E78B48]"></div>
                                <p className="mt-2 text-gray-500">Loading eligible students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                <p className="mb-2">No students are eligible for reopening.</p>
                                <p className="text-sm">
                                    All students have either submitted on time or already have an extension.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${selectedStudents.includes(student.id)
                                                ? "bg-[#E78B48]/10 border-[#E78B48]"
                                                : "bg-white border-[#EBECF1] hover:bg-gray-50"
                                            }`}
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedStudents.includes(student.id)
                                                ? "bg-[#E78B48] border-[#E78B48]"
                                                : "border-gray-300"
                                            }`}>
                                            {selectedStudents.includes(student.id) && (
                                                <PiCheck className="text-white text-xs" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-[#102E50]">
                                                {student.full_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${student.status === "no_submission"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}>
                                                    {student.submission_status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID: {student.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#EBECF1] p-6 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">
                                Selected: <span className="font-semibold">{selectedStudents.length}</span> student(s)
                            </p>
                            {newDueDate && (
                                <p className="text-xs text-gray-500">
                                    New deadline: {formatDateTime(newDueDate)}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="px-6 py-2 border border-gray-300 rounded-lg bg-white text-[#102E50] hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <ClassicButton
                                buttonName={submitting ? "Processing..." : "Reopen Task"}
                                icon={PiClockCounterClockwise}
                                onClick={handleSubmit}
                                disabled={selectedStudents.length === 0 || !newDueDate || submitting}
                                className="min-w-[140px]"
                                mainColor="#E78B48"
                                darkColor="#D97C38"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}