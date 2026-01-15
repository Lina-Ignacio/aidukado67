// import axios from "axios";
// import {useState} from "react";
// import { useParams} from "react-router-dom";
// import AssignQuiz from '../../components/AssignQuiz';
// import ClassicButton from "../../components/classicButton";
// import { LuWand } from "react-icons/lu";

// export default function AIQuiz() {

//   const {materialId} = useParams();

//   const [questions, setQuestions] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [quizTitle, setQuizTitle] = useState("");
//   const [quizItems, setQuizItems] = useState();
//   const [quizType, setQuizType] = useState("");
//   const [instruction, setInstruction] = useState("");
//   {/*const [startTime, setStartTime] = useState(); */}
//   const [duration, setDuration] = useState();
//   const [lessonId, setLessonId] = useState();
//   const [type, setType] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/getLesson/${materialId}`);
//       setLessonId(res.data.id)

//       const formData = new FormData();
//       formData.append('lesson', res.data.extracted_content);
//       formData.append("items", quizItems);
//       formData.append("type", quizType);
      

//       const response = await axios.post(`${import.meta.env.VITE_API_URL}/getQuiz`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         }
//       });

//       console.log(response.data);
//       setQuestions(response.data.pretest);

//     } catch (error) {
//       console.error("Upload error:", error);
//     } finally {
//       setLoading(false);
//     }
    
//   };

//   const inputClass = `w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
//                         focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition 
//                         mb-4 duration-200`;
//   const labelClass = "text-[#102E50] font-bold mb-1 block";

//   return (
//     <div className="h-auto min-h-screen w-full flex bg-white px-8">
//       {loading && (
//         <div className="flex flex-col items-center gap-4 text-white">
//         <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
//         <div className="text-white text-xl font-semibold animate-pulse"> Generating Quiz... Please Wait</div>
//         </div>
//       )}

//       {!loading && questions.length === 0 &&(
//         <form 
//           className="max-w-md w-full h-auto m-auto p-6 bg-white rounded-2xl shadow-lg 
//               overflow-y-auto bg-[#EBECF1]"
//         >
//           <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-[#102E50] mb-1">AI-Quiz Generation</h1>
//           <p className="text-sm xl:text-md 2xl:text-lg text-[#102E50]/70 mb-6 italic">create quiz using AI</p>
          

//           <label className={labelClass}> Title: </label>
//           <input
//             value={quizTitle}
//             onChange={(e) => setQuizTitle(e.target.value)}
//             type="text"
//             placeholder="Enter Title"
//             className={inputClass}
//           />

//           <label className={labelClass}> Number of items: </label>
//           <input
//             value={quizItems}
//             onChange={(e) => setQuizItems(e.target.value)}
//             type="number"
//             placeholder="Enter Number of Items"
//             className={inputClass}
//           />

//           {/*<label className={labelClass}> Set start time: </label>
//           <input
//             value={startTime}
//             onChange={(e) => setStartTime(e.target.value)}
//             type="datetime-local"
//             className={inputClass}
//           /> */}

//           <label className={labelClass}> Set Assessment Duration: (minutes)</label>
//           <input
//             value={duration}
//             onChange={(e) => setDuration(e.target.value)}
//             type="number"
//             placeholder="Set assessment timer"
//             className={inputClass}
//           />

//           <label className={labelClass}> Instruction: </label>
//           <input
//             value={instruction}
//             onChange={(e) => setInstruction(e.target.value)}
//             type="text"
//             placeholder="Enter Instruction"
//             className={inputClass}
//           />

//           <label className={labelClass}>Choose Type:</label>
//           <select
//             value={type}
//             onChange={(e) => setType(e.target.value)}
//             className={inputClass}
//           >
//             <option value="" disabled>Choose Task Type</option>
//             <option value="Quiz">Quiz</option>
//             <option value="Seatwork">Seatwork</option>
//           </select>

//           <label className={labelClass}>Choose Assessment Type:</label>
//           <select
//             value={quizType}
//             onChange={(e) => setQuizType(e.target.value)}
//             className={inputClass}
//           >
//             <option value="" disabled>Select Assessment Type</option>
//             <option value="multiple_choice">Multiple Choice</option>
//             <option value="true_false">True or False</option>
//           </select>

//           <ClassicButton 
//               buttonName="Generate Exam"
//               className="shadow-md place-self-end w-full mt-5"
//               onClick={handleSubmit}
//               mainColor="#E78B48" 
//               darkColor="#B9652B"
//               icon={LuWand}
//           />
//         </form>
//       )}

//       {!loading && questions.length > 0 && (
//         <div>
//           {/*<AssignQuiz questions={questions} title={quizTitle} total_points={quizItems} lesson_id={lessonId} instructions={instruction} duration={duration} start_time={startTime} type={type} /> */}
//            <AssignQuiz questions={questions} title={quizTitle} total_points={quizItems} lesson_id={lessonId} instructions={instruction} duration={duration} type={type} />
//         </div>
//       )}
//     </div>
//   ) 
// }