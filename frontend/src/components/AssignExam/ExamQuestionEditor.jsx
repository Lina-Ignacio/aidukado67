import { MdClose } from "react-icons/md";
import { FiImage, FiCheckCircle } from "react-icons/fi";

export default function ExamQuestionEditor({ 
  question, 
  index, 
  isEditing, 
  onUpdate, 
  optionLetters,
  showPoints = true
}) {
  const isTrueFalse = !question.options || question.options.length === 0;
  const points = question.points || 1;

  const convertToBase64 = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => callback(reader.result);
    reader.onerror = (error) => console.error("Base64 error:", error);
  };

  const handleQuestionChange = (e) => {
    onUpdate(index, { ...question, question: e.target.value });
  };

  const handleAnswerChange = (value) => {
    onUpdate(index, { ...question, answer: value });
  };

  const handlePointsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    onUpdate(index, { ...question, points: Math.max(1, value) });
  };

  const handleOptionChange = (optIndex, field, value) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = { ...newOptions[optIndex], [field]: value };
    onUpdate(index, { ...question, options: newOptions });
  };

  const handleQuestionImageUpload = (file) => {
    convertToBase64(file, (base64) => {
      onUpdate(index, { ...question, questionImage: base64 });
    });
  };

  const handleOptionImageUpload = (optIndex, file) => {
    convertToBase64(file, (base64) => {
      handleOptionChange(optIndex, 'image', base64);
    });
  };

  const removeQuestionImage = () => {
    onUpdate(index, { ...question, questionImage: null });
  };

  const removeOptionImage = (optIndex) => {
    handleOptionChange(optIndex, 'image', null);
  };

  return (
    <div className="mb-6 p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
      {/* Question Header with Number Badge */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-4 flex-1">
          <div className="relative">
            <div className="bg-gradient-to-br from-[#102E50] to-[#1a3f6e] text-white font-bold rounded-xl w-12 h-12 flex items-center justify-center shadow-md">
              {index + 1}
            </div>
            {!isEditing && question.answer && (
              <div className="absolute -top-1 -right-1 bg-[#E78B48] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                <FiCheckCircle size={10} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="relative">
                <textarea
                  value={question.question}
                  onChange={handleQuestionChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent bg-gray-50/50 text-lg leading-relaxed resize-y min-h-[60px]"
                  placeholder="Enter your question here..."
                  rows="2"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {question.question.length}/500
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-800 text-lg leading-relaxed">{question.question}</p>
                {question.cognitive_level && (
                  <div className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                    {question.cognitive_level}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {showPoints && (
          <div className="ml-4">
            {isEditing ? (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600 font-medium">Points:</span>
                <input
                  type="number"
                  min="1"
                  value={points}
                  onChange={handlePointsChange}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-center font-bold text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#E78B48] bg-white"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#E78B48] to-[#f59e0b] text-white font-bold px-4 py-2 rounded-xl shadow-sm">
                {points} pt{points !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Image Upload */}
      {isEditing && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiImage className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Question Image</span>
            </div>
            {question.questionImage && (
              <button
                onClick={removeQuestionImage}
                className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <MdClose size={12} />
                Remove
              </button>
            )}
          </div>
          
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleQuestionImageUpload(e.target.files[0])}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#E78B48] hover:bg-[#E78B48]/5 transition-all duration-200">
              <FiImage className="text-gray-400 text-2xl mx-auto mb-2" />
              <p className="text-gray-600 text-sm">
                {question.questionImage ? 'Replace image' : 'Upload question image'}
              </p>
              <p className="text-gray-400 text-xs mt-1">Click or drag & drop</p>
            </div>
          </label>
          
          {question.questionImage && (
            <div className="mt-4">
              <img
                src={question.questionImage}
                alt="Question"
                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      {!isEditing && question.questionImage && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <FiImage className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Question Image</span>
          </div>
          <img
            src={question.questionImage}
            alt="Question"
            className="max-w-full h-auto rounded-xl border border-gray-200 shadow-sm"
          />
        </div>
      )}

      {/* Options Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">
            {isTrueFalse ? "True/False Options" : "Multiple Choice Options"}
          </h3>
          {!isTrueFalse && !isEditing && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {question.options?.length} options
            </span>
          )}
        </div>

        {isTrueFalse ? (
          <div className="space-y-3">
            {['True', 'False'].map((value) => (
              <label 
                key={value} 
                className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                  question.answer === value 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  question.answer === value 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                }`}>
                  {question.answer === value && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <span className={`font-medium ${
                    question.answer === value ? 'text-green-700' : 'text-gray-800'
                  }`}>
                    {value}
                  </span>
                </div>
                
                {question.answer === value && (
                  <div className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                    Correct
                  </div>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {question.options.map((opt, i) => (
              <div 
                key={i} 
                className={`p-4 border rounded-xl transition-all duration-200 ${
                  question.answer === optionLetters[i] 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Option Letter Badge */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    question.answer === optionLetters[i]
                      ? 'bg-[#102E50] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {optionLetters[i]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E78B48] bg-white"
                          placeholder={`Enter option ${optionLetters[i]}...`}
                        />
                        
                        {/* Option Image Upload */}
                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleOptionImageUpload(i, e.target.files[0])}
                              className="hidden"
                            />
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
                              <FiImage size={14} />
                              {opt.image ? 'Replace Image' : 'Add Image'}
                            </div>
                          </label>
                          
                          {opt.image && (
                            <button
                              onClick={() => removeOptionImage(i)}
                              className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                              <MdClose size={12} />
                              Remove Image
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="font-medium text-gray-800 mt-1">{opt.text}</span>
                        {question.answer === optionLetters[i] && (
                          <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full ml-2">
                            <FiCheckCircle size={10} />
                            Correct
                          </div>
                        )}
                      </div>
                    )}

                    {/* Option Image Display */}
                    {opt.image && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={opt.image}
                          alt={`Option ${optionLetters[i]}`}
                          className="max-w-xs rounded-lg border border-gray-200 shadow-sm"
                        />
                        {isEditing && (
                          <button
                            onClick={() => removeOptionImage(i)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                            title="Remove Image"
                          >
                            <MdClose size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Radio Button */}
                  {isEditing && (
                    <div className="flex-shrink-0">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionLetters[i]}
                        checked={question.answer === optionLetters[i]}
                        onChange={() => handleAnswerChange(optionLetters[i])}
                        className="w-5 h-5 text-[#E78B48] focus:ring-[#E78B48]"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Answer Info */}
      <div className="pt-5 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Correct Answer:</span>
              <span className="font-bold text-[#102E50] text-lg">{question.answer}</span>
            </div>
            
            {!isEditing && question.cognitive_level && (
              <div className="hidden md:block text-gray-300">•</div>
            )}
            
            {!isEditing && question.cognitive_level && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Cognitive Level:</span>
                <span className="font-medium text-blue-700">{question.cognitive_level}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isEditing && (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {isTrueFalse ? 'True/False' : `${question.options?.length || 0} options`}
              </div>
            )}
            
            {!isEditing && (
              <div className="text-xs text-gray-500">
                {points} point{points !== 1 ? 's' : ''} • {isTrueFalse ? 'True/False' : `${question.options?.length || 0} options`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}