import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Page & Component Imports
import AIPretest from "./pages/AIPretest";
import PostTest from './pages/PostTest';
import Login from "./components/Login";
import Signup from "./pages/Users/AddUser";
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
import AIQuiz from './pages/AIQuiz/AIQuiz'; 
import StudentQuizPage from './pages/AIQuiz/StudentQuizPage';
import LessonSummary from './pages/Lesson/LessonSummary';
import QuizMonitoring from './pages/AIQuiz/QuizMonitoring';
import Layout from './components/Layout';
import PasswordResetSearch from './pages/AdminPages/PasswordResetSearch';
import ForceChangePassword from './pages/PasswordChanging/ForcePasswordChange';
import ExamMonitoring from './pages/Exam/ExamMonitoring';
import StudentExam from './pages/Exam/StudentExamPage';
// Store
import useUserStore from './store/useUserStore';
import AIExam from './pages/Exam/AIExam';
import ExportScores from './pages/Scores/ExportScores';
import StudentList from './pages/StudentList';

function AppContent() {
  const role = useUserStore((state) => state.userRole);

  return (
    <div className="h-screen w-full bg-white overflow-y-auto scrollbar-hide">
      <Routes>
        {/* ==========================================
            GROUP 1: FULLSCREEN ROUTES (No Sidebar)
           ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/admin/reset-password" element={
          <RoleProtectedRoute allowed_roles={["admin"]}>
              <PasswordResetSearch />
            </RoleProtectedRoute>
        } />
  

        <Route path="/force-change-password" element={<ForceChangePassword />} />
        
        
        <Route 
          path="/submissions/:materialId/:totalScore" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <Submissions  />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/AIQuiz/:materialId" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <AIQuiz />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/exam/generate/:classId/:termId" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <AIExam />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/quizMonitoring/:quizId" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <QuizMonitoring />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/teacher/exam/monitoring/:examId" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <ExamMonitoring />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/selectedClass/:classId/:term" 
          element={
            <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
              <SelectedClass />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/studentQuizPage/:quizId" 
          element={
            <RoleProtectedRoute allowed_roles={["student"]}>
              <StudentQuizPage />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/student/exam/:examId" 
          element={
            <RoleProtectedRoute allowed_roles={["student"]}>
              <StudentExam />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/selectedLesson/:materialId/:materialType" 
          element={
            <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
              <SelectedLesson />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/export-scores/:classId/:term" 
          element={
            <RoleProtectedRoute allowed_roles={["teacher"]}>
              <ExportScores/>
            </RoleProtectedRoute>
          } 
        />

        <Route 
            path="/lessonSummary/:materialId" 
            element={
              <RoleProtectedRoute allowed_roles={["student"]}>
                <LessonSummary />
              </RoleProtectedRoute>
            } 
        />

        <Route 
            path="/studentList" 
            element={
              <RoleProtectedRoute allowed_roles={["teacher"]}>
                <StudentList />
              </RoleProtectedRoute>
            } 
          />

        {/* ==========================================
            GROUP 2: DASHBOARD ROUTES (Wrapped in Layout)
           ========================================== */}
        <Route element={<Layout />}>
          
          {/* Smart Redirect for Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              role === "student" ? <Navigate to="/studentClasses" replace /> :
              role === "teacher" ? <Navigate to="/teacherClasses" replace /> :
              role === "admin" ? <Navigate to="/userManagement" replace /> :
              <Navigate to="/login" replace />
            }
          />

          {/* Admin Management */}

          <Route 
            path='/userManagement'
            element={
              <RoleProtectedRoute allowed_roles={["admin"]}>
                <UserManagement />
              </RoleProtectedRoute>
            } 
          />

          <Route 
            path='/classManagement'
            element={
              <RoleProtectedRoute allowed_roles={["admin"]}>
                <ClassManagement />
              </RoleProtectedRoute>
            } 
          />

          {/*<RoleProtectedRoute allowed_roles={["admin"]}></RoleProtectedRoute> */}
          
          <Route 
            path='/subjectManagement'
            element={
              <RoleProtectedRoute allowed_roles={["admin"]}>
                <SubjectManagement  />
              </RoleProtectedRoute>
            } 
          />

          <Route 
            path="/enrollmentManagement" 
            element={
              <RoleProtectedRoute allowed_roles={["admin"]}>
                <EnrollmentManagement  />
              </RoleProtectedRoute>
            } 
          />

          {/* Classes & Subjects */}
          <Route 
            path="/studentClasses" 
            element={
              <RoleProtectedRoute allowed_roles={["student"]}>
                <StudentClasses />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/teacherClasses" 
            element={
              <RoleProtectedRoute allowed_roles={["teacher"]}>
                <TeacherClasses />
              </RoleProtectedRoute>
            } 
          />
          
          

          {/* Quiz & Testing Logic */}
          <Route 
            path="/aipretest" 
            element={
              <RoleProtectedRoute allowed_roles={["teacher"]}>
                <AIPretest />
              </RoleProtectedRoute>
            } 
          />
          <Route path="/postTest" element={<PostTest />} />
          

          {/* Lesson Details */}
          <Route 
            path="/termPage" 
            element={
              <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                <TermPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/fileView" 
            element={
              <RoleProtectedRoute allowed_roles={["student", "teacher"]}>
                <FileView />
              </RoleProtectedRoute>
            } 
          />
          

          {/* Help/About */}
          <Route path='/help' element={<AboutPage />} />
        </Route>

        {/* ==========================================
            GROUP 3: FALLBACKS
           ========================================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div className="p-10 text-center"><h1 className='text-black text-2xl'>404 - Page Not Found</h1></div>} />
      </Routes>
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