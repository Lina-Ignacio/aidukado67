import { MdClose } from "react-icons/md";

export default function QuestionEditor({ 
  question, 
  index, 
  isEditing, 
  onUpdate, 
  optionLetters 
}) {
  const isTrueFalse = !question.options || question.options.length === 0;

  // Convert file to base64 - inline instead of import
  const convertToBase64 = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => callback(reader.result);
    reader.onerror = (error) => console.error("Base64 error:", error);
  };

  const handleQuestionChange = (value) => {
    onUpdate(index, { ...question, question: value });
  };

  const handleAnswerChange = (value) => {
    onUpdate(index, { ...question, answer: value });
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

  // FIXED: Added const declaration
  const removeQuestionImage = () => {
    onUpdate(index, { ...question, questionImage: null });
  };

  const removeOptionImage = (optIndex) => {
    handleOptionChange(optIndex, 'image', null);
  };

  return (
    <div className="mb-8 p-6 border border-gray-300 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#102E50] to-[#E78B48]"></div>
      
      {/* Question number badge */}
      <div className="absolute -top-3 -left-2 w-12 h-12 bg-[#102E50] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
        {index + 1}
      </div>

      {/* Question Text */}
      {isEditing ? (
        <div className="mt-2 mb-6">
          <label className="block text-sm font-semibold text-[#102E50] mb-2 ml-1">
            Question Text
          </label>
          <textarea
            value={question.question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="w-full text-lg px-4 py-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:border-[#E78B48] focus:ring-2 focus:ring-[#E78B48]/20 focus:outline-none transition-all duration-200 resize-y min-h-[60px]"
            placeholder="Enter your question here..."
            rows="2"
          />
          
          <div className="mt-4">
            <label className="block text-sm font-semibold text-[#102E50] mb-2 ml-1">
              Question Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors duration-200 border border-gray-300 hover:border-[#E78B48]/50 flex items-center gap-2">
                <span>📁 Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleQuestionImageUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {question.questionImage && (
                <div className="relative inline-block group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#E78B48] to-[#102E50] rounded-lg blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative">
                    <img
                      src={question.questionImage}
                      alt="Question"
                      className="max-w-xs rounded-lg border-2 border-gray-200 shadow-md"
                    />
                    <button
                      onClick={removeQuestionImage}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 w-8 h-8 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
                      title="Remove Image"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 mb-6">
          <p className="font-semibold text-xl text-gray-800 mb-4 leading-relaxed">
            {question.question}
          </p>
          {question.questionImage && (
            <div className="relative inline-block group">
              <img
                src={question.questionImage}
                alt="Question"
                className="max-w-sm rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}
        </div>
      )}

      {/* Options or True/False */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#102E50] mb-3 ml-1">
          {isTrueFalse ? 'Select Answer:' : 'Options:'}
        </h3>
        
        {!isTrueFalse ? (
          <ul className="space-y-3">
            {question.options.map((opt, i) => (
              <li key={i} className="group">
                <label className="flex items-start gap-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200">
                  <div className="flex items-center mt-1">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${question.answer === optionLetters[i] ? 'bg-[#102E50] text-white' : 'bg-gray-100 text-gray-700'} transition-colors duration-200`}>
                      {optionLetters[i]}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 border border-gray-300 focus:border-[#E78B48] focus:ring-2 focus:ring-[#E78B48]/20 focus:outline-none transition-all duration-200"
                        placeholder="Enter option text"
                      />
                      <div className="flex items-center gap-4">
                        <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors duration-200 border border-gray-300 hover:border-[#E78B48]/50 text-sm flex items-center gap-2">
                          <span>📷 Add Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOptionImageUpload(i, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                        {opt.image && (
                          <div className="relative inline-block">
                            <img
                              src={opt.image}
                              alt="Option"
                              className="max-w-[120px] rounded border border-gray-200 shadow-sm"
                            />
                            <button
                              onClick={() => removeOptionImage(i)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-7 h-7 flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200"
                              title="Remove Image"
                            >
                              <MdClose size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className={`text-gray-700 ${question.answer === optionLetters[i] ? 'font-medium' : ''}`}>
                        {opt.text && <span>{opt.text}</span>}
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt="Option"
                            className="max-w-[150px] mt-2 rounded border border-gray-200 shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={optionLetters[i]}
                    checked={question.answer === optionLetters[i]}
                    onChange={() => handleAnswerChange(optionLetters[i])}
                    className="sr-only"
                    disabled={!isEditing}
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex gap-6">
            {['True', 'False'].map((value) => (
              <label key={value} className="flex-1 group">
                <div className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${question.answer === value ? 'border-[#102E50] bg-[#102E50]/5' : 'border-gray-200 hover:border-[#E78B48]/50 hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${question.answer === value ? 'border-[#102E50] bg-[#102E50]' : 'border-gray-300'}`}>
                      {question.answer === value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className={`font-medium ${question.answer === value ? 'text-[#102E50]' : 'text-gray-700'}`}>
                      {value}
                    </span>
                  </div>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={value}
                    checked={question.answer === value}
                    onChange={() => handleAnswerChange(value)}
                    className="sr-only"
                    disabled={!isEditing}
                  />
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Correct Answer Indicator */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#102E50]/5 to-[#E78B48]/5 rounded-lg border border-gray-100">
          <div className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">Correct Answer</p>
            <p className="text-lg font-bold text-[#102E50]">
              {question.answer || "Not selected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}