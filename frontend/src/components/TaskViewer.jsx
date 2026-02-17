import { useState, useEffect } from "react";
import { MdEdit, MdArchive, MdFileUpload, MdMenuBook, MdCalendarToday, 
  MdOutlineComment, MdOutlineCancel, MdVisibility, MdPerson, MdAnalytics } from "react-icons/md";
import { LuClipboardCheck } from "react-icons/lu";
import { PiClockCounterClockwise } from "react-icons/pi";
import FileView from "../pages/Lesson/FileView";
import FileUploader from "./FileUploader";
import useUserStore from "../store/useUserStore";
import axios from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";
import ClassicButton from "./classicButton";
import useClassStore from "../store/useClassStore";
import TaskReopenModal from "./classMaterials/taskReopenModal";

export default function TaskViewer({
  materialData,
  setIsVisible,
  isVisible,
  setArchiveMaterialOpen,
  setEditMaterialOpen,
}) {
  const [file, setFile] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [unsubmitError, setUnsubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewSubmittedFile, setViewSubmittedFile] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: null,
    scoredSubmissions: null,
    numberOfStudents: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenData, setReopenData] = useState(null);

  const classId = useClassStore((state) => state.classId);
  const navigate = useNavigate();
  const userId = useUserStore((state) => state.userId);
  const userRole = useUserStore((state) => state.userRole);

  const metaData = {
    materialId: materialData.materialId,
    type: materialData.materialType,
    studentId: userId,
  };

  const fetchReopenData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/task_reopen/student/${materialData.materialId}/${userId}`
      );
      setReopenData(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error fetching reopen data:", err);
      }
      setReopenData(null);
    }
  };

  const checkSubmission = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student_submission/check/${materialData.materialId}/${userId}`
      );
      if (response.data) {
        setSubmissionData(response.data);
      } else {
        setSubmissionData(null);
      }
    } catch (err) {
      console.error("Error checking submission:", err);
    }
  };

  const fetchSubmissionStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student_submission/stats/${materialData.materialId}`, 
        {
          params: { class_id: classId }
        }
      );
      if (response.data) {
        setStats({
          totalSubmissions: response.data.total_submissions,
          scoredSubmissions: response.data.scored_submissions,
          numberOfStudents: response.data.number_of_students
        });
      } else {
        setStats({
          totalSubmissions: null,
          scoredSubmissions: null,
          numberOfStudents: null
        });
      }
    } catch (err) {
      console.error("Error fetching submission stats:", err);
      if (err.response && err.response.status === 404) {
        setStats({
          totalSubmissions: 0,
          scoredSubmissions: 0,
        });
      }
    }
  };

  useEffect(() => {
    if (userRole === "student") {
      checkSubmission();
      fetchReopenData();
    } else if (userRole === "teacher") {
      fetchSubmissionStats();
    }
  }, []);

  const originalDueDate = new Date(materialData.dueDate);
  const today = new Date();
  
  const hasActiveReopen = reopenData && new Date(reopenData.new_due_date) > today;
  const effectiveDueDate = hasActiveReopen ? new Date(reopenData.new_due_date) : originalDueDate;
  const isOverdue = effectiveDueDate < today;
  const isDueToday = effectiveDueDate.toDateString() === today.toDateString();

  let dueColor = 'text-blue-300';
  let dueStatus = '';
  if (isDueToday) {
    dueColor = 'text-yellow-400';
    dueStatus = '(Due Today)';
  } else if (isOverdue) {
    dueColor = 'text-red-400';
    dueStatus = '(Past Due)';
  }

  const formattedDue = effectiveDueDate.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const maxFileSize = 20 * 1024 * 1024;
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > maxFileSize) {
      alert("File size exceeds 20 MB. Please upload a smaller file.");
      e.target.value = "";
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      console.log(`Large file detected`);
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to submit.");

    setIsSubmitting(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metaData));
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/student_submission/upload`,
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        }
      );
      
      if (response.data.file_url) {
        setSubmissionData({
          id: response.data.submission_id,
          filePath: response.data.file_url,
          material_id: metaData.materialId,
          student_id: userId,
          status: "submitted"
        });
      } else {
        await checkSubmission();
      }
      
      setSuccessMessage(response.data.message);
      setUploadError("");
      setFile(null);
      setUploadProgress(0);
      
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setUploadError("Upload timeout. Please try again with a smaller file.");
      } else if (err.response?.status === 400 && err.response?.data?.detail === "You have already submitted this material.") {
        setUploadError("You have already submitted this material.");
        await checkSubmission();
      } else {
        setUploadError(err.response?.data?.detail || "Upload failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubmit = async () => {
    if (!submissionData) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/student_submission/unsubmit/${submissionData.id}`
      );
      setSuccessMessage("Submission removed successfully.");
      setSubmissionData(null);
      setFile(null);
    } catch (err) {
      setUnsubmitError(err.response?.data?.detail || "Network or unknown error occurred");
    }
  };
  
  const handleViewSubmissions = () => {
    navigate(`/submissions/${materialData.materialId}/${materialData.totalScore}`, {
      state: { from: window.location.pathname }
    });
  };

  if (isVisible) {
    return (
      <div className="w-full sm:h-auto">
        <FileView
          fileExtension={materialData.fileExtension}
          fileUrl={materialData.fileUrl}
          fileName={materialData.title}
          isVisible={isVisible} 
          setIsVisible={setIsVisible}
        />
      </div>
    );
  }

  if (viewSubmittedFile && submissionData) {
    const fileExtension = submissionData.filePath?.split('?')[0].split('.').pop().toLowerCase();
    return (
      <div className="sm:w-3/5 sm:h-auto">
        <FileView
          fileExtension={fileExtension}
          fileUrl={submissionData.filePath}
          isVisible={isVisible} 
          setIsVisible={setIsVisible}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => setViewSubmittedFile(false)}
            className="bg-[#102E50] text-white px-4 py-2 rounded-md hover:bg-[#1b3a63] xl:text-lg p-2"
          >
            Close File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-11/12 lg:w-3/5 mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-xl overflow-hidden font-sans border border-[#EBECF1]">
      
      <div className="bg-[#102E50] p-8 text-white relative">
        <div className="absolute h-[2%] w-full bg-black/20 top-0 left-0"></div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
              <MdAnalytics className="text-[#E78B48]" /> Task Details
            </h1>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-[#E78B48]">{materialData.title}</h2>
              <p className="text-[#EBECF1] text-md">
                Description: <span className='text-[#E78B48]'>{materialData.description}</span>
              </p>
              {materialData.totalScore && (
                <p className="text-[#EBECF1] text-md">
                  Total Score: <span className='text-green-400'>{materialData.totalScore} points</span>
                </p>
              )}
              <p className="text-[#EBECF1] text-md">
                Due: <span className={dueColor}>
                  {formattedDue} {dueStatus}
                  {hasActiveReopen && " (Extended)"}
                </span>
              </p>
              {hasActiveReopen && reopenData.reason && (
                <p className="text-[#EBECF1] text-md">
                  Extension Reason: <span className='text-yellow-300'>{reopenData.reason}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-[#EBECF1]/30 relative">
        <div className="absolute h-[1%] w-full bg-[#D9CFC7]/40 bottom-0 left-0"></div>
        
        {userRole === "teacher" && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-[#EBECF1] p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className="bg-[#EBECF1]/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#102E50] p-2 rounded-lg">
                      <MdPerson className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#102E50]">{stats.numberOfStudents !== null ? stats.numberOfStudents : "0"}</p>
                      <p className="text-xs uppercase tracking-tighter text-gray-600">Assigned Students</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#EBECF1]/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#102E50] p-2 rounded-lg">
                      <MdPerson className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#102E50]">{stats.totalSubmissions !== null ? stats.totalSubmissions : "0"}</p>
                      <p className="text-xs uppercase tracking-tighter text-gray-600">Total Submissions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#EBECF1]/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#102E50] p-2 rounded-lg">
                      <MdPerson className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#102E50]">{stats.scoredSubmissions !== null ? stats.scoredSubmissions : "0"}</p>
                      <p className="text-xs uppercase tracking-tighter text-gray-600">Graded</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ClassicButton 
                    buttonName="View Material"
                    className="shadow-md"
                    onClick={() => setIsVisible(true)}
                    mainColor="#5C6BC0" 
                    darkColor="#3949AB"
                    icon={MdMenuBook}
                  />
                  <ClassicButton 
                    buttonName="View Submissions"
                    className="shadow-md"
                    onClick={handleViewSubmissions}
                    mainColor="#E78B48" 
                    darkColor="#B9652B"
                    icon={LuClipboardCheck}
                  />
                  <ClassicButton 
                    buttonName="Edit"
                    className="shadow-md"
                    onClick={() => setEditMaterialOpen(true)}
                    mainColor="#183D65" 
                    darkColor="#102E50"
                    icon={MdEdit}
                  />
                </div>

                <div className={`grid ${isOverdue ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {isOverdue && (
                    <ClassicButton 
                      buttonName="Reopen Task"
                      className="shadow-md"
                      onClick={() => setShowReopenModal(true)}
                      mainColor="#8E9DCC" 
                      darkColor="#6B7CB2"
                      icon={PiClockCounterClockwise}
                    />
                  )}
                  <ClassicButton 
                    buttonName="Archive"
                    className={`shadow-md ${isOverdue ? '' : 'sm:col-span-3'}`}
                    onClick={() => setArchiveMaterialOpen(true)}
                    mainColor="#C53030" 
                    darkColor="#8E1616"
                    icon={MdArchive}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole === "student" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white w-full lg:w-3/5 xl:w-1/2 place-self-center rounded-xl shadow-sm border border-[#EBECF1] p-6 mt-8">
              <h2 className="text-2xl font-bold text-[#102E50] mb-4">Task Material</h2>
              <p className="text-[#102E50]/80 mb-6">
                View the material for this task.
              </p>
              <ClassicButton 
                buttonName="View Material"
                className="w-full shadow-md"
                onClick={() => setIsVisible(true)}
                mainColor="#E78B48" 
                darkColor="#B9652B"
                icon={MdMenuBook}
              />
            </div>

            <div className="bg-white w-full lg:w-3/5 xl:w-1/2 place-self-center rounded-xl shadow-sm border border-[#EBECF1] p-6 mb-8">
              {!submissionData ? (
                <>
                  <h2 className="text-2xl font-bold text-[#102E50] mb-4">Submit Your Work</h2>
                  
                  {!hasActiveReopen && isOverdue && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md border border-red-300">
                      ⚠️ This assignment is past the due date. Submission is no longer allowed.
                    </div>
                  )}

                  {hasActiveReopen && !isOverdue && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md border border-blue-300">
                      📅 Extended deadline active. New due date: {formattedDue}
                      {reopenData.reason && (
                        <div className="mt-1 text-sm">
                          <strong>Reason:</strong> {reopenData.reason}
                        </div>
                      )}
                    </div>
                  )}

                  {(hasActiveReopen || !isOverdue) && (
                    <>
                      <FileUploader
                        type=".pdf, .doc, .docx"
                        handleFileChange={handleFileChange}
                      />

                      {successMessage && (
                        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                          ✓ {successMessage}
                        </div>
                      )}
                      {uploadError && (
                        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                          ✗ {uploadError}
                        </div>
                      )}

                      {isSubmitting && uploadProgress > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-[#102E50] h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-6">
                    {(!hasActiveReopen && isOverdue) ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-medium cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                      >
                        <MdFileUpload /> Submission Closed (Past Due)
                      </button>
                    ) : (
                      <>
                        <ClassicButton 
                          buttonName={isSubmitting ? "Submitting..." : "Submit File"}
                          onClick={handleSubmit}
                          className="w-full shadow-md"
                          mainColor="#102E50" 
                          darkColor="#0B2239"
                          icon={isSubmitting ? null : MdFileUpload}
                          disabled={isSubmitting || !file}
                        />
                        {isSubmitting && uploadProgress === 0 && (
                          <p className="text-center text-sm text-gray-500 mt-2">
                            Preparing upload, please wait...
                          </p>
                        )}
                        {file && file.size > 5 * 1024 * 1024 && (
                          <p className="text-center text-sm text-yellow-600 mt-2">
                            Large file detected - upload may take a moment
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[#102E50] mb-4">Your Submission</h2>
                  
                  {isOverdue && submissionData.status === "submitted" && (
                    <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-300">
                      ⚠️ This submission was made after the due date.
                    </div>
                  )}
                  
                  <p className="text-[#102E50]/80 font-semibold mb-6">
                    You already submitted this task.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <ClassicButton 
                      buttonName="View File"
                      onClick={() => setViewSubmittedFile(true)}
                      className="shadow-md"
                      mainColor="#102E50" 
                      darkColor="#0B2239"
                      icon={MdVisibility}
                    />

                    {(hasActiveReopen || !isOverdue) ? (
                      <ClassicButton 
                        buttonName="Unsubmit"
                        onClick={handleUnsubmit}
                        className="shadow-md"
                        mainColor="#8E1616" 
                        darkColor="#660F0F"
                        icon={MdOutlineCancel}
                      />
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-medium cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                      >
                        <MdOutlineCancel /> Unsubmit Not Allowed (Past Due)
                      </button>
                    )}
                  </div>

                  {unsubmitError && <p className="text-red-800 mb-4">{unsubmitError}</p>}
                  
                  <div className="bg-[#EBECF1]/30 p-4 rounded-lg border border-[#206A5D]/20 mb-4">
                    {submissionData.score != null ? (
                      <p className="text-[#206A5D] font-bold text-lg">
                        Score: {submissionData.score} / {materialData.totalScore}
                      </p>
                    ) : (
                      <p className="text-[#206A5D] font-semibold">
                        Total Score: {materialData.totalScore} points
                      </p>
                    )}
                  </div>

                  {submissionData && submissionData.remarks != null && (
                    <div className="mt-4 p-4 bg-[#102E50]/5 rounded-lg border-l-4 border-[#102E50]">
                      <h2 className="text-[#102E50] font-bold text-lg flex items-center gap-2 mb-2">
                        <MdOutlineComment /> Remarks:
                      </h2>
                      <p className="text-[#102E50]/80 italic">"{submissionData.remarks}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showReopenModal && (
        <TaskReopenModal
          materialId={materialData.materialId}
          onClose={() => setShowReopenModal(false)}
          onSuccess={() => {
            fetchSubmissionStats();
          }}
        />
      )}
    </div>
  );
}