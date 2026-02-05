
import { useEffect, useState } from "react"
import axios from 'axios'
import ClassCardStudent from "../components/ClassCardStudent";
import useUserStore from "../store/useUserStore";

export default function StudentClasses() {
  const userId = useUserStore((state) => state.userId)
  
  const [classes, setClasses] = useState([
  ])
  

  useEffect(() => {
    if(!userId) return

    const getClasses = async () => {
      try{
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/enrollment/getByUserId/${userId}`)
        setClasses(response.data);
        console.log("classes", response.data)
      }catch(error){
        console.error("Error fetching classes ", error)
      }
    }
    getClasses() 
  }, [userId]) 

  return (
    <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16
              py-8 sm:py-10 min-h-screen gap-y-5 lg:gap-y-8">
        <h1 className="text-2xl md:text-3xl 2xl:text-5xl font-bold lg:font-extrabold text-[#E78B48] mb-8">All Your Classes in One Place</h1>
          
        {classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 w-full">
              {classes.map((cls) => (
                <ClassCardStudent
                  key={cls.id}
                  subjectName={cls.enrolledClass.name} 
                  schedule={cls.enrolledClass.schedule}
                  room={cls.enrolledClass.room}
                  section={cls.enrolledClass.section}
                  teacher={
                    cls.enrolledClass.userTeacher
                      ? `${cls.enrolledClass.userTeacher.firstName} ${cls.enrolledClass.userTeacher.lastName}`
                      : "Unknown Teacher"
                  }
                  classId={cls.enrolledClass.id}
                />
              ))}
            </div>
            ) : (
                <p>No classes enrolled</p>
            )}
    </main>
  )

}