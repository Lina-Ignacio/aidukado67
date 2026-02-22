
import ClassicButton from "../classicButton";
import { LuWand } from "react-icons/lu";

export default function ExamForm({ formData, onChange, onSubmit, loading }) {
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
        AI-Exam Generation
      </h1>
      <p className="text-sm xl:text-md 2xl:text-lg text-[#102E50]/70 mb-6 italic">
        Create comprehensive exams using AI
      </p>

      {formData.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {formData.error}
        </div>
      )}

      {/* Exam Title */}
      <label className={labelClass}>
        Exam Title: <span className="text-red-500">*</span>
      </label>
      <input
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        type="text"
        placeholder="e.g., Midterm Exam, Final Exam"
        className={inputClass}
        required
      />

      {/* Number of Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>
            Number of Questions: <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.total_items}
            onChange={(e) => handleChange('total_items', e.target.value)}
            type="number"
            min="5"
            max="100"
            placeholder="e.g., 50"
            className={inputClass}
            required
          />
          <p className="text-xs text-gray-500 -mt-2">Recommended: 20-100 questions</p>
        </div>

        {/* Duration */}
        <div>
          <label className={labelClass}>
            Duration (minutes): <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            type="number"
            min="15"
            placeholder="e.g., 120"
            className={inputClass}
            required
          />
          <p className="text-xs text-gray-500 -mt-2">Exam duration in minutes</p>
        </div>
      </div>

      {/* Exam Type */}
      <label className={labelClass}>
        Exam Type: <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.exam_type}
        onChange={(e) => handleChange('exam_type', e.target.value)}
        className={inputClass}
        required
      >
        <option value="">Select Exam Type</option>
        <option value="Prelim">Preliminary Exam</option>
        <option value="Midterm">Midterm Exam</option>
        <option value="Final">Final Exam</option>
        <option value="Quiz">Major Quiz</option>
        <option value="Comprehensive">Comprehensive Exam</option>
      </select>

      {/* Question Distribution */}
      <label className={labelClass}>
        Question Distribution:
      </label>
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={formData.mc_percentage || 70}
            onChange={(e) => handleChange('mc_percentage', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium text-[#102E50] min-w-[60px]">
            {formData.mc_percentage || 70}% MC
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>More True/False</span>
          <span>Balanced</span>
          <span>More Multiple Choice</span>
        </div>
        <p className="text-xs text-gray-500">
          {formData.mc_percentage || 70}% Multiple Choice, {100 - (formData.mc_percentage || 70)}% True/False
        </p>
      </div>

      {/* Difficulty Level */}
      <label className={labelClass}>
        Difficulty Level: <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.difficulty}
        onChange={(e) => handleChange('difficulty', e.target.value)}
        className={inputClass}
        required
      >
        <option value="">Select Difficulty</option>
        <option value="Easy">Easy (Recall & Understanding)</option>
        <option value="Medium">Medium (Application & Analysis)</option>
        <option value="Hard">Hard (Evaluation & Creation)</option>
        <option value="Mixed">Mixed (All levels)</option>
      </select>

      {/* Instructions */}
      <label className={labelClass}>Exam Instructions:</label>
      <textarea
        value={formData.instructions}
        onChange={(e) => handleChange('instructions', e.target.value)}
        placeholder="Enter exam instructions for students (optional)"
        className={`${inputClass} min-h-[100px] resize-y`}
        rows="4"
      />

      {/* Additional Settings */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-bold text-[#102E50] mb-3">Additional Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="shuffleQuestions"
              checked={formData.shuffle_questions || false}
              onChange={(e) => handleChange('shuffle_questions', e.target.checked)}
              className="h-4 w-4 text-[#102E50] rounded"
            />
            <label htmlFor="shuffleQuestions" className="ml-2 text-sm text-gray-700">
              Shuffle Questions for Each Student
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPoints"
              checked={formData.show_points || true}
              onChange={(e) => handleChange('show_points', e.target.checked)}
              className="h-4 w-4 text-[#102E50] rounded"
            />
            <label htmlFor="showPoints" className="ml-2 text-sm text-gray-700">
              Show Points per Question
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="randomizeOptions"
              checked={formData.randomize_options || false}
              onChange={(e) => handleChange('randomize_options', e.target.checked)}
              className="h-4 w-4 text-[#102E50] rounded"
            />
            <label htmlFor="randomizeOptions" className="ml-2 text-sm text-gray-700">
              Randomize Answer Options
            </label>
          </div>
        </div>
      </div>

      {/* Passing Score (Optional) */}
      <label className={labelClass}>
        Passing Score (Optional):
      </label>
      <div className="relative">
        <input
          value={formData.passing_score || ''}
          onChange={(e) => handleChange('passing_score', e.target.value)}
          type="number"
          min="0"
          placeholder="e.g., 70"
          className={`${inputClass} pr-12`}
        />
        <span className="absolute right-4 top-3 text-gray-500">%</span>
      </div>
      <p className="text-xs text-gray-500 -mt-2 mb-4">
        Minimum percentage required to pass. Leave empty for no passing requirement.
      </p>

      <ClassicButton 
        buttonName={loading ? "Generating Exam..." : "Generate Exam with AI"}
        className="shadow-md place-self-end w-full mt-5"
        onClick={onSubmit}
        mainColor="#183D65" 
        darkColor="#102E50"
        icon={LuWand}
        disabled={loading}
      />
    </form>
  );
}