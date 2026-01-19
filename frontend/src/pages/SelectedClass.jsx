
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
import { LuWand, LuUpload } from "react-icons/lu";
import ClassicButton from "../components/classicButton";
import { PiKeyReturn } from "react-icons/pi";
import UserDropup from "../components/DropUp/UserDropUp";
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

  const [quizzes, setQuizzes] = useState([])

  const handleArchiveQuiz = async (quizId) => {
    try {
      
      await axios.patch(`${import.meta.env.VITE_API_URL}/archiveQuiz/${quizId}`);
      
      alert("Quiz archived successfully!");
    } catch (error) {
      console.error("Failed to archive:", error);
      alert("Could not archive quiz. Please try again.");
    }
  };
    
  const { classId, term } = useParams();
  const userRole = useUserStore((state) => state.userRole);
  const userId = useUserStore((state) => state.userId);
  const className = useClassStore((state) => state.className);

  const getLessons = async() => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/class_material/getByClassId/${classId}`)
        setMaterials(response.data)
        
    } catch(err) {
        if(err.response?.data?.detail) {
            setFetchMaterialsError(err.response.data.detail)
        } else {
            setFetchMaterialsError("Network Error")
         }
    } 
  }

  const getQuizzes = async () => {
  try {
    let response;

    if (userRole === "teacher") {
      response = await axios.get(
        `${import.meta.env.VITE_API_URL}/getQuizzes/${classId}`,
        { params: { term } }
      );
    } else {
      
      response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student/quizzes/${classId}`,
        {
          params: { term, studentId: userId },
        }
      );
    }

    setQuizzes(response.data);
  } catch (error) {
    console.log("Error fetching quizzes:", error);
  }
};


  const location = useLocation();
  useEffect(() => {
    if (classId) {
      getLessons();
      getQuizzes();
    }

    if (location.state?.refresh) {
    
      navigate(location.pathname, { replace: true, state: {} });
    }
    
  }, [classId, term, location.state?.refresh]);


  const filteredMaterials = useMemo(() => {
    return materials.filter((lesson) => lesson.termId === Number(term)) 
  }, [materials, term])

 
  let termName = getTermName(Number(term));

  return (
    <div className="flex flex-col w-full h-auto min-h-screen py-8 gap-8 items-center relative">
        <UserDropup />
        
        <div
            className="flex flex items-center w-3/4 sm:w-[70%] min-h-[100px] lg:min-h-[120px] h-auto         
              truncate bg-[#102E50] rounded-2xl relative p-5"
        >
            <div className="absolute h-[8%] w-full bg-black/20 bottom-0 left-0"></div>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white truncate">{className}</p>
        </div>

        {userRole == "teacher" && (
          <div className="flex flex-col md:flex-row w-3/4 sm:w-[70%] h-auto gap-2 mx-auto justify-end mt-3">
            <ClassicButton 
              buttonName="Upload Material"
              className=" bg-[#102E50] shadow-md place-self-end w-full md:w-1/2 lg:w-1/3 2xl:w-1/4"
              onClick={() => setIsOpen(true)}
              mainColor="#183D65" 
              darkColor="#102E50"
              icon={LuUpload}
            />

            <ClassicButton 
              buttonName="Generate Exam"
              className="shadow-md place-self-end w-full md:w-1/3 2xl:w-1/4"
              onClick={() => setIsOpenTOS(true)}
              mainColor="#E78B48" 
              darkColor="#B9652B"
              icon={LuWand}
            />

            {successMessage && (<p className="text-green-800 self-end">{successMessage}</p>)}
          </div>
        )}
        

        <div className="w-3/4 sm:w-[70%] mt-4 h-auto">
          <h2 className="text-[#102E50] font-bold text-2xl">{termName}'s Materials</h2>
        </div>
        
        <div className="flex flex-wrap justify-start gap-5 w-3/4 sm:w-[70%] bg-[#EBECF1]/30 p-2 rounded-2xl">
          
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
        
        <div className="w-3/4 sm:w-[70%] mt-10">
          <h2 className="text-[#102E50] font-bold text-2xl">{termName}'s Assessments</h2>
        </div>

        <div className="flex flex-wrap justify-start gap-5 w-3/4 sm:w-[70%] bg-[#EBECF1]/30 p-2 rounded-2xl mb-12">
          {materials.length > 0 && quizzes.length > 0 ? (
            quizzes.map((quiz) => {
              const lesson = materials.find((m) => m.id === quiz.lesson_id);
              const lessonTitle = lesson ? lesson.title : "Unknown Lesson";
              return(
                <QuizCard 
                  key={quiz.id} 
                  quizId={quiz.id} 
                  lessonTitle={lessonTitle}
                  quizTitle={quiz.title} 
                  createdAt={quiz.created_at}
                  onArchive={handleArchiveQuiz} 
                  assessmentType={quiz.assessment_type}
                />
              )
            })
          ) : (
            <div className="text-gray-500 text-center w-full py-6">
              No Quiz available for this term yet
            </div>
          )}
        </div>

        <div className="w-3/4 sm:w-[70%] h-auto place-items-center">
          <ClassicButton 
            buttonName="Back To Classes"
            icon={PiKeyReturn }
            onClick={() => navigate(-2)}
            className="absolute" 
            mainColor="#E78B48" 
            darkColor="#B9652B"
          />
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