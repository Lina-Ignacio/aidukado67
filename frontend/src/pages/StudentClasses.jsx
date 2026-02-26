import { useEffect, useState } from "react"
import axios from "../services/axiosConfig";
import ClassCardStudent from "../components/ClassCardStudent";
import useUserStore from "../store/useUserStore";
import useCurrentSemester from '../store/useCurrentSemester';
import CurrentSemesterBanner from "../components/CurrentSemesterBanner"; // Import the new component
import UserDropup from "../components/DropUp/UserDropUp";

export default function StudentClasses() {
  const userId = useUserStore((state) => state.userId)
  const [classes, setClasses] = useState([])
  
  // Use the current semester hook
  const { 
    currentSemester, 
    selectedSemesterId, 
    loading: semesterLoading 
  } = useCurrentSemester();

  useEffect(() => {
    if(!userId) return

    const getClasses = async () => {
      try{
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/enrollment/getByUserId/${userId}`)
        console.log("API Response:", response.data)
        setClasses(response.data);
      }catch(error){
        console.error("Error fetching classes ", error)
      }
    }
    getClasses() 
  }, [userId]) 

  // Show loading state while fetching semester
  if (semesterLoading) {
    return (
      <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16 py-8 sm:py-10 min-h-screen">
        <div className="text-gray-600">Loading academic period...</div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center px-8 lg:px-10 xl:px-16
              py-8 sm:py-10 min-h-screen gap-y-5 lg:gap-y-8">
        
        {/* Current Semester Banner Component */}
        <CurrentSemesterBanner currentSemester={currentSemester} />
        <UserDropup />
        {classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 w-full">
              {classes.map((cls) => {
                // Use camelCase to match the API response
                const classData = cls.enrolledClass || {};  // Changed from enrolled_class
                const teacherData = classData.userTeacher || {};  // Changed from user_teacher
                
                // Get teacher email from the teacher data
                const teacherEmail = teacherData.email || "";
                
                // Format teacher name using camelCase
                const teacherName = teacherData.firstName || teacherData.lastName 
                  ? `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim()
                  : "Unknown Teacher";
                
                console.log("Rendering class:", {
                  subjectName: classData.name,
                  teacherName: teacherName,
                  teacherEmail: teacherEmail,
                  schedule: classData.schedule,
                  room: classData.room,
                  section: classData.section
                });
                
                return (
                  <ClassCardStudent
                    key={cls.id}
                    subjectName={classData.name || "Unknown Subject"}
                    classId={classData.id}
                    teacher={teacherName}
                    email={teacherEmail}
                    schedule={classData.schedule || "No schedule"}
                    room={classData.room || "TBA"}
                    section={classData.section || ""}
                  />
                );
              })}
            </div>
            ) : (
                <p className="text-gray-600">No classes enrolled</p>
            )}
    </main>
  )
}