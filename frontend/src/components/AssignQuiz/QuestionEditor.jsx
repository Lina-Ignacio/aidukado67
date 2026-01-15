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

  const removeQuestionImage = () => {
    onUpdate(index, { ...question, questionImage: null });
  };

  const removeOptionImage = (optIndex) => {
    handleOptionChange(optIndex, 'image', null);
  };

  return (
    <div className="mb-8 p-4 border border-gray-200 rounded-xl bg-[#183D65] relative">
      {/* Question Text */}
      {isEditing ? (
        <>
          <div className="absolute h-[2%] w-full bg-black/10 bottom-0 left-0 rounded-xl"></div>
          <input
            type="text"
            value={question.question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            className="w-full text-lg px-2 py-1 mb-3 rounded bg-gray-100 text-black font-semibold"
            placeholder="Enter question"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleQuestionImageUpload(e.target.files[0])}
            className="mb-2 text-white"
          />
          {question.questionImage && (
            <div className="relative inline-block">
              <img
                src={question.questionImage}
                alt="Question"
                className="max-w-xs rounded-lg mb-3 border"
              />
              <button
                onClick={removeQuestionImage}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-7 h-7 flex items-center justify-center"
                title="Remove Image"
              >
                <MdClose size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="absolute h-[3%] w-full bg-black/10 bottom-0 left-0 rounded-xl"></div>
          <p className="font-semibold text-lg mb-3">
            {index + 1}. {question.question}
          </p>
          {question.questionImage && (
            <img
              src={question.questionImage}
              alt="Question"
              className="max-w-xs rounded-lg mb-3 border"
            />
          )}
        </>
      )}

      {/* Options or True/False */}
      {!isTrueFalse ? (
        <ul className="space-y-2 text-white">
          {question.options.map((opt, i) => (
            <li key={i} className="flex items-start gap-3">
              <label className="flex flex-col sm:flex-row items-start sm:items-center gap-2 cursor-pointer w-full">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={optionLetters[i]}
                  checked={question.answer === optionLetters[i]}
                  onChange={() => handleAnswerChange(optionLetters[i])}
                  className="accent-[#424874]"
                  disabled={!isEditing}
                />

                {isEditing ? (
                  <div className="flex flex-col w-full">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                      className="text-black bg-gray-100 rounded px-1 py-0.5 mb-1"
                      placeholder="Option text"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOptionImageUpload(i, e.target.files[0])}
                      className="text-white"
                    />
                    {opt.image && (
                      <div className="relative inline-block">
                        <img
                          src={opt.image}
                          alt="Option"
                          className="max-w-[150px] mt-2 rounded border"
                        />
                        <button
                          onClick={() => removeOptionImage(i)}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-7 h-7 flex items-center justify-center"
                          title="Remove Image"
                        >
                          <MdClose size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {opt.text && <span>{optionLetters[i]}. {opt.text}</span>}
                    {opt.image && (
                      <img
                        src={opt.image}
                        alt="Option"
                        className="max-w-[150px] mt-2 rounded border"
                      />
                    )}
                  </div>
                )}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2 text-white">
          {['True', 'False'].map((value) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${index}`}
                value={value}
                checked={question.answer === value}
                onChange={() => handleAnswerChange(value)}
                className="accent-[#424874]"
                disabled={!isEditing}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
      )}

      {/* Correct Answer */}
      <p className="mt-4 pt-3 border-t border-gray-500">
        ✅ Correct Answer: <span className="font-semibold">{question.answer || "N/A"}</span>
      </p>
    </div>
  );
}