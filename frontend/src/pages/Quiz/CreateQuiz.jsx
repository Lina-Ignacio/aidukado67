import axios from "axios";
import {useState} from "react";
import { useParams} from "react-router-dom";
import AssignQuiz from '../../components/AssignQuiz';


export default function AIQuiz() {

  const {materialId} = useParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizItems, setQuizItems] = useState();
  const [quizType, setQuizType] = useState("");
  const [instruction, setInstruction] = useState("");
  {/*const [startTime, setStartTime] = useState(); */}
  const [duration, setDuration] = useState();
  const [lessonId, setLessonId] = useState();
  const [type, setType] = useState("");

  const handleUpload = async () => {
    
    setLoading(true);

    try {
      const res = await axios.get(`http://localhost:8000/getLesson/${materialId}`);
      setLessonId(res.data.id)

      const formData = new FormData();
      formData.append('lesson', res.data.extracted_content);
      formData.append("items", quizItems);
      formData.append("type", quizType);
      

      const response = await axios.post("http://localhost:8000/getQuiz", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      console.log(response.data);
      setQuestions(response.data.pretest);

    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className="bg-[#424874] h-full w-[100%] flex flex-col items-center justify-center p-6 ">
      {loading && (
        <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-xl font-semibold animate-pulse"> Generating Quiz... Please Wait</div>
        </div>
      )}

      {!loading && questions.length === 0 &&(
        <>
        <div className="max-w-md w-full mt-10 p-6 bg-white rounded-2xl shadow-lg overflow-y-auto max-h-[80vh]">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">AI-Quiz Generation</h1>
          <p className="text-gray-500 italic mb-6"></p>

          <label> Title: </label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            type="text"
            placeholder="Enter Title"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <label> Number of items: </label>
          <input
            value={quizItems}
            onChange={(e) => setQuizItems(e.target.value)}
            type="number"
            placeholder="Enter Number of Items"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/*<label> Set start time: </label>
          <input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            type="datetime-local"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          /> */}

          <label> Set Assessment Duration:  </label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            type="number"
            placeholder="Set assessment timer"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <label> Instruction: </label>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            type="text"
            placeholder="Enter Instruction"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <label className="block mb-2 font-medium text-gray-700">Choose Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>Choose Task Type</option>
            <option value="Quiz">Quiz</option>
            <option value="Seatwork">Seatwork</option>
          </select>

          <label className="block mb-2 font-medium text-gray-700">Choose Assessment Type:</label>
          <select
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>Select Assessment Type</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True or False</option>
          </select>

          <button
            className="w-full py-3 bg-[#333446] text-white font-bold rounded-lg hover:bg-gray-700 transition"
            onClick={handleUpload}
          >
            Generate Quiz
          </button>
        </div>
        </>
      )}

      {!loading && questions.length > 0 && (
        <div>
          {/*<AssignQuiz questions={questions} title={quizTitle} total_points={quizItems} lesson_id={lessonId} instructions={instruction} duration={duration} start_time={startTime} type={type} /> */}
           <AssignQuiz questions={questions} title={quizTitle} total_points={quizItems} lesson_id={lessonId} instructions={instruction} duration={duration} type={type} />
        </div>
      )}
    </div>
  ) 
}