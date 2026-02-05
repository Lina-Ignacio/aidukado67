
import { useEffect, useState } from "react"
import axios from 'axios'
import ClassCard from "../components/ClassCard";
import useUserStore from "../store/useUserStore.js";
import Layout from "../components/Layout.jsx";

export default function TeacherClasses() {

  const teacherId = useUserStore((state) => state.userId)

  const [classes, setClasses] = useState([])
  

  useEffect(() => {
    if(!teacherId) return

    const getClasses = async () => {
      try{
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/getByUserId/${teacherId}`)
        setClasses(response.data)
        console.log("response", response.data)
      }catch(error){
        console.error("Error fetching classes ", error)
      }
    }
    getClasses() 
  }, [teacherId]) 

  return (
    <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16
              py-8 sm:py-10 min-h-screen gap-y-5 lg:gap-y-8"
    >
      
      <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl
              font-extrabold text-[#102E50] text-center"
      >
        All Your Classes in One Place
      </h1>

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