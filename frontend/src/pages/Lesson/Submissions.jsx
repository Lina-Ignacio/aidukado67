import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../../services/axiosConfig";
import StudentSubmissionCard from "../../components/classMaterials/studentSubmissionCard";
import FileView from "./FileView";
import ClassicButton from "../../components/classicButton";
import { MdSend, MdArrowBack, MdArrowForward, MdArrowBackIos } from "react-icons/md";

export default function Submissions() {

  const location = useLocation();

  const fromPath = location.state?.from;

  const handleGoBack = () => {
    
    
    if (fromPath) {
      navigate(fromPath);
    } else {
      
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        
        navigate('/materials');
      } else {
        navigate('/');
      }
    }
  };

  const { materialId, totalScore } = useParams();
  const navigate = useNavigate(); // Added for navigation
  const [submissions, setSubmissions] = useState([]);
  const [sortedSubmissions, setSortedSubmissions] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Helper function to format student name as "Lastname, Firstname Middlename"
  const formatStudentName = (student) => {
    if (!student) return "No Name";
    
    const { lastName, firstName, middleName } = student;
    const parts = [];
    
    if (lastName) parts.push(lastName);
    if (firstName) parts.push(firstName);
    if (middleName) parts.push(middleName);
    
    if (parts.length === 0) return "No Name";
    
    // Format as "Lastname, Firstname Middlename"
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts.slice(1).join(' ')}`;
    }
    return parts[0];
  };

  // Helper function to get sort key for alphabetical sorting
  const getSortKey = (student) => {
    if (!student) return "";
    
    const lastName = student.lastName || "";
    const firstName = student.firstName || "";
    const middleName = student.middleName || "";
    
    return `${lastName.toLowerCase()} ${firstName.toLowerCase()} ${middleName.toLowerCase()}`.trim();
  };

  // Fetch submissions for this material
  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student_submission/material/${materialId}`
      );
      
      const processedSubmissions = response.data.map(submission => {
        const student = submission.student || {};
        
        return {
          ...submission,
          student: {
            ...student,
            formattedName: formatStudentName(student),
            sortKey: getSortKey(student)
          }
        };
      });
      
      const sorted = [...processedSubmissions].sort((a, b) => {
        return a.student.sortKey.localeCompare(b.student.sortKey);
      });
      
      setSubmissions(processedSubmissions);
      setSortedSubmissions(sorted);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
      setSortedSubmissions([]);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [materialId]);

  // Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSubmissions = sortedSubmissions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);

  // File viewing states
  const [openFile, setOpenFile] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const onClick = async (submission) => {
    setSelectedSubmission(submission);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student_submission/get_url/${submission.id}`
      );
      setFileUrl(response.data.url);
      setOpenFile(true);
    } catch (err) {
      console.error("Error fetching file URL:", err);
    }
  };

  const getExtension = (url) => {
    if (!url) return null;
    const cleanUrl = url.split("?")[0];
    return cleanUrl.split(".").pop().toLowerCase();
  };

  const fileExtension = getExtension(fileUrl);

  // Score and remark states
  const isGraded = !!selectedSubmission?.score || !!selectedSubmission?.remarks;
  const [remarks, setRemarks] = useState("");
  const [score, setScore] = useState("");

  useEffect(() => {
    if (selectedSubmission) {
      setRemarks(selectedSubmission.remarks || "");
      setScore(selectedSubmission.score || "");
    }
  }, [selectedSubmission]);

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    try {
      if(Number(score) > totalScore) {
        alert("Score is greater than total score");
        return;
      }
      const payload = {
        score: score ? Number(score) : null,
        remarks: remarks || null,
        status: "graded",
      };

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/student_submission/update_score/${selectedSubmission.id}`,
        payload
      );

      fetchSubmissions();
      alert(isGraded ? "Updated successfully!" : "Submitted successfully!");
      setScore("")
    } catch (err) {
      console.error(err);
      alert("Failed to submit grade.");
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-[#102E50]/10 to-[#E78B48]/10">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-[#102E50]/20 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#102E50] to-[#E78B48] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📱</span>
            </div>
            <h1 className="text-2xl font-bold text-[#102E50]">Switch to Desktop</h1>
            <p className="text-[#102E50]/70 mt-2">
              This feature requires more screen space for optimal viewing.
            </p>
          </div>
          <div className="bg-[#102E50]/5 rounded-xl p-4 border border-[#102E50]/10">
            <p className="text-sm text-[#102E50]/80">
              Please access this page from a desktop or tablet device for the best experience.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:grid w-full min-h-screen grid-cols-[1fr_400px] bg-gradient-to-br from-[#102E50]/5 to-[#E78B48]/5">
        
        {/* LEFT SIDE – File View and Grading */}
        <div className="flex flex-col p-6">
          {/* Header with Back Button */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 bg-[#102E50] text-white hover:text-[#E78B48] transition-colors mb-3 group p-2"
              >
                <MdArrowBackIos className="text-lg group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Go Back</span>
              </button>
              <h1 className="text-2xl font-bold text-[#102E50]">Student Submissions</h1>
              <p className="text-[#102E50]/70">Review and grade student work</p>
            </div>
            
            {/* Optional: Add total submissions count here too */}
            <div className="bg-gradient-to-r from-[#102E50]/10 to-[#E78B48]/10 rounded-xl p-3 border border-[#102E50]/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#102E50]">{sortedSubmissions.length}</div>
                <div className="text-sm text-[#102E50]/70">Submissions</div>
              </div>
            </div>
          </div>

          {/* File View Section */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-[#102E50]/10 overflow-hidden mb-6">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-[#102E50]/10 bg-gradient-to-r from-[#102E50]/5 to-transparent">
                <h2 className="font-semibold text-[#102E50]">
                  {selectedSubmission ? selectedSubmission.student.formattedName : "Submission Preview"}
                </h2>
              </div>
              
              <div className="flex-1 flex items-center justify-center p-6">
                {openFile && fileUrl ? (
                  <FileView 
                    fileExtension={fileExtension} 
                    fileUrl={fileUrl} 
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#102E50]/10 to-[#E78B48]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl text-[#102E50]/40">📄</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#102E50] mb-2">
                      Select a Submission
                    </h3>
                    <p className="text-[#102E50]/60">
                      Click on a student's name to view their work
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grading Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#102E50]/10 p-6">
            <h2 className="text-lg font-semibold text-[#102E50] mb-4">Grading</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#102E50]/80 mb-2">
                  Remarks
                </label>
                <textarea
                  className="w-full h-32 p-3 rounded-xl border border-[#102E50]/20 focus:border-[#E78B48] focus:ring-2 focus:ring-[#E78B48]/30 outline-none transition-all bg-white placeholder-[#102E50]/40 text-[#102E50] resize-none"
                  placeholder="Provide feedback or comments for the student..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {/* Fixed alignment section */}
              <div className="flex items-end gap-4">
                {/* Score Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#102E50]/80 mb-2">
                    Score
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      max={totalScore}
                      className="w-full p-3 rounded-xl border border-[#102E50]/20 focus:border-[#E78B48] focus:ring-2 focus:ring-[#E78B48]/30 outline-none transition-all bg-white placeholder-[#102E50]/40 text-[#102E50] pr-16"
                      placeholder={`Enter score out of ${totalScore}`}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-[#102E50]/60">
                      / {totalScore}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex-shrink-0 mb-1">
                  <ClassicButton 
                    buttonName={isGraded ? "UPDATE" : "GRADE"}
                    onClick={handleSubmitGrade}
                    className=""
                    mainColor="#102E50" 
                    darkColor="#0B2239"
                    icon={MdSend}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – Student List */}
        <div className="bg-gradient-to-b from-[#102E50] to-[#0B2239] p-6 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Student List</h2>
                <p className="text-white/70 text-sm">
                  {sortedSubmissions.length} student{sortedSubmissions.length !== 1 ? 's' : ''} submitted
                </p>
              </div>
              <div className="bg-white/10 rounded-full p-2">
                <span className="text-white text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>

          {/* Student Cards */}
          <div className="flex-1 overflow-y-auto pr-2">
            {currentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {currentSubmissions.map((submission) => (
                  <StudentSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onClick={onClick}
                    studentName={submission.student.formattedName}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl text-white/60">👤</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Submissions</h3>
                <p className="text-white/60">
                  No students have submitted their work yet.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {sortedSubmissions.length > itemsPerPage && (
            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  <MdArrowBack className="text-lg" />
                  <span className="font-medium">Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-white text-[#102E50]'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  <span className="font-medium">Next</span>
                  <MdArrowForward className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}