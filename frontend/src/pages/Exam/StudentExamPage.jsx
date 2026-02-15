import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { MdTimer, MdCheckCircle, MdError, MdWarning } from "react-icons/md";

export default function StudentExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const student_id = useUserStore((state) => state.userId);
  
  const [isHydrated, setIsHydrated] = useState(false);

  // States
  const [exam, setExam] = useState({ exam_content: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  
  const warningKey = `exam_warnings_${examId}_${student_id}`;
  const [warnings, setWarnings] = useState(() => 
    parseInt(sessionStorage.getItem(warningKey)) || 0
  );

  // Refs
  const fetchLock = useRef(false);
  const historyLocker = useRef(false); 
  const examRef = useRef(null);
  const answersRef = useRef({});
  const timerRef = useRef(null);
  const lastWarningTime = useRef(0); // For debouncing

  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Update refs when state changes
  useEffect(() => {
    answersRef.current = userAnswers;
  }, [userAnswers]);

  // Handle Hydration
  useEffect(() => {
    if (useUserStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitted || !examRef.current) return;

    const content = examRef.current.exam_content;
    console.log("🎯 SUBMITTING EXAM - Debug Info:");
    console.log("Exam content length:", content.length);
    console.log("User answers:", answersRef.current);
    
    let calculatedScore = 0;
    let totalPoints = 0;

    // Calculate score with points per question 
    content.forEach((q, idx) => {
      const correctAnswer = q.answer || q.correct_answer || "";
      const studentAnswer = answersRef.current[idx] || "";
      const points = q.points || 1;
      
      const correct = String(correctAnswer).trim().toUpperCase();
      const student = String(studentAnswer).trim().toUpperCase();
      
      totalPoints += points;
      if (student === correct) {
        calculatedScore += points;
      }
    });

    setScore(calculatedScore);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clean up session storage
    sessionStorage.removeItem(warningKey);
    sessionStorage.removeItem(`active_exam_${warningKey}`);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/exam/student/submit-exam`, {
        student_id: parseInt(student_id),
        exam_id: parseInt(examId),
        score: calculatedScore,
        answers: answersRef.current
      });
    } catch (err) {
      console.error("Exam submission failed:", err);
    }
  }, [examId, student_id, submitted, warningKey, navigate]);

  // Violation Watcher 
  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(warningKey, warnings);
    
    if (warnings >= 3 && !submitted && startTime) {
      alert("⚠️ Maximum violations reached (3/3). Submitting exam automatically.");
      handleSubmit();
    }
  }, [warnings, warningKey, submitted, handleSubmit, startTime, isHydrated]);

  // Initialization
  useEffect(() => {
    if (!isHydrated || !student_id) return;

    const loadExamData = async () => {
      if (fetchLock.current) return;
      fetchLock.current = true;

      try {
        console.log("📡 Fetching exam data from:", `${import.meta.env.VITE_API_URL}/exam/student/${examId}/${student_id}`);
        
        const { data: examData } = await axios.get(
          `${import.meta.env.VITE_API_URL}/exam/student/${examId}/${student_id}`
        );
        
        console.log("✅ Exam API response:", examData);
        
        const examInfo = examData.exam;
        const progress = examData.progress;
        
        setExam({
          ...examInfo,
          exam_content: examInfo.exam_content || []
        });
        examRef.current = examInfo;
        
        // SET DURATION
        const examDuration = examInfo.duration || 0;
        setDuration(examDuration);

        let calculatedStartTime = null;
        let initialTimeLeft = 0;

        // Function to start the exam
        const startExamProcess = async () => {
          try {
            const { data: startResponse } = await axios.post(
              `${import.meta.env.VITE_API_URL}/exams/start`,
              {
                exam_id: parseInt(examId),
                student_id: parseInt(student_id)
              }
            );
            
            if (startResponse.start_time) {
              calculatedStartTime = new Date(startResponse.start_time);
              setStartTime(calculatedStartTime);
              
              initialTimeLeft = examDuration * 60;
              setTimeLeft(initialTimeLeft);
            } else {
              // Fallback
              calculatedStartTime = new Date();
              setStartTime(calculatedStartTime);
              initialTimeLeft = examDuration * 60;
              setTimeLeft(initialTimeLeft);
            }
            
            // Set tracking for reload violations
            const isReload = window.performance.getEntriesByType("navigation")[0]?.type === "reload";
            const hasAlreadyLoaded = sessionStorage.getItem(`active_exam_${warningKey}`);
            
            if (isReload && hasAlreadyLoaded) {
              setWarnings(prev => prev + 1);
            }
            sessionStorage.setItem(`active_exam_${warningKey}`, "true");
            
          } catch (err) {
            console.error("❌ Failed to start exam:", err);
          }
        };

        if (progress) {
          if (progress.status === "submitted") {
            setUserAnswers(progress.answers || {});
            setScore(progress.score || 0);
            setSubmitted(true);
          } else if (progress.status === "in_progress") {
            setUserAnswers(progress.answers || {});
            if (progress.start_time) {
              calculatedStartTime = new Date(progress.start_time);
              setStartTime(calculatedStartTime);
              
              const elapsed = (new Date() - calculatedStartTime) / 1000;
              initialTimeLeft = Math.max((examDuration * 60) - elapsed, 0);
              setTimeLeft(initialTimeLeft);
              
              // Set tracking for reload violations
              const isReload = window.performance.getEntriesByType("navigation")[0]?.type === "reload";
              const hasAlreadyLoaded = sessionStorage.getItem(`active_exam_${warningKey}`);
              
              if (isReload && hasAlreadyLoaded) {
                setWarnings(prev => prev + 1);
              }
              sessionStorage.setItem(`active_exam_${warningKey}`, "true");
            } else {
              await startExamProcess();
            }
          } else {
            // Status is "assigned" - start the exam
            await startExamProcess();
          }
        } else {
          // No progress - start new exam
          await startExamProcess();
        }

      } catch (err) { 
        console.error("❌ Failed to load exam:", err);
        navigate("/student/dashboard");
      }
    };
    loadExamData();
  }, [examId, student_id, warningKey, isHydrated, navigate]);

  // Timer 
  useEffect(() => {
    if (!startTime || !duration || submitted) return;
    
    const timer = setInterval(() => {
      const elapsed = (new Date() - startTime) / 1000;
      const remaining = Math.max((duration * 60) - elapsed, 0);
      setTimeLeft(remaining);
      
      if (remaining <= 0) { 
        clearInterval(timer); 
        handleSubmit(); 
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, duration, submitted, handleSubmit]);

  // Format time function
  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  // SIMPLE Lockdown Effect 
  useEffect(() => {
    if (!isHydrated || submitted) { 
      window.onbeforeunload = null; 
      return; 
    }
    
    // Initial history push (ONLY ONCE) - CRITICAL!
    if (!historyLocker.current) {
      window.history.pushState(null, "", window.location.href);
      historyLocker.current = true;
    }

    // Simple back navigation prevention
    const preventBack = () => { 
      window.history.pushState(null, "", window.location.href); 
      
      // Simple debouncing
      const now = Date.now();
      if (now - lastWarningTime.current > 1000) {
        lastWarningTime.current = now;
        setWarnings(w => {
          const newWarnings = w + 1;
          alert(`⚠️ Back navigation disabled! Violation ${newWarnings}/3`);
          return newWarnings;
        });
      }
    };

    // Simple tab switch detection
    const detectTabSwitch = () => {
      if (document.hidden && startTime) {
        const now = Date.now();
        if (now - lastWarningTime.current > 1000) {
          lastWarningTime.current = now;
          setWarnings(w => {
            const newWarnings = w + 1;
            alert(`⚠️ Tab switch detected! Violation ${newWarnings}/3`);
            return newWarnings;
          });
        }
      }
    };

    // Simple page leave prevention
    const confirmExit = (e) => {
      if (!submitted) { 
        e.preventDefault(); 
        e.returnValue = "⚠️ Warning! Leaving this page will count as a violation."; 
      }
    };

    // Simple keyboard blocking
    const blockKeyboard = (e) => {
      // Block F5, F12, Ctrl+Shift+I/J/C
      if (e.key === 'F5' || e.keyCode === 116 || 
          e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
          (e.ctrlKey && ['c', 'v'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastWarningTime.current > 1000) {
          lastWarningTime.current = now;
          setWarnings(w => {
            const newWarnings = w + 1;
            alert(`⚠️ Keyboard shortcut disabled! Violation ${newWarnings}/3`);
            return newWarnings;
          });
        }
      }
    };

    // Add all event listeners
    window.addEventListener("popstate", preventBack);
    window.addEventListener("beforeunload", confirmExit);
    document.addEventListener("visibilitychange", detectTabSwitch);
    document.addEventListener("keydown", blockKeyboard);

    return () => {
      window.removeEventListener("popstate", preventBack);
      window.removeEventListener("beforeunload", confirmExit);
      document.removeEventListener("visibilitychange", detectTabSwitch);
      document.removeEventListener("keydown", blockKeyboard);
    };
  }, [submitted, startTime, isHydrated]);

  if (!isHydrated) return null;

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-[#102E50] select-none">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <header className="bg-gray-100 p-6 border-b-4 border-[#E78B48] flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#102E50] uppercase">{exam.title || "Exam"}</h1>
            <p className="text-sm text-[#102E50] font-bold uppercase">Instructions: {exam.instructions}</p>
            <p className="text-xs text-[#E78B48] font-bold mt-1 uppercase">
              Duration: {exam.duration} minutes • 
              Passing Score: {exam.passing_score || 0} • 
              Total Points: {exam.total_points || 0}
            </p>
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono text-2xl font-bold shadow-inner 
            ${timeLeft < 300 && !submitted ? 'bg-red-500 text-white animate-pulse' : 'bg-[#102E50] text-white'}`}>
            <MdTimer />
            {submitted ? "00:00" : formatTime(timeLeft)}
          </div>
        </header>

        {/* Warnings Banner */}
        {warnings > 0 && !submitted && (
          <div className="bg-red-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <MdWarning /> Violations: {warnings} / 3
          </div>
        )}

        {/* Main Content - Questions List */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-12 space-y-10 bg-[#F8FAFC]">
          {exam.exam_content.map((q, index) => {
            const studentSelection = userAnswers[index] || "";
            const correctAnswer = q.answer || q.correct_answer || "";
            const isCorrect = submitted && 
              String(studentSelection).toUpperCase() === String(correctAnswer).toUpperCase();
            const points = q.points || 1;

            return (
              <section key={index} className={`bg-white p-8 rounded-[2rem] border-2 transition-all 
                ${studentSelection ? 'border-[#E78B48]/30 shadow-md' : 'border-gray-100'}`}>
                
                <div className="flex gap-5 mb-8">
                  <span className="w-12 h-12 rounded-2xl bg-[#102E50] text-white flex items-center justify-center text-xl font-black shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-md lg:text-xl font-bold text-[#102E50] leading-snug pt-2">
                      {q.question}
                    </h3>
                    {points > 1 && (
                      <div className="mt-2 text-sm text-[#E78B48] font-bold">
                        {points} point(s)
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {q.options?.map((opt, i) => {
                    const labelText = opt.text || opt;
                    const valueToSave = optionLetters[i];
                    const isActive = studentSelection === valueToSave;

                    return (
                      <label key={i} className={`relative flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all
                        ${isActive ? 'border-[#E78B48] bg-orange-50 ring-4 ring-orange-100' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <input 
                          type="radio" 
                          className="hidden" 
                          checked={isActive} 
                          onChange={() => !submitted && setUserAnswers(prev => ({ ...prev, [index]: valueToSave }))} 
                          disabled={submitted}
                        />
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 text-xs font-black 
                          ${isActive ? 'bg-[#E78B48] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {optionLetters[i]}
                        </div>
                        <span className={`text-md lg:text-lg font-bold ${isActive ? 'text-[#E78B48]' : 'text-[#102E50]/80'}`}>
                          {labelText}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-base shadow-sm
                    ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? <MdCheckCircle className="text-2xl" /> : <MdError className="text-2xl" />}
                    <span>
                      {isCorrect 
                        ? `Correct! (+${points} point${points > 1 ? 's' : ''})` 
                        : `Incorrect. The correct answer is "${correctAnswer.toUpperCase()}"`}
                    </span>
                  </div>
                )}
              </section>
            );
          })}
        </main>

        {/* Footer */}
        <footer className="p-8 bg-white border-t-2 flex flex-col items-center shrink-0">
          {!submitted ? (
            <button 
              onClick={handleSubmit} 
              className="bg-[#E78B48] text-white font-black py-5 px-28 rounded-2xl shadow-xl hover:bg-[#d67a3a] uppercase tracking-widest"
            >
              Submit Exam
            </button>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-black text-[#102E50] mb-2">
                Score: {score} / {exam.total_points || exam.exam_content.length}
              </div>
              <div className={`text-xl font-bold mb-4 ${score >= (exam.passing_score || 0) ? 'text-green-600' : 'text-red-600'}`}>
                {score >= (exam.passing_score || 0) ? '✅ PASS' : '❌ FAIL'}
                {exam.passing_score && ` (Minimum: ${exam.passing_score} points)`}
              </div>
              <button 
                onClick={() => navigate(-2)} 
                className="bg-[#102E50] text-white py-4 px-16 rounded-2xl font-bold hover:bg-[#E78B48]"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}