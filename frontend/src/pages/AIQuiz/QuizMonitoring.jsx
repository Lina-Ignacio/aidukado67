import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAnalytics, MdPerson } from "react-icons/md";

export default function QuizMonitoring() {
    const navigate = useNavigate();
    const [quizTitle, setQuizTitle] = useState("");
    const [lessonTitle, setLessonTitle] = useState("");
    const [data, setData] = useState([]);
    const { quizId } = useParams();

    useEffect(() => {
        const fetchScores = async () => {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizMonitoring/${quizId}`);
            setQuizTitle(res.data.quizTitle);
            setLessonTitle(res.data.lessonTitle);
            setData(res.data.scores);
        };
        fetchScores();
    }, [quizId]);

    return (
        <div className="w-11/12 lg:w-4/5 mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-xl overflow-hidden font-sans border border-[#EBECF1]">
            {/* Header Banner */}
            <div className="bg-[#102E50] p-8 text-white relative">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-[#1F4068] 
                        transition-colors mb-4 group bg-white"
                >
                    <MdArrowBack className="group-hover:-translate-x-1 transition-transform" /> 
                    <span className="text-sm font-medium">Back to Class</span>
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
                            <MdAnalytics className="text-[#E78B48]" /> Quiz Monitoring
                        </h1>
                        <p className="text-[#EBECF1] opacity-80 uppercase tracking-widest text-lg font-bold">
                            Current Assessment
                        </p>
                        <h2 className="text-xl font-semibold text-[#E78B48] mb-4">{quizTitle}</h2>
                        <p className="text-[#EBECF1] text-md">Lesson: {lessonTitle}</p>
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

            {/* Table Area */}
            <div className="p-6 md:p-8 bg-[#EBECF1]/30">
                <div className="bg-white rounded-xl shadow-sm border border-[#EBECF1] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#102E50] text-white">
                                    <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-widest">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest">
                                        Performance Status
                                    </th>
                                    <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-widest">
                                        Final Score
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EBECF1]">
                                {data.length > 0 ? (
                                    data.map((item, i) => (
                                        <tr key={i} className="hover:bg-[#EBECF1]/50 transition-colors">
                                            <td className="px-6 py-4 text-[#102E50] font-bold">
                                                {item.studentName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {/* Simple visual indicator for scores */}
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
                                    ))
                                ) : (
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

                {/* Footer Action */}
                <div className='flex justify-center mt-8'>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="bg-[#E78B48] text-white font-bold py-3 px-12 rounded-xl 
                                   shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 
                                   transition-all active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}