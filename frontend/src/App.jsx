import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
//import Sidebar from '../components/sidebar';
import AIPretest from "./pages/AIPretest";
//import Dashboard from "./pages/Dashboard";
import PostTest from './pages/PostTest';
import Login from "./components/Login";
import Signup from "./pages/Users/AddUser";
import StudentArea from './pages/StudentArea';

import RoleProtectedRoute from './components/RoleProtectedRoute';
import UserManagement from './pages/AdminPages/UserManagement';
import ClassManagement from './pages/AdminPages/ClassManagement';
import SubjectManagement from './pages/AdminPages/SubjectManagement';
import EnrollmentManagement from './pages/AdminPages/EnrollmentManagement';
import AboutPage from './pages/About';
import StudentClasses from './pages/StudentClasses';
import TeacherClasses from './pages/TeacherClasses';
import SelectedClass from './pages/SelectedClass';
import SelectedLesson from './pages/Lesson/SelectedLesson';
import TermPage from './pages/TermPage';
import FileView from './pages/Lesson/FileView';
import Submissions from './pages/Lesson/Submissions';

import CreateQuiz from './pages/Quiz/CreateQuiz';
import StudentQuizPage from './pages/Quiz/StudentQuizPage';
import LessonSummary from './pages/Lesson/LessonSummary';
import QuizMonitoring from './pages/Quiz/QuizMonitoring';
import Layout from './components/Layout';

import useUserStore from './store/useUserStore';

function AppContent() {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname.startsWith("/submissions/");

  const role = useUserStore((state) => state.userRole)

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">

      {hideSidebar ? (
        // NO SIDEBAR MODE
        <main className="flex-grow">
          <Routes>
            <Route path="/submissions/:materialId" element={<Submissions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      ) : (
        // WITH SIDEBAR MODE
        <main className="flex-grow">
        <Layout>
          
          <Routes>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route 
              path="/dashboard" 
              element={
                role === "student" ? (
                  <Navigate to="/studentClasses" replace />
                ) : role === "teacher" ? (
                  <Navigate to="/teacherClasses" replace />
                ) : role === "admin" ? (
                  <Navigate to="/userManagement" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route 
              path="/subjects" 
              element={
                <RoleProtectedRoute allowed_roles={["student"]}>
                  <StudentArea />
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/aipretest" 
              element={
                <RoleProtectedRoute allowed_roles={"teacher"}>
                  <AIPretest />
                </RoleProtectedRoute>
              }
            />

            <Route path="/postTest" element={<PostTest/>}/>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route 
              path="/studentClasses" 
              element={
                <RoleProtectedRoute allowed_roles={"student"}>
                  <StudentClasses/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/teacherClasses" 
              element={
                <RoleProtectedRoute allowed_roles={"teacher"}>
                  <TeacherClasses/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/selectedClass/:classId/:term" 
              element={
                <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                  <SelectedClass/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/selectedLesson/:materialId/:materialType" 
              element={
                <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                  <SelectedLesson/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/termPage" 
              element={
                <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                  <TermPage/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/fileView" 
              element={
                <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                  <FileView/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/createQuiz/:classId/:materialId" 
              element={
                <RoleProtectedRoute allowed_roles={["teacher"]}>
                  <CreateQuiz/>
                </RoleProtectedRoute>
              }
            />
            
            <Route 
              path="/studentQuizPage/:quizId" 
              element={
                <RoleProtectedRoute allowed_roles={["student"]}>
                  <StudentQuizPage/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/lessonSummary/:materialId" 
              element={
                <RoleProtectedRoute allowed_roles={["student"]}>
                  <LessonSummary/>
                </RoleProtectedRoute>
              }
            />

            <Route 
              path="/quizMonitoring/:quizId" 
              element={
                <RoleProtectedRoute allowed_roles={["teacher"]}>
                  <QuizMonitoring/>
                </RoleProtectedRoute>
              }
            />
            
            <Route path='/userManagement' element={<UserManagement/>}/>
            <Route path='/classManagement' element={<ClassManagement/>}/>
            <Route path='/subjectManagement' element={<SubjectManagement/>} />
            <Route path="/enrollmentManagement" element={<EnrollmentManagement />} />
            <Route path='/help' element={<AboutPage/>}/>

            <Route path="*" element={<h1 className='text-black'>404 - Page Not Found</h1>} />
          </Routes>
          
        </Layout>
        </main>
      )}

    </div>

  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}


