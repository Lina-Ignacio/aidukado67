import { useEffect, useState } from "react"
import axios from "../services/axiosConfig.js";
import ClassCard from "../components/ClassCard";
import useUserStore from "../store/useUserStore.js";
import Layout from "../components/Layout.jsx";
import useCurrentSemester from '../store/useCurrentSemester';
import CurrentSemesterBanner from "../components/CurrentSemesterBanner"; 
import UserDropup from "../components/DropUp/UserDropUp.jsx";

export default function TeacherClasses() {

  const teacherId = useUserStore((state) => state.userId)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true) // Add local loading state

  const { 
    currentSemester, 
    selectedSemesterId, 
    loading: semesterLoading 
  } = useCurrentSemester();

  // Combine both useEffect calls into one
  useEffect(() => {
    if(!teacherId) {
      setLoading(false)
      return
    }

    const getClasses = async () => {
      try{
        // Fetch classes taught by teacher
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/getByUserId/${teacherId}`)
        setClasses(response.data)
        console.log("Classes taught response:", response.data)
      }catch(error){
        console.error("Error fetching taught classes ", error)
      } finally {
        setLoading(false)
      }
    }
    
    getClasses() 
  }, [teacherId]) 

  // Handle loading state AFTER all hooks are called
  if (loading || semesterLoading) {
    return (
      <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16 py-8 sm:py-10 min-h-screen">
        <div className="text-gray-600">Loading academic period...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16
              py-8 sm:py-10 min-h-screen gap-y-5 lg:gap-y-8"
    >
      
      <CurrentSemesterBanner currentSemester={currentSemester} />
      <UserDropup />
      {classes.length > 0 ? (
        <div className="w-full max-w-7xl grid grid-cols-1
                sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
                gap-4 sm:gap-6 lg:gap-8 mt-6 justify-items-center"
        >
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              subjectName={cls.name}
              schedule={cls.schedule}
              room={cls.room}
              section={cls.section}
              classId={cls.id}
            />
          ))}
        </div>
      ) : (
        <p className="text-[#102E50] text-base sm:text-lg mt-10">
          No Available Classes
        </p>
      )}
    </main>

  )
}