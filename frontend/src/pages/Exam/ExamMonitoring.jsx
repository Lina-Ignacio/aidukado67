import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAnalytics, MdPerson, MdAccessTime, MdScore } from "react-icons/md";
import StudentSelectModal from '../../components/AssignQuiz/StudentSelectModal';
import useClassStore from '../../store/useClassStore';
import ClassicButton from '../../components/classicButton';
import { PiStudent, PiKeyReturn } from "react-icons/pi";
import UserDropup from '../../components/DropUp/UserDropUp';

export default function ExamMonitoring() {
    const navigate = useNavigate();
    const { examId } = useParams();
    const classId = useClassStore((state) => state.classId);

    // Exam info
    const [examTitle, setExamTitle] = useState("");
    const [totalPoints, setTotalPoints] = useState(0);
    const [duration, setDuration] = useState(0);
    const [passingScore, setPassingScore] = useState(0);
    const [instructions, setInstructions] = useState("");
    const [data, setData] = useState([]);
    const [linkedMaterials, setLinkedMaterials] = useState([]);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalStudents: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        averageScore: 0,
        passRate: 0
    });

    // Fetch exam info & scores
    useEffect(() => {
        const fetchExamData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/exam/monitoring/${examId}`);
                setExamTitle(res.data.examTitle);
                setTotalPoints(res.data.totalPoints);
                setDuration(res.data.duration);
                setPassingScore(res.data.passingScore);
                setInstructions(res.data.instructions);
                setLinkedMaterials(res.data.linkedMaterials || []);
                setData(res.data.scores || []);
                
                // Calculate stats
                calculateStats(res.data.scores || []);
            } catch (err) {
                console.error("Failed to fetch exam data:", err);
            }
        };
        fetchExamData();
    }, [examId]);

    // Calculate statistics
    const calculateStats = (scores) => {
        const total = scores.length;
        const completed = scores.filter(s => s.status === 'submitted').length;
        const inProgress = scores.filter(s => s.status === 'in_progress').length;
        const notStarted = scores.filter(s => s.status === 'assigned').length;
        
        const submittedScores = scores.filter(s => s.status === 'submitted' && s.score !== null);
        const averageScore = submittedScores.length > 0 
            ? (submittedScores.reduce((sum, s) => sum + s.score, 0) / submittedScores.length).toFixed(1)
            : 0;
        
        const passed = submittedScores.filter(s => passingScore && s.score >= passingScore).length;
        const passRate = submittedScores.length > 0 
            ? Math.round((passed / submittedScores.length) * 100)
            : 0;

        setStats({
            totalStudents: total,
            completed,
            inProgress,
            notStarted,
            averageScore,
            passRate
        });
    };

    // Fetch students for modal
    const fetchAssignData = async () => {
        try {
            const allRes = await axios.get(`${import.meta.env.VITE_API_URL}/getStudentsByClass/${classId}`);
            const assignedRes = await axios.get(`${import.meta.env.VITE_API_URL}/exam/${examId}/assigned-students`);

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

    const toggleStudent = (id) => {
        if (assignedStudents.includes(id)) return; 
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const confirmAssign = async () => {
        if (selectedStudents.length === 0) return;

        try {
            
            await axios.post(`${import.meta.env.VITE_API_URL}/exam/assign-students`, {
                exam_id: examId,
                student_ids: selectedStudents
            });

            setAssignedStudents(prev => [...prev, ...selectedStudents]);
            setSelectedStudents([]);
            setShowAssignModal(false);
            alert("Students assigned successfully!");
            
            // Refresh data
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/exam/monitoring/${examId}`);
            setData(res.data.scores || []);
            calculateStats(res.data.scores || []);
        } catch (err) {
            console.error("Failed to assign students:", err);
            alert("Failed to assign students.");
        }
    };

    

    const getStatusBadge = (status) => {
        const statusConfig = {
            "assigned": { text: "Not Started", color: "bg-blue-100 text-blue-800" },
            "in_progress": { text: "In Progress", color: "bg-yellow-100 text-yellow-800" },
            "submitted": { text: "Completed", color: "bg-green-100 text-green-800" }
        };
        return statusConfig[status] || { text: "Unknown", color: "bg-gray-100 text-gray-800" };
    };

    const getPerformanceColor = (score) => {
        if (!score || !passingScore) return "bg-gray-200";
        if (score >= passingScore) return "bg-green-500";
        if (score >= passingScore * 0.7) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="w-11/12 lg:w-4/5 mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-xl overflow-hidden font-sans border border-[#EBECF1] ">
            
            <UserDropup />

            {/* Header - */}
            <div className="bg-[#102E50] p-8 text-white relative">
                <div className="absolute h-[2%] w-full bg-black/20 top-0 left-0"></div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
                            <MdAnalytics className="text-[#E78B48]" /> Exam Monitoring
                        </h1>
                        <p className="text-[#EBECF1] opacity-80 uppercase tracking-widest text-lg font-bold">
                            Current Assessment
                        </p>
                        <h2 className="text-xl font-semibold text-[#E78B48] mb-8">{examTitle}</h2>
                        
                        <div className="flex flex-col gap-2">
                            <p className="text-[#EBECF1] text-md">Total: <span className='text-[#E78B48]'>{totalPoints} points</span></p>
                            <p className="text-[#EBECF1] text-md">Duration: <span className='text-blue-300'>{duration} minutes</span></p>
                            <p className="text-[#EBECF1] text-md">Passing Score: <span className='text-green-400'>{passingScore || "N/A"} points</span></p>
                        </div>

                        {linkedMaterials.length > 0 && (
                            <div className="mt-4">
                                <p className="text-[#EBECF1] text-sm">Linked Materials:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {linkedMaterials.map((material, idx) => (
                                        <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
                                            {material}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mt-6 md:mt-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#E78B48] p-2 rounded-lg">
                                <MdPerson className="text-[#102E50] text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                                <p className="text-[10px] uppercase tracking-tighter text-[#EBECF1]">Assigned</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Students Button  */}
            <div className="flex justify-end p-6 md:p-8">
                <ClassicButton 
                    buttonName="Assign Students"
                    icon={PiStudent}
                    onClick={openAssignModal}
                    className="" 
                    mainColor="#5C6BC0" 
                    darkColor="#3949AB"
                />
            </div>

            {/* Table - */}
            <div className="p-6 md:p-8 bg-[#EBECF1]/30 relative">
                <div className="absolute h-[2%] w-full bg-[#D9CFC7]/40 bottom-0 left-0"></div>
                <div className="bg-white rounded-xl shadow-sm border border-[#EBECF1] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#102E50] text-white">
                                    <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest">Score</th>
                                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EBECF1]">
                                {data.length > 0 ? data.map((item, i) => {
                                    const statusBadge = getStatusBadge(item.status);
                                    const performanceColor = getPerformanceColor(item.score);
                                    const percentage = item.score ? Math.round((item.score / totalPoints) * 100) : 0;
                                    
                                    return (
                                        <tr key={i} className="hover:bg-[#EBECF1]/50 transition-colors">
                                            <td className="px-6 py-4 text-[#102E50] font-bold">
                                                {item.studentName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                                    {statusBadge.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.score !== null ? (
                                                    <span className="font-mono font-bold text-lg text-[#102E50]">
                                                        {item.score}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.score !== null ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-24 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                                            <div 
                                                                className={`h-full ${performanceColor}`} 
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">—</span>
                                                )}
                                            </td>
                                            
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-gray-400 italic">
                                            No students have been assigned to this exam yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className='flex justify-center mt-8'>
                    <ClassicButton 
                        buttonName="Return"
                        icon={PiKeyReturn}
                        onClick={() => navigate(-1)}
                        className="" 
                        mainColor="#5C6BC0" 
                        darkColor="#3949AB"
                    />
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <StudentSelectModal
                    students={students}
                    selectedStudents={selectedStudents}
                    disabledStudents={assignedStudents}
                    onToggle={toggleStudent}
                    onConfirm={confirmAssign}
                    onCancel={() => setShowAssignModal(false)}
                    title={`Assign Students to Exam: ${examTitle}`}
                />
            )}
        </div>
    );
}