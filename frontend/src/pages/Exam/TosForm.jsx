import React, { useState, useMemo } from "react";
import axios from "axios";
import AssignExam from '../../components/AssignQuiz';

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg min-w-[500px] max-w-3xl mx-auto">
      {loading && (
        <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-xl font-semibold animate-pulse"> Generating Quiz... Please Wait</div>
        </div>
      )}
      {!loading && questions.length === 0 &&(
        <>
      <h2 className="text-2xl font-bold text-[#102E50] mb-4">
        Table of Specifications
      </h2>

      {/*Total Items */}
      <div className="mb-4">

        <label className="block font-semibold text-[#102E50] mb-2">Term Period</label>
        <select
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded border border-[#102E50] bg-[#F4F6FF] text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] font-bold"
        >
          <option value="" disabled>Select Term Period</option>
          <option value="Prelim Exam">Prelim</option>
          <option value="Midterm Exam">Midterm</option>
          <option value="Final Exam">Final</option>
        </select>

        <label className="block font-semibold text-[#102E50] mb-2">Instruction </label>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          type="text"
          placeholder="Enter exam instruction"
          className="w-full p-2 rounded border border-[#102E50] bg-[#F4F6FF] text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] font-bold"
        />

        <label className="block font-semibold text-[#102E50] mb-2">Set Exam Duration </label>
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          type="number"
          placeholder="Set assessment timer"
          className="w-full p-2 rounded border border-[#102E50] bg-[#F4F6FF] text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] font-bold"
        />

        <label className="block font-semibold text-[#102E50] mb-2">
          Total Number of Items
        </label>
        <input
          type="number"
          min="1"
          value={totalItems}
          onChange={(e) => setTotalItems(e.target.value)}
          className="w-full p-2 rounded border border-[#102E50] bg-[#F4F6FF] text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] font-bold"
        />
      </div>

      {/*Lessons Hours*/}
      <div className="mb-4">
        <h3 className="font-semibold text-[#F5C45E] mb-3">Hours Per Lesson</h3>
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
                  className="border border-[#102E50] p-2 rounded w-[30%] bg-[#F4F6FF] text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50]"
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
          className="w-1/2 bg-[#F3C623] text-white p-3 rounded font-bold hover:bg-[#15426f] transition-colors"
        >
          Close
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGenerateDisabled}
          className={`w-1/2 p-3 rounded font-bold transition-colors ${
            isGenerateDisabled
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-[#102E50] text-white hover:bg-[#15426f]"
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
