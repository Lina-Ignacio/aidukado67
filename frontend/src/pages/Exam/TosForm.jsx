import React, { useState, useMemo } from "react";
import axios from "axios";
import AssignExam from "../../components/AssignExam/AssignExam";
import { 
  FaClock, 
  FaListAlt, 
  FaBook, 
  FaGraduationCap, 
  FaTimes, 
  FaMagic,
  FaHourglassHalf,
  FaFileAlt
} from 'react-icons/fa';

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
      
    } catch (err) {
      console.error("Error generating TOS:", err);
    } finally{
      setLoading(false)
    }
  };

  const isGenerateDisabled = filteredLessons.length === 0;

  return (
    <div className="bg-gray-50 px-8 py-10 rounded-2xl shadow-xl border border-gray-200 w-full h-auto">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-6 text-[#102E50]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#E78B48] border-t-transparent rounded-full animate-spin"></div>
            <FaMagic className="absolute inset-0 m-auto text-[#102E50] text-xl" />
          </div>
          <div className="text-center">
            <div className="text-[#102E50] text-xl font-semibold animate-pulse">Generating Quiz...</div>
            <div className="text-gray-600 mt-2">Please wait while we create your assessment</div>
          </div>
        </div>
      )}
      
      {!loading && questions.length === 0 && (
        <>
          <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
            <FaFileAlt className="text-[#E78B48] text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-[#102E50] uppercase tracking-wide">
              Table of Specifications
            </h2>
          </div>

          {/* Exam Configuration */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="flex items-center text-lg font-bold text-[#102E50] mb-4">
              <FaGraduationCap className="mr-2 text-[#E78B48]" />Exam Configuration
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-[#102E50]">
                  <FaListAlt className="mr-2 text-sm" />Exam Instruction
                </label>
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  type="text"
                  placeholder="Enter exam instructions here..."
                  className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-[#102E50]">
                  <FaClock className="mr-2 text-sm" />Exam Duration (minutes)
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  type="number"
                  placeholder="Set assessment timer"
                  className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-[#102E50]">
                  <FaListAlt className="mr-2 text-sm" />Total Number of Items
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalItems}
                  onChange={(e) => setTotalItems(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Lessons Hours */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="flex items-center text-lg font-bold text-[#E78B48] mb-4 uppercase tracking-wide">
              <FaHourglassHalf className="mr-2" />Hours Per Lesson
            </h3>
            
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center w-[60%]">
                      <FaBook className="text-[#102E50] mr-3 text-sm" />
                      <p className="text-[#102E50] font-medium truncate">{lesson.title}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={hours[lesson.id] || ""}
                        onChange={(e) => handleHoursChange(lesson.id, e.target.value)}
                        className="w-28 border border-gray-300 bg-white text-[#102E50] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-center"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">hrs</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <FaBook className="mx-auto text-3xl text-gray-300 mb-2" />
                  <p>No lessons available for TOS.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white font-semibold text-[#102E50] rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-95 shadow-sm"
            >
              <FaTimes className="mr-1" />Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isGenerateDisabled}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-lg border transition-all duration-200 active:scale-95 shadow ${
                isGenerateDisabled
                  ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                  : "bg-[#102E50] text-white border-[#102E50] hover:bg-[#0e2642] hover:shadow-md"
              }`}
            >
              <FaMagic className="mr-1" />Generate Exam
            </button>
          </div>
        </>
      )}

      {!loading && questions.length > 0 && (
        <div className="animate-fadeIn">
          <AssignExam
            questions={questions} 
            title={title} 
            total_points={totalItems} 
            lesson_id={0} 
            instructions={instruction} 
            duration={duration} 
            type={"exam"} 
          />
        </div>
      )}
    </div>
  );
}
