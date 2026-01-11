import { useNavigate } from "react-router-dom";
import { MdTaskAlt, MdArchive } from "react-icons/md"; // ✅ Replaced MdDelete with MdArchive
import userRole from "../store/useUserStore";
import axios from "axios";

export default function QuizCard({ quizId, lessonTitle, quizTitle, createdAt, onArchive }) {
  const navigate = useNavigate();
  const usersRole = userRole((state) => state.userRole);

  const handleArchive = async (e) => {
    e.stopPropagation(); // prevent navigation on click
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/archiveQuiz/${quizId}`);
      console.log("Quiz archived successfully");
      if (onArchive) onArchive(quizId);
    } catch (error) {
      console.error("Error archiving quiz:", error);
    }
  };

  const handleClick = () => {
    if (usersRole?.toLowerCase() === "teacher") {
      navigate(`/quizMonitoring/${quizId}`);
    } else if (usersRole?.toLowerCase() === "student") {
      navigate(`/studentQuizPage/${quizId}`);
    } else {
      navigate("/login");
    }
  };

  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  console.log("user role", usersRole);

  return (
    <div
      className="flex flex-col w-full max-w-sm p-5 gap-2 rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-[1.01] relative overflow-hidden"
      style={{ backgroundColor: "rgba(158, 198, 243, 0.2)" }}
      onClick={handleClick}
    >
      
      <div className="flex justify-between items-center">
        <h2 className="text-md font-semibold text-gray-800 h-2/3">
            <strong>{quizTitle}</strong>
            <p className="text-md font-semibold text-gray-800 h-2/3">{lessonTitle}</p>
        </h2>

        {usersRole?.toLowerCase() === "teacher" && (
          <MdArchive
            size={30}
            color="#171718ff" // Tailwind blue-500
            onClick={handleArchive}
            className="cursor-pointer hover:scale-110 transition-transform duration-200"
            title="Archive quiz"
          />
        )}
      </div>

      <div className="flex h-1/3 justify-between items-center">
        <p className="w-4/5 text-sm font-semibold text-gray-800">{formattedDate}</p>
      </div>

      <div className="absolute bottom-2 right-2 flex bg-[#9BA4B4] w-10 h-10 rounded-full p-1 items-center justify-center">
        <MdTaskAlt size={24} className="text-blue" />
      </div>

    </div>
  );
}
