
import React from "react";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import UploadLesson from "./Lesson/UploadLesson";
import LessonCard from "../components/LessonCard";
import { getTermName } from "../utils/getTermName";
import useUserStore from "../store/useUserStore";
import useClassStore from "../store/useClassStore";
import QuizCard from "../components/QuizCard";
import TOSForm from "./Exam/TosForm";
import { FiPlus } from "react-icons/fi";
import { GiMagicBroom } from "react-icons/gi";
//import termStore from "../store/useTermStore";

export default function SelectedClass() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenTOS, setIsOpenTOS] = useState(false);
  const panelStyle = "w-full sm:h-[70%] max-w-lg rounded-xl shadow-xl"
  const [successMessage, setSuccessMessage] = useState("");
  //const termId = termStore((state) => state.termId);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 10000); 

      return () => clearTimeout(timer); 
    }
  }, [successMessage]);

  const [materials, setMaterials] = useState([]);
  

  const [fetchMaterialsError, setFetchMaterialsError] = useState("");

  const [quiz, setQuiz] = useState([])
  const handleArchiveQuiz = (quizId) => {
    setQuiz((prev) => prev.filter((quiz) => quiz.id !== quizId));
  };
  
  const { classId, term } = useParams();
  const userRole = useUserStore((state) => state.userRole);
  const className = useClassStore((state) => state.className);

  const getLessons = async() => {
    try {
        const response = await axios.get(`http://localhost:8000/class_material/getByClassId/${classId}`)
        setMaterials(response.data)
        console.log(response.data)
    } catch(err) {
        if(err.response?.data?.detail) {
            setFetchMaterialsError(err.response.data.detail)
        } else {
            setFetchMaterialsError("Network Error")
         }
    } 
  }

  const location = useLocation();
  useEffect(() => {
    if (location.state?.refresh) {
      getLessons();
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const getQuizzes = async() => {
    try{
      const response = await axios.get(`http://localhost:8000/getQuizzes/${classId}`, {
        params: {term}
      })
      console.log(response.data);
      setQuiz(response.data);
    }
    catch(error){
      console.log("Error: ", error)
    }
  }  

  useEffect(() => {
    if(classId){
      getLessons();
      getQuizzes();
    }
    console.log("Class ID changed:", classId);
  }, [classId])


  const filteredMaterials = useMemo(() => {
    return materials.filter((lesson) => lesson.termId === Number(term)) 
  }, [materials, term])

 
  let termName = getTermName(Number(term));

  return (
    <div className="flex flex-col w-full h-auto min-h-screen py-5 gap-8 items-center">
        <div
            className="flex flex-col w-3/4 sm:w-[80%] min-h-[150px] h-auto         
              p-4 truncate bg-[#F4F6FF] rounded-tl-3xl rounded-br-3xl"
        >
            <div 
                className="flex flex-col flex-grow-[8] p-4 justify-center
                bg-[#102E50] rounded-tl-3xl rounded-br-3xl"
            >
                <p className="text-[2rem] sm:text-[2.5rem] font-bold text-white">{className}</p>
            </div>
            
        </div>

        {userRole == "teacher" && (
          <div className="flex flex-row w-3/4 sm:w-[80%] h-auto gap-5 mx-auto justify-end mt-3">
            <button 
              onClick={() => setIsOpen(true)} 
              className="shadow-xl rounded p-3 text-white font-semibold bg-[#102E50] 
              hover:bg-[#0B2239] hover:text-white transition-transform duration-300 flex justify-center
              items-center gap-1 rounded-lg" 
            > 
              <FiPlus className="text-lg xl:text-2xl"/>
              <span className="text-md xl:text-lg">Upload Material</span> 
            </button>

            <button
              onClick={() => setIsOpenTOS(true)}
              className=" p-3 bg-[#E78B48] text-white rounded font-semibold
              hover:bg-[#D9773A] hover:text-white flex justify-center
              items-center gap-1 rounded-lg"
            >
              <GiMagicBroom className="text-lg xl:text-2xl"/>
              <span className="text-md xl:text-lg">Generate Exam</span> 
            </button>

            {successMessage && (<p className="text-green-800 self-end">{successMessage}</p>)}
          </div>
        )}
        

        <div className="w-3/4 sm:w-[80%] mt-4 h-auto">
          <h2 className="text-[#102E50] font-bold text-2xl">{termName}'s Materials</h2>
        </div>
        
        <div className="flex flex-wrap justify-start gap-5 w-3/4 sm:w-[80%]">
          
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((lesson) => (
              <LessonCard 
                key={lesson.id} 
                materialName={lesson.title} 
                materialId={lesson.id} 
                creationDate ={lesson.createdAt}
                materialType ={lesson.type}
                classId = {classId}
              />
            ))
          ) : (
            <div className="text-gray-500 text-center w-full py-6">
              No lessons available for this term yet. {filteredMaterials[0]}
            </div>
          )}
        </div>
        
        <div className="w-3/4 sm:w-[80%] mt-10">
          <h2 className="text-[#102E50] font-bold text-2xl">{termName}'s Quizzes</h2>
        </div>

        <div className="flex flex-wrap justify-start w-3/4 sm:w-[80%] gap-[5%]">
          {materials.length > 0 && quiz.length > 0 ? (
            quiz.map((quiz) => {
              const lesson = materials.find((m) => m.id === quiz.lesson_id);
              const lessonTitle = lesson ? lesson.title : "Unknown Lesson";
              console.log(lessonTitle)
              return(
                <QuizCard 
                key={quiz.id} 
                quizId={quiz.id} 
                lessonTitle={lessonTitle}
                quizTitle={quiz.title} 
                createdAt={quiz.created_at}
                onArchive={handleArchiveQuiz} 
              />
              )
            })
          ) : (
            <div className="text-gray-500 text-center w-full py-6">
              No Quiz available for this term yet
            </div>
          )}
        </div>


        
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Upload a Material" panelStyle={panelStyle}>
            <UploadLesson 
              setSuccessMessage={setSuccessMessage}
              setIsOpen={setIsOpen} 
              term={term}
              onSuccess={() => {
                getLessons();
                setIsOpen(false);
              }}
            />
        </Modal>

        <Modal isOpen={isOpenTOS} onClose={() => setIsOpenTOS(false)} title="Generate Exam">
          <TOSForm
            lessons={filteredMaterials}
            onClose={() => setIsOpenTOS(false)}
            onSuccess={(data) => console.log("TOS Generated:", data)}
          />
        </Modal>

    </div>
  );
}