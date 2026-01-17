import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAnalytics, MdPerson } from "react-icons/md";
import StudentSelectModal from '../../components/AssignQuiz/StudentSelectModal';
import useClassStore from '../../store/useClassStore';
import ClassicButton from '../../components/classicButton';
import { PiStudent, PiKeyReturn } from "react-icons/pi";

export default function QuizMonitoring() {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const classId = useClassStore((state) => state.classId);

    // Quiz info
    const [quizTitle, setQuizTitle] = useState("");
    const [lessonTitle, setLessonTitle] = useState("");
    const [totalPoints, setTotalPoints] = useState(0);
    const [data, setData] = useState([]);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);

    // Fetch quiz info & scores
    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizMonitoring/${quizId}`);
                setQuizTitle(res.data.quizTitle);
                setLessonTitle(res.data.lessonTitle);
                setTotalPoints(res.data.totalPoints);
                setData(res.data.scores);
            } catch (err) {
                console.error("Failed to fetch quiz data:", err);
            }
        };
        fetchQuizData();
    }, [quizId]);

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
            alert("Students assigned successfully!");
        } catch (err) {
            console.error("Failed to assign students:", err);
            alert("Failed to assign students.");
        }
    };

    return (
        <div className="w-11/12 lg:w-4/5 mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-xl overflow-hidden font-sans border border-[#EBECF1] ">
            
            {/* Header */}
            <div className="bg-[#102E50] p-8 text-white relative">
                <div className="absolute h-[2%] w-full bg-black/20 top-0 left-0"></div>
                <ClassicButton 
                    buttonName="Back to Class"
                    icon={PiKeyReturn}
                    onClick={() => navigate(-1)}
                    className="mb-4" 
                    mainColor="#5C6BC0" 
                    darkColor="#3949AB"
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
                            <MdAnalytics className="text-[#E78B48]" /> Quiz Monitoring
                        </h1>
                        <p className="text-[#EBECF1] opacity-80 uppercase tracking-widest text-lg font-bold">
                            Current Assessment
                        </p>
                        <h2 className="text-xl font-semibold text-[#E78B48] mb-8">{quizTitle}</h2>
                        <p className="text-[#EBECF1] text-md">Lesson: {lessonTitle}</p>
                        <p className="text-[#EBECF1] text-md">Total: <span className='text-gray-400'>{totalPoints} points</span></p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#E78B48] p-2 rounded-lg">
                                <MdPerson className="text-[#102E50] text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.length}</p>
                                <p className="text-[10px] uppercase tracking-tighter text-[#EBECF1]">Submissions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Students Button */}
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

            {/* Table */}
            <div className="p-6 md:p-8 bg-[#EBECF1]/30 relative">
                <div className="absolute h-[2%] w-full bg-[#D9CFC7]/40 bottom-0 left-0"></div>
                <div className="bg-white rounded-xl shadow-sm border border-[#EBECF1] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#102E50] text-white">
                                    <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-widest">Student Name</th>
                                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest">Performance Status</th>
                                    <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-widest">Final Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EBECF1]">
                                {data.length > 0 ? data.map((item, i) => (
                                    <tr key={i} className="hover:bg-[#EBECF1]/50 transition-colors">
                                        <td className="px-6 py-4 text-[#102E50] font-bold">{item.studentName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#E78B48]" 
                                                    style={{ width: `${(item.score / 100) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-block bg-[#102E50] text-white px-4 py-1 rounded-lg font-mono font-bold">
                                                {item.score}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-12 text-gray-400 italic">
                                            No students have answered this quiz yet.
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
                />
            )}
        </div>
    );
}
