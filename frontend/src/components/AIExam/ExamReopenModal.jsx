// components/ExamMonitoring/ExamReopenModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ClassicButton from '../classicButton';
import { PiClockCounterClockwise, PiCalendar, PiCheck } from "react-icons/pi";
import { MdClose } from "react-icons/md";

export default function ExamReopenModal({ examId, onClose, onSuccess }) {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [newClosingTime, setNewClosingTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Fetch eligible students on modal open
    useEffect(() => {
        const fetchEligibleStudents = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/exam_reopen/${examId}/reopen-eligible`
                );
                setStudents(res.data || []);
            } catch (err) {
                console.error("Failed to fetch eligible students:", err);
                setError(err.response?.data?.detail || "Failed to load students");
            } finally {
                setLoading(false);
            }
        };
        fetchEligibleStudents();
    }, [examId]);

    // Calculate minimum datetime (current time + 1 hour)
    const getMinDateTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
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
            minute: '2-digit'
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
        
        if (!newClosingTime) {
            setError("Please select a new closing date and time");
            return;
        }

        // Get selected datetime as string
        const selectedDateTimeStr = newClosingTime; // Format: YYYY-MM-DDTHH:MM
        
        // Get minimum datetime as string (1 hour from now)
        const now = new Date();
        const minDateTime = new Date(now.getTime() + 60 * 60 * 1000);
        const minDateTimeStr = minDateTime.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        
        console.log("Selected:", selectedDateTimeStr);
        console.log("Minimum:", minDateTimeStr);
        
        // Compare as strings (same format)
        if (selectedDateTimeStr < minDateTimeStr) {
            setError("New closing time must be at least 1 hour from now");
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
                `${import.meta.env.VITE_API_URL}/exam_reopen/${examId}/reopen`,
                {
                    student_ids: selectedStudents,
                    new_closing_time: isoDateTime
                }
            );

            // Success
            if (onSuccess) onSuccess();
            alert(`Exam reopened for ${selectedStudents.length} student(s) until ${formatDateTime(isoDateTime)}`);
            onClose();
            
        } catch (err) {
            console.error("Failed to reopen exam:", err);
            setError(err.response?.data?.detail || "Failed to reopen exam");
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
                                <h2 className="text-xl font-bold">Reopen Exam</h2>
                                <p className="text-sm text-gray-300">
                                    Select students who missed the deadline
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white rounded-full transition-transform hover:scale-105"
                        >
                            <MdClose className="text-xl text-[#102E50]" />
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
                    <div className="mb-6 p-4 bg-[#EBECF1]/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <PiCalendar className="text-[#102E50]" />
                            <label className="font-semibold text-[#102E50]">
                                New Closing Date & Time
                            </label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="datetime-local"
                                value={newClosingTime}
                                onChange={(e) => setNewClosingTime(e.target.value)}
                                min={getMinDateTime()}
                                className="flex-1 px-4 py-3 border border-[#EBECF1] rounded-lg bg-[#102E50]/90 
                                    focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent"
                                required
                            />
                            {newClosingTime && (
                                <div className="text-md text-gray-600 bg-white p-2 rounded border grid place-items-center">
                                    Selected: {formatDateTime(newClosingTime)}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Must be at least 1 hour from now
                        </p>
                    </div>

                    {/* Student Selection */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-[#102E50]">
                                Eligible Students ({students.length})
                            </h3>
                            <button
                                onClick={selectAll}
                                className="text-sm text-white font-medium bg-[#102E50]"
                            >
                                {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E78B48]"></div>
                                <p className="mt-2 text-gray-500">Loading eligible students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                No students are eligible for reopening.
                                <br />
                                <span className="text-sm">All assigned students have either started the exam or already have reopen access.</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
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
                                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    {student.status}
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
                            {newClosingTime && (
                                <p className="text-xs text-gray-500">
                                    New deadline: {formatDateTime(newClosingTime)}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="px-6 py-2 border border-gray-300 rounded-lg bg-gray-200 text-[#102E50] hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <ClassicButton
                                buttonName={submitting ? "Processing..." : "Reopen Exam"}
                                icon={PiClockCounterClockwise}
                                onClick={handleSubmit}
                                disabled={selectedStudents.length === 0 || !newClosingTime || submitting}
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