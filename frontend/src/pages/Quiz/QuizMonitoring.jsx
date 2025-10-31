import {useState, useEffect} from 'react';
import axios from 'axios';
import {useParams} from 'react-router-dom';

export default function QuizMonitoring(){

    const [quizTitle, setQuizTitle] = useState("");
    const [lessonTitle, setLessonTitle] = useState("");
    const [data, setData] = useState([]);
    const {quizId} = useParams()


    useEffect (() => {
        const fetchScores = async () => {
            const res = await axios.get(`http://localhost:8000/quizMonitoring/${quizId}`);
            setQuizTitle(res.data.quizTitle)
            setLessonTitle(res.data.lessonTitle)
            setData(res.data.scores);
        }
        fetchScores();
    }, [quizId])

    return(
        <div className="w-4/5 mx-auto mt-10 bg-white rounded-2xl shadow-md p-8 font-sans" >
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6" >Quiz Monitoring</h1>
            <div className="mb-6 text-gray-700 text-lg">
                <p>
                <span className="text-blue-600">{quizTitle}</span>
                </p>
                <p>
                <span className="text-blue-600">{lessonTitle}</span>
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-600 text-white">
                    <tr>
                    <th className="px-6 py-3 text-left font-semibold text-sm uppercase tracking-wider">
                        Student Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-sm uppercase tracking-wider">
                        Score
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.length > 0 ? (
                    data.map((item, i) => (
                        <tr
                        key={i}
                        className="hover:bg-blue-50 transition duration-200 ease-in-out"
                        >
                        <td className="px-6 py-3 text-gray-800">{item.studentName}</td>
                        <td className="px-6 py-3 text-gray-700 font-medium">{item.score}</td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan="2" className="text-center py-6 text-gray-500">
                        No students have taken this quiz yet.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
    )
} //Add for commit