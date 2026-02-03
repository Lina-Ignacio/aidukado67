import { useNavigate } from "react-router-dom";
import { MdTaskAlt, MdArchive } from "react-icons/md";
import userRole from "../store/useUserStore";
import { MdQuiz, MdOutlineEditNote } from "react-icons/md";

export default function QuizCard({ quizData, onArchive }) {
  const navigate = useNavigate();
  const usersRole = userRole((state) => state.userRole);


  const handleClick = () => {
    const role = usersRole?.toLowerCase();
    if (role === "teacher") {
      navigate(`/quizMonitoring/${quizData.id}`);
    } else if (role === "student") {
      navigate(`/studentQuizPage/${quizData.id}`);
    } else {
      navigate("/login");
    }
  };

  const date = new Date(quizData.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const status = quizData.status == "done";

  return (
    <div
      className="flex flex-col w-full h-auto lg:w-[45%] xl:w-[31%] p-5 gap-2
                    rounded-md cursor-pointer shadow-sm hover:shadow-md
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.01] relative bg-orange-50
                    relative overflow-hidden border border-orange-100
                    rounded-tr-xl rounded-bl-xl"
      
      onClick={handleClick}
    >
      <div 
        className={`absolute h-[3%] w-full bg-[#E78B48]/20 bottom-0 left-0
          rounded-tr-xl rounded-bl-xl`}
      >
      </div>
      {/* Archive Button - Positioned top-right for Teachers */}
      {usersRole?.toLowerCase() === "teacher" && (
        <div className="absolute top-3 right-3 z-10">
          
        </div>
      )}

      {usersRole?.toLowerCase() === "student" && (
        <div className={`${status? "bg-green-200": "bg-orange-200"} w-auto px-2 rounded-full flex items-center justify-center absolute top-2 right-2`}>
          <span className={`text-sm font-semibold ${status? "text-green-700" : "text-orange-700"}`}>
            {status ? "Done": "Not Started"}
          </span> 
        </div>
      )}
      
      {/* Title Section */}
      <h2 className="text-md font-bold text-[#E6501B] leading-tight mt-1">
        {quizData.title} 
      </h2>
      

      {/* Date Section */}
      <p className="w-4/5 text-sm font-semibold text-[#E6501B] mt-auto">
        {formattedDate}
      </p>

      <div 
          className={`flex justify-center items-center bg-[#E6501B] w-11 h-11 text-white text-xl
            absolute bottom-2 right-2 rounded-full p-3 transition-all duration-200 ease-in-out
            hover:brightness-110 hover:shadow-lg active:scale-95 active:brightness-90`}>
          {quizData.assessment_type == "Quiz" ? <MdQuiz/> : <MdOutlineEditNote />}
      </div>

          
    </div>
  );
}