import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import useUserStore from "../../store/useUserStore";

export default function StudentTest() {
  const navigate = useNavigate();
  const student_id = useUserStore((state) => state.userId);
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState({ quiz_content: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);

  const optionLetters = "ABCD".split("");
  const fetchCalled = useRef(false);

  const quizRef = useRef(null);
  const userAnswersRef = useRef({});

  // ---------------- FETCH USER ANSWERS ----------------
  useEffect(() => {
    const fetchUserAnswer = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/getUserAnswers/${quizId}/${student_id}`
        );

        if (res.data.taken) {
          setUserAnswers(res.data.answers);
          setScore(res.data.score);
          setSubmitted(true);
        } else {
          setSubmitted(false);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserAnswer();
  }, [quizId, student_id]);

  // Store user answers in ref
  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  // ---------------- FETCH QUIZ ----------------
  useEffect(() => {
    if (fetchCalled.current) return;
    fetchCalled.current = true;

    const fetchQuiz = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/getQuiz/${quizId}`
        );
        setQuiz(res.data);
        quizRef.current = res.data;
        setDuration(res.data.duration);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // ---------------- SAVE START TIME ----------------
  useEffect(() => {
    const saveStartTime = async () => {
      try {
        const data = { quiz_id: quizId, student_id };
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/saveStartTime`,
          data,
          { headers: { "Content-Type": "application/json" } }
        );

        setStartTime(new Date(response.data.start_time));
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    saveStartTime();
  }, [quizId]);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (!startTime || !duration || submitted) return;

    const elapsed = (new Date() - new Date(startTime)) / 1000;
    const remaining = Math.max(duration * 60 - elapsed, 0);

    setTimeLeft(remaining);

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now - new Date(startTime)) / 1000;
      const remaining = Math.max(duration * 60 - elapsed, 0);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, submitted]);

  // ---------------- TAB SWITCH + NAVIGATION BLOCK ----------------
  useEffect(() => {
    if (submitted) return;

    const handleVisibility = () => {
      if (document.hidden) {
        alert("You switched tab. Your quiz will be submitted now!");
        handleSubmit();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const blockClicks = (e) => {
      const anchor = e.target.closest("a");
      if (anchor && anchor.href) {
        e.preventDefault();
        alert("You must submit the quiz before leaving this page.");
      }
    };
    document.addEventListener("click", blockClicks);

    // Back button
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      alert("You must submit the quiz before leaving this page.");
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("click", blockClicks);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [submitted]);

  // ---------------- HANDLE ANSWER CHANGE ----------------
  const handleOptionChange = (qIndex, selectedText) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: selectedText,
    }));
  };

  // ---------------- SUBMIT QUIZ ----------------
  const handleSubmit = async (
    quizContent = quizRef.current?.quiz_content
  ) => {
    if (submitted) return;

    let totalScore = 0;

    quizContent.forEach((q, index) => {
      const correctAnswer = q.answer?.trim();
      const studentAnswer = userAnswersRef.current[index] || "";
      if (studentAnswer === correctAnswer) totalScore++;
    });

    setScore(totalScore);
    setSubmitted(true);

    const saveScore = {
      student_id,
      quiz_id: quizId,
      status: "done",
      score: totalScore,
      answers: userAnswers,
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/saveScore`, saveScore);
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-[#102E50]">
      <div className="w-full max-w-4xl bg-white text-black rounded-2xl shadow-xl p-8 sm:p-10 overflow-y-auto max-h-[90vh]">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          {quiz.title || "Lesson Quiz"}
        </h1>

        <p className="font-semibold mb-4 text-center">
          Time left: ⏱ {Math.floor(timeLeft / 60)}:
          {String(Math.floor(timeLeft % 60)).padStart(2, "0")}
        </p>

        <h2 className="font-semibold mb-6 text-xl">
          <strong>Instruction: </strong> {quiz.instructions}
        </h2>

        {quiz.quiz_content.length === 0 && <p>No questions available.</p>}

        {quiz.quiz_content.map((q, index) => {
          const studentAnswer = userAnswers[index] || "";
          const isCorrect = submitted && studentAnswer === q.answer;

          return (
            <div
              key={index}
              className="mb-8 p-4 border border-gray-200 rounded-xl bg-[#F9FAFB]"
            >
              {q.question && (
                <p className="font-semibold text-lg mb-3">{q.question}</p>
              )}

              {q.questionImage && (
                <img
                  src={q.questionImage}
                  alt="Question"
                  className="max-w-xs rounded-lg mb-3 border"
                />
              )}

              <ul className="space-y-2">
                {q.options.map((opt, i) => (
                  <li key={i}>
                    <label className="flex flex-col sm:flex-row items-start sm:items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionLetters[i]}
                        checked={studentAnswer === optionLetters[i]}
                        onChange={() =>
                          handleOptionChange(index, optionLetters[i])
                        }
                        disabled={submitted}
                        className="accent-[#424874]"
                      />

                      <div className="flex flex-col items-start gap-1">
                        {opt.text && <span>{opt.text}</span>}
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt="Option"
                            className="max-w-[150px] mt-2 rounded border"
                          />
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>

              {submitted && (
                <div className="mt-2">
                  {isCorrect ? (
                    <p className="text-green-600 font-medium">✅ Correct!</p>
                  ) : (
                    <p className="text-red-600 font-medium">
                      ❌ Incorrect. Correct Answer: {q.answer}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!submitted && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => handleSubmit()}
              className="xl:text-lg p-2 bg-[#424874] text-white font-semibold rounded-lg hover:bg-[#2f355d] transition"
            >
              Submit Answers
            </button>
          </div>
        )}

        {submitted && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-3xl font-bold text-[#424874]">
              Score: {score} / {quiz.quiz_content.length}
            </p>

            <button
              className="xl:text-lg p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
