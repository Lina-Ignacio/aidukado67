import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAnalytics, MdPerson, MdWarning, MdCheckCircle, MdAccessTime, MdDoneAll, MdHourglassEmpty, MdEdit, MdSchedule } from "react-icons/md";
import StudentSelectModal from '../../components/AssignQuiz/StudentSelectModal';
import QuizReopenModal from '../../components/AIQuiz/QuizReopenModal';
import useClassStore from '../../store/useClassStore';
import ClassicButton from '../../components/classicButton';
import { PiStudent, PiKeyReturn, PiClockCounterClockwise, PiCalendar, PiClock } from "react-icons/pi";
import { FaUserClock } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import UserDropup from '../../components/DropUp/UserDropUp';

// Color Palette from your design
const COLORS = {
  primary: '#102E50',      // Dark blue
  secondary: '#E78B48',    // Orange
  lightBg: '#EBECF1',      // Light gray background
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Yellow/Amber
  danger: '#EF4444',       // Red
  info: '#3B82F6',         // Blue
  purple: '#8B5CF6',       // Purple
  gray: '#6B7280',         // Gray
  white: '#FFFFFF',
};

export default function QuizMonitoring() {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const classId = useClassStore((state) => state.classId);

    // Quiz info
    const [quizTitle, setQuizTitle] = useState("");
    const [lessonTitle, setLessonTitle] = useState("");
    const [totalPoints, setTotalPoints] = useState(0);
    const [data, setData] = useState([]);
    const [quizDetails, setQuizDetails] = useState(null);
    const [isPastDue, setIsPastDue] = useState(false);
    const [deadlineStatus, setDeadlineStatus] = useState("");
    const [timeRemaining, setTimeRemaining] = useState("");

    // Modal states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);

    // Statistics
    const [stats, setStats] = useState({
        completed: 0,
        inProgress: 0,
        assigned: 0,
        notAssigned: 0,
        lateSubmissions: 0,
        averageScore: 0
    });

    // Fetch quiz details including deadline
    useEffect(() => {
        const fetchQuizDetails = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/getQuiz/${quizId}`);
                setQuizDetails(res.data);
                
                if (res.data.closing_time) {
                    const closingTime = new Date(res.data.closing_time);
                    const now = new Date();
                    setIsPastDue(now > closingTime);
                    updateDeadlineStatus(closingTime, now);
                    updateTimeRemaining(closingTime, now);
                }
            } catch (err) {
                console.error("Failed to fetch quiz details:", err);
            }
        };
        fetchQuizDetails();
    }, [quizId]);

    // Update deadline status
    const updateDeadlineStatus = (closingTime, now) => {
        const timeDiff = closingTime - now;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (timeDiff > 0) {
            if (daysDiff > 1) {
                setDeadlineStatus(`Due in ${daysDiff} days`);
            } else if (daysDiff === 1) {
                setDeadlineStatus("Due tomorrow");
            } else {
                const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
                setDeadlineStatus(hoursDiff > 1 ? `Due in ${hoursDiff} hours` : `Due in <1 hour`);
            }
        } else {
            const overdueDays = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
            setDeadlineStatus(overdueDays > 0 ? `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}` : "Overdue today");
        }
    };

    // Update time remaining
    const updateTimeRemaining = (closingTime, now) => {
        const timeDiff = closingTime - now;
        if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m`);
            } else {
                setTimeRemaining(`${minutes}m`);
            }
        } else {
            setTimeRemaining("Time's up");
        }
    };

    // Fetch quiz info & scores
    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizMonitoring/${quizId}`);
                setQuizTitle(res.data.quizTitle);
                setLessonTitle(res.data.lessonTitle);
                setTotalPoints(res.data.totalPoints);
                setData(res.data.scores || []);
                calculateStats(res.data.scores || [], res.data.closingTime);
            } catch (err) {
                console.error("Failed to fetch quiz data:", err);
            }
        };
        fetchQuizData();
    }, [quizId]);

    // Calculate statistics
    const calculateStats = (scores, closingTime) => {
        if (!scores.length) return;
        
        let completed = 0;
        let inProgress = 0;
        let assigned = 0;
        let notAssigned = 0;
        let lateSubmissions = 0;
        let totalScore = 0;
        let scoreCount = 0;
        
        const closingTimeDate = closingTime ? new Date(closingTime) : null;
        
        scores.forEach(item => {
            switch(item.status) {
                case 'completed':
                    completed++;
                    if (item.score !== null) {
                        totalScore += item.score;
                        scoreCount++;
                    }
                    if (closingTimeDate && item.startTime && new Date(item.startTime) > closingTimeDate) {
                        lateSubmissions++;
                    }
                    break;
                case 'submitted':
                    completed++;
                    if (closingTimeDate && item.startTime && new Date(item.startTime) > closingTimeDate) {
                        lateSubmissions++;
                    }
                    break;
                case 'started':
                    inProgress++;
                    break;
                case 'assigned':
                    assigned++;
                    break;
                case 'not_assigned':
                    notAssigned++;
                    break;
            }
        });
        
        setStats({
            completed,
            inProgress,
            assigned,
            notAssigned,
            lateSubmissions,
            averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
        });
    };

    // Fetch students for modal
    const fetchAssignData = async () => {
        try {
            const allRes = await axios.get(`${import.meta.env.VITE_API_URL}/getStudentsByClass/${classId}`);
            const assignedRes = await axios.get(`${import.meta.env.VITE_API_URL}/quiz/${quizId}/assigned-students`);
            setStudents(allRes.data || []);
            setAssignedStudents(assignedRes.data || []); 
            setSelectedStudents([]); 
        } catch (err) {
            console.error("Failed to fetch students:", err);
        }
    };

    const openAssignModal = () => {
        fetchAssignData();
        setShowAssignModal(true);
    };

    const openReopenModal = () => {
        setShowReopenModal(true);
    };

    const toggleStudent = (id) => {
        if (assignedStudents.includes(id)) return; 
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const confirmAssign = async () => {
        if (selectedStudents.length === 0) return;

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/assignQuizStudents`, {
                quiz_id: quizId,
                student_ids: selectedStudents
            });

            setAssignedStudents(prev => [...prev, ...selectedStudents]);
            setSelectedStudents([]);
            setShowAssignModal(false);
            
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizMonitoring/${quizId}`);
            setData(res.data.scores || []);
            calculateStats(res.data.scores || [], res.data.closingTime);
            
            alert("Students assigned successfully!");
        } catch (err) {
            console.error("Failed to assign students:", err);
            alert("Failed to assign students.");
        }
    };

    const handleReopenSuccess = () => {
        const fetchQuizData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizMonitoring/${quizId}`);
                setData(res.data.scores || []);
                calculateStats(res.data.scores || [], res.data.closingTime);
                
                const detailsRes = await axios.get(`${import.meta.env.VITE_API_URL}/getQuiz/${quizId}`);
                setQuizDetails(detailsRes.data);
            } catch (err) {
                console.error("Failed to refresh quiz data:", err);
            }
        };
        fetchQuizData();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "No deadline set";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch(status) {
            case 'completed':
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: COLORS.success };
            case 'submitted':
                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: COLORS.info };
            case 'started':
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: COLORS.warning };
            case 'assigned':
                return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: COLORS.purple };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: COLORS.gray };
        }
    };

    // Get status icon component
    const getStatusIcon = (status) => {
        const colors = getStatusColor(status);
        switch(status) {
            case 'completed':
                return <MdDoneAll className="text-lg" style={{ color: colors.icon }} />;
            case 'submitted':
                return <MdEdit className="text-lg" style={{ color: colors.icon }} />;
            case 'started':
                return <MdHourglassEmpty className="text-lg" style={{ color: colors.icon }} />;
            case 'assigned':
                return <FaUserClock className="text-lg" style={{ color: colors.icon }} />;
            default:
                return <MdPerson className="text-lg" style={{ color: colors.icon }} />;
        }
    };

    return (
        <div className="w-11/12 lg:w-4/5 mx-auto mt-6 mb-10 bg-white rounded-2xl shadow-lg overflow-hidden font-sans border border-[#EBECF1]">
            
            <UserDropup />

            {/* Header Section */}
            <div className="relative" style={{ backgroundColor: COLORS.primary }}>
                <div className="absolute inset-0 bg-gradient-to-r from-[#102E50] to-[#1E4A7F]"></div>
                <div className="relative p-8 text-white">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.secondary + '20' }}>
                                <MdAnalytics className="text-xl" style={{ color: COLORS.secondary }} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Quiz Monitoring</h1>
                                <p className="text-sm opacity-80">Track student performance and submissions</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="text-sm opacity-80">Total Points</p>
                                <p className="text-2xl font-bold" style={{ color: COLORS.secondary }}>{totalPoints}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quiz Info Card */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm uppercase tracking-widest opacity-80 mb-1">Assessment</p>
                                    <h2 className="text-xl font-bold">{quizTitle}</h2>
                                    <p className="text-sm opacity-90">Lesson: {lessonTitle}</p>
                                </div>
                                
                                {quizDetails?.closing_time && (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <PiCalendar className="text-lg" style={{ color: COLORS.secondary }} />
                                            <span className="text-sm">
                                                Deadline: {formatDate(quizDetails.closing_time)}
                                            </span>
                                        </div>
                                        
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                                            isPastDue 
                                                ? 'bg-red-500/20 text-red-200 border border-red-300/30' 
                                                : 'bg-green-500/20 text-green-200 border border-green-300/30'
                                        }`}>
                                            {isPastDue ? (
                                                <MdWarning className="text-lg" />
                                            ) : (
                                                <MdCheckCircle className="text-lg" />
                                            )}
                                            <span>{deadlineStatus}</span>
                                            {!isPastDue && timeRemaining && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <PiClock className="text-sm" />
                                                    <span>{timeRemaining}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Badge */}
                            <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
                                isPastDue 
                                    ? 'bg-red-500/20 border border-red-300/30' 
                                    : 'bg-[#E78B48]/20 border border-[#E78B48]/30'
                            }`}>
                                <div className={`p-2 rounded ${
                                    isPastDue ? 'bg-red-500' : 'bg-[#E78B48]'
                                }`}>
                                    <MdAccessTime className="text-white text-lg" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">
                                        {isPastDue ? "CLOSED" : "ACTIVE"}
                                    </p>
                                    <p className="text-xs opacity-80">
                                        {isPastDue ? "Deadline passed" : "Accepting submissions"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6" style={{ backgroundColor: COLORS.lightBg }}>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-[#EBECF1] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '10' }}>
                                <FiUsers className="text-lg" style={{ color: COLORS.success }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{data.length}</p>
                                <p className="text-xs text-gray-500">Total Students</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-[#EBECF1] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '10' }}>
                                <MdDoneAll className="text-lg" style={{ color: COLORS.success }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{stats.completed}</p>
                                <p className="text-xs text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-[#EBECF1] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '10' }}>
                                <MdHourglassEmpty className="text-lg" style={{ color: COLORS.warning }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{stats.inProgress}</p>
                                <p className="text-xs text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-[#EBECF1] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.purple + '10' }}>
                                <FaUserClock className="text-lg" style={{ color: COLORS.purple }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>{stats.assigned}</p>
                                <p className="text-xs text-gray-500">Assigned</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-b border-[#EBECF1]">
                <div className="flex justify-end gap-3">
                    <ClassicButton 
                        buttonName="Assign Students"
                        icon={PiStudent}
                        onClick={openAssignModal}
                        className="" 
                        mainColor={COLORS.primary} 
                        darkColor="#0D243F"
                    />
                    <ClassicButton 
                        buttonName="Reopen Quiz"
                        icon={PiClockCounterClockwise}
                        onClick={openReopenModal}
                        className={`${!isPastDue ? "opacity-50 cursor-not-allowed" : ""}`}
                        mainColor={COLORS.secondary} 
                        darkColor="#D67C39"
                        disabled={!isPastDue}
                    />
                </div>
            </div>

            {/* Student Table */}
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold" style={{ color: COLORS.primary }}>Student Submissions</h3>
                    <p className="text-sm text-gray-500">View and manage student progress</p>
                </div>
                
                <div className="bg-white rounded-xl border border-[#EBECF1] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr style={{ backgroundColor: COLORS.primary }}>
                                    <th className="px-6 py-4 text-left font-medium text-sm uppercase tracking-widest text-white">Student</th>
                                    <th className="px-6 py-4 text-center font-medium text-sm uppercase tracking-widest text-white">Status</th>
                                    <th className="px-6 py-4 text-center font-medium text-sm uppercase tracking-widest text-white">Progress</th>
                                    <th className="px-6 py-4 text-right font-medium text-sm uppercase tracking-widest text-white">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EBECF1]">
                                {data.length > 0 ? data.map((item, i) => {
                                    const colors = getStatusColor(item.status);
                                    const isLate = quizDetails?.closing_time && 
                                        item.startTime && 
                                        new Date(item.startTime) > new Date(quizDetails.closing_time);
                                    
                                    const scorePercentage = item.score ? Math.round((item.score / totalPoints) * 100) : 0;
                                    
                                    return (
                                        <tr key={i} className="hover:bg-[#EBECF1]/30 transition-colors">
                                            {/* Student Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                                        style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                                                    >
                                                        {item.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium" style={{ color: COLORS.primary }}>
                                                            {item.studentName}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs text-gray-500">ID: {item.studentId}</p>
                                                            {isLate && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                    <MdWarning className="mr-1" size={10} /> Late
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Status Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.border}`}>
                                                        {getStatusIcon(item.status)}
                                                        <span className={`text-sm font-medium ${colors.text}`}>
                                                            {item.submissionStatus}
                                                        </span>
                                                    </div>
                                                    {item.startTime && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(item.startTime).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* Progress Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full transition-all duration-500"
                                                            style={{ 
                                                                width: `${scorePercentage}%`,
                                                                backgroundColor: item.status === 'completed' || item.status === 'submitted' 
                                                                    ? scorePercentage >= 70 ? COLORS.success 
                                                                    : scorePercentage >= 50 ? COLORS.warning 
                                                                    : COLORS.danger 
                                                                    : COLORS.gray
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {item.status === 'completed' || item.status === 'submitted' 
                                                            ? `${scorePercentage}%` 
                                                            : 'Not started'}
                                                    </p>
                                                </div>
                                            </td>
                                            
                                            {/* Score Column */}
                                            <td className="px-6 py-4 text-right">
                                                {item.score !== null && item.score !== undefined ? (
                                                    <div className="inline-flex flex-col items-end">
                                                        <span 
                                                            className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${
                                                                scorePercentage >= 70 ? 'bg-green-50 text-green-700 border border-green-200' : 
                                                                scorePercentage >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                                                                'bg-red-50 text-red-700 border border-red-200'
                                                            }`}
                                                        >
                                                            {item.score}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">out of {totalPoints}</span>
                                                    </div>
                                                ) : item.status === 'submitted' ? (
                                                    <span className="inline-block px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                        Awaiting Grade
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <FiUsers className="text-4xl mb-4" style={{ color: COLORS.gray + '50' }} />
                                                <p className="text-lg font-medium text-gray-500 mb-2">No students found</p>
                                                <p className="text-sm text-gray-400">Assign students to this quiz to see their progress</p>
                                                <button 
                                                    onClick={openAssignModal}
                                                    className="mt-4 px-4 py-2 rounded-lg font-medium"
                                                    style={{ backgroundColor: COLORS.info, color: 'white' }}
                                                >
                                                    Assign Students
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#EBECF1]">
                    <div>
                        <p className="text-sm text-gray-500">
                            Showing {data.length} student{data.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <ClassicButton 
                            buttonName="Back"
                            icon={PiKeyReturn}
                            onClick={() => navigate(-1)}
                            className="" 
                            mainColor={COLORS.primary} 
                            darkColor="#0D243F"
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAssignModal && (
                <StudentSelectModal
                    students={students}
                    selectedStudents={selectedStudents}
                    disabledStudents={assignedStudents}
                    onToggle={toggleStudent}
                    onConfirm={confirmAssign}
                    onCancel={() => setShowAssignModal(false)}
                />
            )}

            {showReopenModal && (
                <QuizReopenModal
                    quizId={quizId}
                    onClose={() => setShowReopenModal(false)}
                    onSuccess={handleReopenSuccess}
                />
            )}
        </div>
    );
}