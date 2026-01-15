import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import classStore from '../../store/useClassStore';
import useTermStore from '../../store/useTermStore';
import QuestionEditor from './QuestionEditor';
import StudentSelectModal from './StudentSelectModal';
import { FiSave, FiEdit, FiUserPlus, FiPrinter } from "react-icons/fi";
import ClassicButton from "../classicButton";

export default function AssignQuiz({
  questions = [],
  title = "",
  total_points = 0,
  lesson_id,
  instructions = "",
  duration = 0,
  assessment_type = ""
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const class_id = classStore((state) => state.classId);
  const term_id = useTermStore((state) => state.termId);
  const navigate = useNavigate();

  const optionLetters = useMemo(() => "ABCD".split(""), []);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!class_id) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/getStudentsByClass/${class_id}`
        );
        setStudents(response.data || []);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [class_id]);

  // Add these helper functions at the top of your file or inside the component
  const stripQuestionPrefix = (text) => text.replace(/^\d+[\s.)-]+\s*/, "");
  const stripOptionPrefix = (text) => text.replace(/^[A-DA-d][\s.)-]+\s*/, "");

  // Update your useEffect inside AssignQuiz
  useEffect(() => {
    const normalized = (questions || []).map((q) => {
      let normalizedOptions = [];

      if (q.options && Array.isArray(q.options)) {
        normalizedOptions = q.options.map((opt) => {
          // If it's a string, strip the "A. " or "B. " prefix
          if (typeof opt === "string") {
            return { text: stripOptionPrefix(opt), image: null };
          }
          // If it's an object, strip the prefix from the text property
          return { ...opt, text: stripOptionPrefix(opt.text || "") };
        });
      }

      return {
        // Strip the "1. " or "2. " prefix from the question
        question: stripQuestionPrefix(q.question ?? ""),
        options: normalizedOptions,
        answer: q.answer ?? "",
        questionImage: q.questionImage ?? null,
      };
  });

  setEditableQuestions(normalized);
}, [questions]);

  // Handlers
  const handleQuestionUpdate = (index, updatedQuestion) => {
    const updated = [...editableQuestions];
    updated[index] = updatedQuestion;
    setEditableQuestions(updated);
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = async () => {
    // Validation
    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }
    if (!lesson_id) {
      alert("Lesson ID is missing");
      return;
    }
    if (editableQuestions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    try {
      const quizData = {
        lesson_id,
        title,
        total_points,
        instructions,
        quiz_content: editableQuestions,
        duration,
        class_id,
        is_archive: false,
        assessment_type,
        term_id  
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/assignQuiz`,
        quizData,
        { headers: { "Content-Type": "application/json" } }
      );

      alert(response.data.message || "Quiz assigned successfully!");
      navigate(-2);
      console.log("hello",quizData)
    } catch (error) {
      console.error("Assignment error:", error);
      alert(error.response?.data?.detail || "Error assigning quiz");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print.");
      return;
    }

    // Generate print HTML inline
    const questionsHTML = editableQuestions
      .map((q, idx) => {
        const isTrueFalse = !q.options || q.options.length === 0;
        
        return `
          <div class="question">
            <p><strong>${idx + 1}. ${q.question}</strong></p>
            ${q.questionImage ? `<img src="${q.questionImage}" alt="Question Image" />` : ""}
            
            ${isTrueFalse 
              ? '<p><em>True or False</em></p>' 
              : `<ul class="options">
                  ${q.options.map((opt, i) => `
                    <li>
                      ${optionLetters[i]}. ${opt.text || ""}
                      ${opt.image ? `<br><img src="${opt.image}" alt="Option Image" />` : ""}
                    </li>
                  `).join("")}
                </ul>`
            }
          </div>
        `;
      })
      .join("");

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              text-align: center;
              margin-bottom: 10px;
            }
            .meta-info {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .meta-info p {
              margin: 5px 0;
            }
            .question { 
              margin-bottom: 25px; 
              page-break-inside: avoid; 
            }
            .options { 
              margin-left: 20px; 
              list-style-type: none;
              padding-left: 0;
            }
            .options li { 
              margin-bottom: 8px;
              padding: 5px 0;
            }
            img { 
              max-width: 200px; 
              margin-top: 10px; 
              display: block;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 5px;
            }
            @media print {
              .question {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          
          <div class="meta-info">
            <p><strong>Instructions:</strong> ${instructions || 'N/A'}</p>
            <p><strong>Total Points:</strong> ${total_points}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          
          ${questionsHTML}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <>
      <div className="flex justify-center items-start min-h-screen overflow-y-auto mb-12 w-full h-auto">
        <div className="w-full text-white rounded-2xl p-6 sm:p-10 max-h-[90vh]">
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3 mb-6">
            <ClassicButton 
              buttonName={isEditing ? "Done Editing" : "Edit Questions"}
              icon={isEditing ? FiSave : FiEdit} 
              onClick={() => setIsEditing(!isEditing)}
              className="transition" 
              mainColor="#E78B48"
              darkColor="#B9652B"  
            />
            <ClassicButton 
              buttonName="Assign"
              icon={FiUserPlus} 
              onClick={() => setShowStudentSelect(true)}
              mainColor="#183D65" 
              darkColor="#102E50"
              className="transition" 
            />
    
            <ClassicButton 
              buttonName="Print"
              icon={FiPrinter} 
              onClick={handlePrint}
              mainColor="#64748B" 
              darkColor="#475569" 
              className="transition" 
            />
          </div>

          {/* Quiz Title */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 lg:mb-12 text-[#102E50]">
            {title || "Untitled Quiz"}
          </div>

          {/* Questions List */}
          {editableQuestions.length === 0 ? (
            <p className="text-center text-gray-300">No questions available.</p>
          ) : (
            editableQuestions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                isEditing={isEditing}
                onUpdate={handleQuestionUpdate}
                optionLetters={optionLetters}
              />
            ))
          )}
        </div>
      </div>

      {showStudentSelect && (
        <StudentSelectModal
          students={students}
          selectedStudents={selectedStudents}
          onToggle={toggleStudent}
          onConfirm={handleAssign}
          onCancel={() => {
            setShowStudentSelect(false);
            setSelectedStudents([]);
          }}
        />
      )}
    </>
  );
}