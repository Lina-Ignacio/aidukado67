import React, { useState, useEffect } from "react";
import axios from "axios";
import classStore from '../store/useClassStore';
import { useNavigate} from "react-router-dom";
import { MdClose } from "react-icons/md";
import useTermStore from '../store/useTermStore';

{/*export default function Questions({questions = [], title = "", total_points = 0, lesson_id, instructions = "", duration = 0, start_time = null, type=""}) { */}
export default function Questions({questions = [], title = "", total_points = 0, lesson_id, instructions = "", duration = 0, type=""}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableQuestion, setEditableQuestion] = useState([]);
  const class_id = classStore((state) => state.classId);
  const navigate = useNavigate();
  const term_id = useTermStore((state) => state.termId);
  console.log("term_id", term_id);

  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  const optionLetters = "ABCD".split("");

  useEffect(() => {
    const fetchStudents = async () => {
      try{
        const getStudents = await axios.get(`http://localhost:8000/getStudentsByClass/${class_id}`);
        setStudents(getStudents.data || []);
        console.log("Students", getStudents.data )
      } catch(error){
        console.log("Error Fetching Students: ", error)
      }
    }
    fetchStudents();
  }, [class_id])

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Convert file to base64 safely 
  const convertToBase64 = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => callback(reader.result);
    reader.onerror = (error) => console.error("Base64 error:", error);
  };

  // Normalize questions to avoid undefined values
  useEffect(() => {
    const normalized = (questions || []).map((q) => ({
      question: q.question ?? "",
      options: (q.options || []).map((opt) =>
        typeof opt === "string" ? { text: opt, image: null } : opt
      ),
      answer: q.answer ?? "",
      questionImage: q.questionImage ?? null,
    }));
    setEditableQuestion(normalized);
  }, [questions]);

  // Handlers
  const handleQuestionChange = (index, value) => {
    const updated = [...editableQuestion];
    updated[index].question = value ?? "";
    setEditableQuestion(updated);
  };

  const handleRemoveQuestionImage = (index) => {
    const updated = [...editableQuestion];
    updated[index].questionImage = null;
    setEditableQuestion(updated);
  };

  const handleOptionTextChange = (qIndex, oIndex, value) => {
    const updated = [...editableQuestion];
    updated[qIndex].options[oIndex].text = value ?? "";
    setEditableQuestion(updated);
  };
  
  const handleRemoveOptionImage = (qIndex, oIndex) => {
    const updated = [...editableQuestion];

    if (
      !updated[qIndex] ||
      !updated[qIndex].options ||
      !updated[qIndex].options[oIndex]
    ) {
      console.warn("Option not found:", qIndex, oIndex);
      return; 
    }

    updated[qIndex].options[oIndex].image = null;
    setEditableQuestion(updated);
  };

  const handleQuestionImageUpload = (index, file) => {
    convertToBase64(file, (base64) => {
      const updated = [...editableQuestion];
      updated[index].questionImage = base64;
      setEditableQuestion(updated);
    });
  };

  const handleOptionImageUpload = (qIndex, oIndex, file) => {
    convertToBase64(file, (base64) => {
      const updated = [...editableQuestion];
      updated[qIndex].options[oIndex].image = base64;
      setEditableQuestion(updated);
    });
  };
  console.log(class_id)
  const handleAssign = async () => {
    try {
      const quizData = {
        lesson_id,
        title,
        total_points,
        instructions,
        quiz_content: editableQuestion,
        //start_time,
        duration,
        class_id,
        archived: false,
        type,
        term_id
      };

      console.log("📦 Sending quiz data:", quizData);

      const saveQuiz = await axios.post("http://localhost:8000/assignQuiz", quizData,{
         headers: { 
            "Content-Type": "application/json" 
        }}
      );

      alert(saveQuiz.data.message || "Quiz assigned successfully!");
      navigate(-2)
    
    } catch (error) {
      console.error("❌ Saving Error:", error);
      alert("Error assigning quiz. Check console for details.");
    }
  };

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print.");
      return;
    }

    const printableHTML = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .question { margin-bottom: 25px; }
            .options { margin-left: 20px; }
            .options li { margin-bottom: 5px; }
            img { max-width: 200px; margin-top: 10px; display: block; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Instructions:</strong> ${instructions}</p>

          ${editableQuestion
            .map(
              (q) => `
              <div class="question">
                <p> ${q.question}</p>
                ${q.questionImage ? `<img src="${q.questionImage}" />` : ""}

                <ul class="options">
                  ${q.options
                    .map(
                      (opt, i) =>
                        `<li>${opt.text || ""} 
                          ${opt.image ? `<img src="${opt.image}" />` : ""}
                        </li>`
                    )
                    .join("")}
                </ul>
              </div>
            `
            )
            .join("")}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printableHTML);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };



  return (
    <>
    <div className="flex justify-center items-start min-h-screen overflow-y-auto mb-12">
      <div className="w-full text-white rounded-2xl p-6 sm:p-10 max-h-[90vh]">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={toggleEdit}
            className="text-[#333446] bg-white px-4 py-2 rounded-md hover:bg-gray-200"
          >
            {isEditing ? "Save" : "Edit"}
          </button>
          <button
            onClick={() => setShowStudentSelect(true)}
            className="text-[#333446] bg-white px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Assign
          </button>

          <button
            onClick={handlePrint}
            className="text-[#333446] bg-white px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Print
          </button>
        </div>

        {/* Quiz Title */}
        <div className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">
          {title || "Untitled Quiz"}
        </div>

        {/* Questions List */}
        {editableQuestion.length === 0 ? (
          <p className="text-center text-gray-300">No questions available.</p>
        ) : (
          editableQuestion.map((q, index) => (
            <div
              key={index}
              className="mb-8 p-4 border border-gray-200 rounded-xl bg-[#424874]"
            >
              {/* Question Text + Image */}
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                    className="w-full text-lg px-2 py-1 mb-3 rounded bg-gray-100 text-black font-semibold"
                    placeholder="Enter question"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleQuestionImageUpload(index, e.target.files[0])
                    }
                    className="mb-2"
                  />
                  {q.questionImage && (
                    <div>
                      <img
                        src={q.questionImage}
                        alt="Question"
                        className="max-w-xs rounded-lg mb-3 border"
                      />
                      {isEditing &&(
                        <button
                          onClick={() => handleRemoveQuestionImage(index)}
                          className="mt-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center w-7 h-7"
                          title="Remove Image"
                        >
                          <MdClose size={16} />
                        </button>
                      )}
                    </div>
                    
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-lg mb-3">{q.question}</p>
                  {q.questionImage && (
                    <img
                      src={q.questionImage}
                      alt="Question"
                      className="max-w-xs rounded-lg mb-3 border"
                    />
                  )}
                </>
              )}

              {/* Options */}
              <ul className="space-y-2 text-white">
                {q.options.map((opt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <label className="flex flex-col sm:flex-row items-start sm:items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionLetters[i]}
                        checked={q.answer === optionLetters[i]}
                        onChange={() => {
                          if (isEditing) {
                            const updated = [...editableQuestion];
                            updated[index].answer = optionLetters[i];
                            setEditableQuestion(updated);
                          }
                        }}
                        className="accent-[#424874]"
                        disabled={!isEditing}
                      />

                      {isEditing ? (
                        <div className="flex flex-col w-full">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleOptionTextChange(index, i, e.target.value)
                            }
                            className="text-black bg-gray-100 rounded px-1 py-0.5 mb-1"
                            placeholder="Option text"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleOptionImageUpload(index, i, e.target.files[0])
                            }
                          />
                          {opt.image && (
                            <div>
                              <img
                                src={opt.image}
                                alt="Option"
                                className="max-w-[150px] mt-2 rounded border"
                              />
                              {isEditing && (
                                <button
                                  onClick={handleRemoveOptionImage(index, i)}
                                  className="mt-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center w-7 h-7"
                                  title="Remove Image"
                                >
                                  <MdClose size={16} />
                                </button>
                              )}
                            </div>
                            
                          )}
                        </div>
                      ) : (
                        <div>
                          {opt.text && <span>{opt.text}</span>}
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

              {/* Correct Answer */}
              <p className="mt-2">
                ✅ Correct Answer:{" "}
                <span className="font-semibold">{q.answer || "N/A"}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>

    {showStudentSelect && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white text-black rounded-xl p-6 w-96">
          <h2 className="text-xl font-bold mb-4">Assign to Students</h2>

          <div className="max-h-60 overflow-y-auto">
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(s.id)}
                  onChange={() => toggleStudent(s.id)}
                />
                {s.last_name}, {s.first_name}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowStudentSelect(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleAssign}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Confirm Assign
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
} 
