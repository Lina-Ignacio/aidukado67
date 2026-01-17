import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import { MdTimer, MdCheckCircle, MdError, MdWarning } from "react-icons/md";

export default function StudentTest() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const student_id = useUserStore((state) => state.userId);
  
  
  const [isHydrated, setIsHydrated] = useState(false);

  // States
  const [quiz, setQuiz] = useState({ quiz_content: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  
  const warningKey = `warnings_${quizId}_${student_id}`;
  const [warnings, setWarnings] = useState(() => 
    parseInt(sessionStorage.getItem(warningKey)) || 0
  );

  
  const fetchLock = useRef(false);
  const historyLocker = useRef(false);
  const quizRef = useRef(null);
  const answersRef = useRef({});

  const optionLetters = "ABCD".split("");

  
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
    if (submitted || !quizRef.current) return;

    const content = quizRef.current.quiz_content;
    let calculatedScore = 0;

    content.forEach((q, idx) => {
      const correct = String(q.answer || "").trim().toLowerCase();
      const student = String(answersRef.current[idx] || "").trim().toLowerCase();
      if (student === correct) calculatedScore++;
    });

    
    setScore(calculatedScore);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    sessionStorage.removeItem(warningKey);
    sessionStorage.removeItem(`active_${warningKey}`);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/saveScore`, {
        student_id: parseInt(student_id),
        quiz_id: parseInt(quizId),
        status: "done",
        score: calculatedScore,
        answers: answersRef.current,
      });
    } catch (err) {
      console.error("Server save failed, but local state updated:", err);
    }
  }, [quizId, student_id, submitted, warningKey]);

  // Violation Watcher
  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(warningKey, warnings);
    if (warnings >= 2 && !submitted && startTime) {
      alert("Violation limit reached. Submitting.");
      handleSubmit();
    }
  }, [warnings, warningKey, submitted, handleSubmit, startTime, isHydrated]);

  // Initialization
  useEffect(() => {
    if (!isHydrated || !student_id) return;

    const loadQuizData = async () => {
      if (fetchLock.current) return;
      fetchLock.current = true;

      try {
        const { data: quizData } = await axios.get(`${import.meta.env.VITE_API_URL}/getQuiz/${quizId}`);
        setQuiz(quizData);
        quizRef.current = quizData;
        setDuration(quizData.duration);

        const { data: progress } = await axios.post(`${import.meta.env.VITE_API_URL}/saveStartTime`, {
          quiz_id: parseInt(quizId),
          student_id: parseInt(student_id)
        });

        if (progress.status === "done") {
          setUserAnswers(progress.answers || {});
          setScore(progress.score || 0);
          setSubmitted(true);
        } else {
          setStartTime(new Date(progress.start_time));
          
          const isReload = window.performance.getEntriesByType("navigation")[0]?.type === "reload";
          const hasAlreadyLoaded = sessionStorage.getItem(`active_${warningKey}`);
          
          if (isReload && hasAlreadyLoaded) {
            setWarnings(prev => prev + 1);
          }
          sessionStorage.setItem(`active_${warningKey}`, "true");
        }
      } catch (err) { console.error(err); }
    };
    loadQuizData();
  }, [quizId, student_id, warningKey, isHydrated]);

  // Timer
  useEffect(() => {
    if (!startTime || !duration || submitted) return;
    const timer = setInterval(() => {
      const elapsed = (new Date() - startTime) / 1000;
      const remaining = Math.max((duration * 60) - elapsed, 0);
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(timer); handleSubmit(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, duration, submitted, handleSubmit]);

  // Lockdown
  useEffect(() => {
    if (!isHydrated || submitted) { window.onbeforeunload = null; return; }
    
    if (!historyLocker.current) {
      window.history.pushState(null, "", window.location.href);
      historyLocker.current = true;
    }

    const preventBack = () => { window.history.pushState(null, "", window.location.href); };
    const detectCheating = () => {
      if (document.hidden && startTime) {
        setWarnings(w => w + 1);
        alert("⚠️ Tab switch detected!");
      }
    };
    const confirmExit = (e) => {
      if (!submitted) { e.preventDefault(); return (e.returnValue = "Warning!"); }
    };

    window.addEventListener("popstate", preventBack);
    window.addEventListener("beforeunload", confirmExit);
    document.addEventListener("visibilitychange", detectCheating);

    return () => {
      window.removeEventListener("popstate", preventBack);
      window.removeEventListener("beforeunload", confirmExit);
      document.removeEventListener("visibilitychange", detectCheating);
    };
  }, [submitted, startTime, isHydrated]);

  if (!isHydrated) return null; // Wait for store to load

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-[#102E50] select-none">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        <header className="bg-gray-100 p-6 border-b-4 border-[#E78B48] flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#102E50] uppercase">{quiz.title || "Assessment"}</h1>
            <p className="text-sm text-[#102E50] font-bold uppercase">Instruction: {quiz.instructions}</p>
            <p className="text-xs text-[#E78B48] font-bold mt-1 uppercase">Duration: {quiz.duration} minutes</p>
            
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono text-2xl font-bold shadow-inner 
            ${timeLeft < 60 && !submitted ? 'bg-red-500 text-white animate-pulse' : 'bg-[#102E50] text-white'}`}>
            <MdTimer />
            {submitted ? "00:00" : `${Math.floor(timeLeft / 60)}:${String(Math.floor(timeLeft % 60)).padStart(2, "0")}`}
          </div>
        </header>

        {warnings > 0 && !submitted && (
          <div className="bg-red-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest">
            <MdWarning /> Violation: {warnings} / 2
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-12 space-y-10 bg-[#F8FAFC]">
          {quiz.quiz_content.map((q, index) => {
            const studentSelection = userAnswers[index] || "";
            const isCorrect = submitted && String(studentSelection).toLowerCase() === String(q.answer).toLowerCase();
            const isTF = !q.options || q.options.length === 0;
            const currentOptions = isTF ? [{ text: "True" }, { text: "False" }] : q.options;

            return (
              <section key={index} className={`bg-white p-8 rounded-[2rem] border-2 transition-all 
                ${studentSelection ? 'border-[#E78B48]/30 shadow-md' : 'border-gray-100'}`}>
                
                <div className="flex gap-5 mb-8">
                  <span className="w-12 h-12 rounded-2xl bg-[#102E50] text-white flex items-center justify-center text-xl font-black shrink-0">{index + 1}</span>
                  <h3 className="text-xl font-bold text-[#102E50] leading-snug pt-2">{q.question}</h3>
                </div>

                <div className={`grid gap-4 ${isTF ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {currentOptions.map((opt, i) => {
                    const labelText = opt.text || opt;
                    const valueToSave = isTF ? labelText : optionLetters[i];
                    const isActive = studentSelection === valueToSave;

                    return (
                      <label key={i} className={`relative flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all
                        ${isActive ? 'border-[#E78B48] bg-orange-50 ring-4 ring-orange-100' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <input type="radio" className="hidden" checked={isActive} onChange={() => !submitted && setUserAnswers(prev => ({ ...prev, [index]: valueToSave }))} />
                        {!isTF && <div className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 text-xs font-black ${isActive ? 'bg-[#E78B48] text-white' : 'bg-gray-100 text-gray-400'}`}>{optionLetters[i]}</div>}
                        <span className={`text-lg font-bold ${isActive ? 'text-[#E78B48]' : 'text-[#102E50]/80'}`}>{labelText}</span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-base shadow-sm
                    ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? <MdCheckCircle className="text-2xl" /> : <MdError className="text-2xl" />}
                    <span>{isCorrect ? "Correct Choice" : `Feedback: The correct answer is "${q.answer}"`}</span>
                  </div>
                )}
              </section>
            );
          })}
        </main>

        <footer className="p-8 bg-white border-t-2 flex flex-col items-center shrink-0">
          {!submitted ? (
            <button onClick={handleSubmit} className="bg-[#E78B48] text-white font-black py-5 px-28 rounded-2xl shadow-xl hover:bg-[#d67a3a] uppercase tracking-widest">
              Submit Quiz
            </button>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-black text-[#102E50] mb-4">Score: {score} / {quiz.quiz_content.length}</div>
              <button onClick={() => navigate(-2)} className="bg-[#102E50] text-white py-4 px-16 rounded-2xl font-bold hover:bg-[#E78B48]">Return to Dashboard</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}