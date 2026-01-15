import ClassicButton from "../classicButton";
import { LuWand } from "react-icons/lu";

export default function QuizForm({ formData, onChange, onSubmit, loading }) {
  const inputClass = `w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                        focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition 
                        mb-4 duration-200`;
  const labelClass = "text-[#102E50] font-bold mb-1 block";

  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <form 
      className="max-w-md w-full h-auto m-auto p-6 bg-white rounded-2xl shadow-lg overflow-y-auto bg-[#EBECF1]"
    >
      <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-[#102E50] mb-1">
        AI-Quiz Generation
      </h1>
      <p className="text-sm xl:text-md 2xl:text-lg text-[#102E50]/70 mb-6 italic">
        create quiz using AI
      </p>

      {formData.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {formData.error}
        </div>
      )}

      <label className={labelClass}>
        Title: <span className="text-red-500">*</span>
      </label>
      <input
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        type="text"
        placeholder="Enter Title"
        className={inputClass}
        required
      />

      <label className={labelClass}>
        Number of items: <span className="text-red-500">*</span>
      </label>
      <input
        value={formData.items}
        onChange={(e) => handleChange('items', e.target.value)}
        type="number"
        min="1"
        max="50"
        placeholder="Enter Number of Items"
        className={inputClass}
        required
      />

      <label className={labelClass}>
        Set Assessment Duration (minutes): <span className="text-red-500">*</span>
      </label>
      <input
        value={formData.duration}
        onChange={(e) => handleChange('duration', e.target.value)}
        type="number"
        min="1"
        placeholder="Set assessment timer"
        className={inputClass}
        required
      />

      <label className={labelClass}>Instruction:</label>
      <textarea
        value={formData.instruction}
        onChange={(e) => handleChange('instruction', e.target.value)}
        placeholder="Enter Instruction (optional)"
        className={`${inputClass} min-h-[80px] resize-y`}
        rows="3"
      />

      <label className={labelClass}>
        Choose Assessment Type: <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.assessment_type}
        onChange={(e) => handleChange('assessment_type', e.target.value)}
        className={inputClass}
        required
      >
        <option value="">Choose Type</option>
        <option value="Quiz">Quiz</option>
        <option value="Seatwork">Seatwork</option>
      </select>

      <label className={labelClass}>
        Choose Question Type: <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.question_type}
        onChange={(e) => handleChange('question_type', e.target.value)}
        className={inputClass}
        required
      >
        <option value="">Select Type</option>
        <option value="multiple_choice">Multiple Choice</option>
        <option value="true_false">True or False</option>
      </select>

      <ClassicButton 
        buttonName="Generate Assessment"
        className="shadow-md place-self-end w-full mt-5"
        onClick={onSubmit}
        mainColor="#E78B48" 
        darkColor="#B9652B"
        icon={LuWand}
        disabled={loading}
      />
    </form>
  );
}