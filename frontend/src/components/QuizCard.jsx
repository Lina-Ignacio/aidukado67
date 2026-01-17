import { useNavigate } from "react-router-dom";
import { MdTaskAlt, MdArchive } from "react-icons/md";
import userRole from "../store/useUserStore";
import { MdQuiz, MdOutlineEditNote } from "react-icons/md";

export default function QuizCard({ quizId, quizTitle, createdAt, onArchive, assessmentType }) {
  const navigate = useNavigate();
  const usersRole = userRole((state) => state.userRole);


  const handleClick = () => {
    const role = usersRole?.toLowerCase();
    if (role === "teacher") {
      navigate(`/quizMonitoring/${quizId}`);
    } else if (role === "student") {
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

  return (
    <div
      className="flex flex-col w-full h-auto lg:w-[45%] xl:w-[31%] p-5 gap-2
                    rounded-md cursor-pointer shadow-sm hover:shadow-md
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.01] relative
                    relative overflow-hidden assessment-background
                    rounded-tr-xl rounded-bl-xl"
      style={{ backgroundColor: "rgba(158, 198, 243, 0.2)" }}
      onClick={handleClick}
    >
      <div 
        className="absolute h-[3%] w-full bg-[#E78B48]/20 bottom-0 left-0
          rounded-tr-xl rounded-bl-xl"
      >
      </div>
      {/* Archive Button - Positioned top-right for Teachers */}
      {usersRole?.toLowerCase() === "teacher" && (
        <div className="absolute top-3 right-3 z-10">
          
        </div>
      )}

      {/* Title Section */}
      <div className="flex flex-col pr-8">
        <h2 className="text-md font-bold text-gray-800 leading-tight">
          {quizTitle}
        </h2>
      </div>

      {/* Date Section */}
      <p className="w-4/5 text-sm font-semibold text-gray-800 mt-auto">
        {formattedDate}
      </p>

      <div 
          className={`flex justify-center items-center bg-[#102E50] w-11 h-11 text-white text-xl
            absolute bottom-2 right-2 rounded-full p-3 transition-all duration-200 ease-in-out
            hover:brightness-110 hover:shadow-lg active:scale-95 active:brightness-90`}>
          {assessmentType == "Quiz" ? <MdQuiz /> : <MdOutlineEditNote />}
      </div>

          
    </div>
  );
}