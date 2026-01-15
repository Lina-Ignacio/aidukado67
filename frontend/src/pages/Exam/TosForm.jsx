import React, { useState, useMemo } from "react";
import axios from "axios";
import AssignQuiz from "../../components/AssignQuiz/AssignQuiz";

export default function TOSForm({ lessons, onClose, onSuccess }) {
  const [hours, setHours] = useState({});
  const [totalItems, setTotalItems] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [duration, setDuration] = useState("");

  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.type === "lesson"),
    [lessons]
  );

  const handleHoursChange = (lessonId, value) => {
    setHours((prev) => ({
      ...prev,
      [lessonId]: value,
    }));
  };

  const handleSubmit = async () => {

    setLoading(true);

    try {
      const payload = {
        total_items: Number(totalItems),
        lessons: filteredLessons.map((lesson) => ({
          lesson_id: lesson.id,
          title: lesson.title,
          hours: Number(hours[lesson.id] || 0),
        })),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/exam/compute_tos`,
        payload
      );
      console.log(response.data)
      setQuestions(response.data.tos)
      if (onSuccess) onSuccess(response.data);
      //onClose();
    } catch (err) {
      console.error("Error generating TOS:", err);
    } finally{
      setLoading(false)
    }
  };

  const isGenerateDisabled = filteredLessons.length === 0;
  const inputStyle = `w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
              focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200 mb-2`
  const labelClass = `block font-semibold text-[#102E50] mb-1`
  return (
    <div className="bg-white px-6 py-8 rounded-2xl shadow-lg w-full xl:w-[500px] h-auto">
      {loading && (
        <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-xl font-semibold animate-pulse"> Generating Quiz... Please Wait</div>
        </div>
      )}
      {!loading && questions.length === 0 &&(
        <>
      <h2 className="text-2xl font-bold text-[#102E50] mb-8 uppercase">
        Table of Specifications
      </h2>

      {/*Total Items */}
      <div className="mb-4 flex flex-col">

        {/* <label className={labelClass}>Term Period</label>
        <select
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputStyle}
        >
          <option value="" disabled>Select Term Period</option>
          <option value="Prelim Exam">Prelim</option>
          <option value="Midterm Exam">Midterm</option>
          <option value="Final Exam">Final</option>
        </select> */}

        <label className={labelClass}>Instruction </label>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          type="text"
          placeholder="Enter exam instruction"
          className={inputStyle}
        />

        <label className={labelClass}>Set Exam Duration (minutes) </label>
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          type="number"
          placeholder="Set assessment timer"
          className={inputStyle}
        />

        <label className={labelClass}>
          Total Number of Items
        </label>
        <input
          type="number"
          min="1"
          value={totalItems}
          onChange={(e) => setTotalItems(e.target.value)}
          className={inputStyle}
        />
      </div>

      {/*Lessons Hours*/}
      <div className="mb-4">
        <h3 className="font-semibold text-[#E78B48] mb-4 uppercase">Hours Per Lesson</h3>
        <div className="flex flex-col gap-3">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => (
              <div key={lesson.id} className="flex justify-between items-center">
                <p className="text-[#102E50] font-medium w-[60%]">{lesson.title}</p>
                <input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  value={hours[lesson.id] || ""}
                  onChange={(e) => handleHoursChange(lesson.id, e.target.value)}
                  className={inputStyle}
                />
              </div>
            ))
          ) : (
            <p className="text-gray-500">No lessons available for TOS.</p>
          )}
        </div>
      </div>

      <div className="w-full gap-2 flex">
        <button
          onClick={onClose}
          className="w-1/2 mt-3 bg-[#10375C] text-white transition-transform duration-200 
              hover:scale-95 shadow-md xl:text-lg p-2"
        >
          Close
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGenerateDisabled}
          className={`w-1/2 mt-3 transition-transform duration-200 
              hover:scale-95 shadow-md xl:text-lg p-2 ${
            isGenerateDisabled
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-[#E78B48]/90 text-white"
          }`}
        >
          Generate Exam
        </button>
      </div>
      </>
      )}

      {!loading && questions.length > 0 &&(
        <div>
          <AssignExam questions={questions} title={title} total_points={totalItems} lesson_id={0} instructions={instruction} duration={duration} type={"exam"} />
        </div>
      )}
    </div>
  );
}
