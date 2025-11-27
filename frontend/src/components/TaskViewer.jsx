import { useState, useEffect } from "react";
import { MdEdit, MdArchive } from "react-icons/md";
import FileView from "../pages/Lesson/FileView";
import FileUploader from "./FileUploader";
import useUserStore from "../store/useUserStore";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  const [stats, setStats] = useState(
    {
      totalSubmissions : null,
      scoredSubmissions : null
    }
  )

  const navigate = useNavigate();

  const userId = useUserStore((state) => state.userId);
  const userRole = useUserStore((state) => state.userRole);

  const metaData = {
    materialId: materialData.materialId,
    type: materialData.materialType,
    studentId: userId,
  };

  // ✅ Check submission
  const checkSubmission = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/student_submission/check/${materialData.materialId}/${userId}`
      );

      if (response.data) {
        setSubmissionData(response.data);
        console.log("hello", response.data)
      } else {
        setSubmissionData(null);
      }
      console.log(response.data);
    } catch (err) {
      console.error("Error checking submission:", err);
    }
  };

  // for statss
  const fetchSubmissionStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/student_submission/stats/${materialData.materialId}`
      );

      if (response.data) {
        setStats({
          totalSubmissions: response.data.total_submissions,
          scoredSubmissions: response.data.scored_submissions,
        });
      } else {
        setStats({
          totalSubmissions: null,
          scoredSubmissions: null,
        });
      }

      console.log("Stats:", response.data);
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
    } else if (userRole === "teacher") {
      fetchSubmissionStats()
    }
  }, []);

  const maxFileSize = 20 * 1024 * 1024;
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > maxFileSize) {
      alert("File size exceeds 20 MB. Please upload a smaller file.");
      e.target.value = "";
      return;
    }
    setFile(selectedFile);
  };

  // ✅ Submit file
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to submit.");

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metaData));
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/student_submission/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMessage(response.data.message);
      setUploadError("");
      setFile(null);
      checkSubmission();
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Network Error");
    }
  };

  // ✅ Unsubmit file
  const handleUnsubmit = async () => {
    if (!submissionData) return;
    try {
      await axios.patch(
        `http://localhost:8000/student_submission/unsubmit/${submissionData.id}`
      );
      setSuccessMessage("Submission removed successfully.");
      setSubmissionData(null);
      setFile(null);
    } catch (err) {
      setUnsubmitError(err.response?.data?.detail || "Network or unknown error occurred");
    }
  };
  

  // ✅ View Material
  if (isVisible) {
    return (
      <div className="sm:w-3/5 sm:h-auto">
        <FileView
          fileExtension={materialData.fileExtension}
          fileUrl={materialData.fileUrl}
        />
      </div>
    );
  }

  // ✅ View Submitted File
  if (viewSubmittedFile && submissionData) {
    const fileExtension = submissionData.filePath?.split('?')[0].split('.').pop().toLowerCase();
    return (
      <div className="sm:w-3/5 sm:h-auto">
        <FileView
          fileExtension={fileExtension}
          fileUrl={submissionData.filePath}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => setViewSubmittedFile(false)}
            className="bg-[#102E50] text-white px-4 py-2 rounded-md hover:bg-[#1b3a63]"
          >
            Close File
          </button>
        </div>
      </div>
    );
  }

  const due = new Date(materialData.dueDate);

  const formattedDue = due.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

return (
  <div className="w-full h-full flex flex-col items-center p-2">
    
    <div className="w-3/4 h-2/5 flex gap-5 mt-8">

      <div className="child sm:w-3/4 sm:h-4/5 flex flex-col sm:min-h-[250px] rounded-md p-4 gap-5 bg-white">
        {uploadError && <p className="text-red-800">{uploadError}</p>}

        <h2 className="sm:w-full font-bold text-3xl text-[#102E50]">
          {materialData.title}
        </h2>

        <p className="sm:min-h-[30px] text-lg text-[#102E50]">
          {materialData.description}
        </p>

        <p className="text-md text-[#F5C45E] font-bold">
          Due: {formattedDue}
        </p>

        <hr className="h-[1px] bg-[#102E50] border-0" />

        <div className="flex w-full h-[50px]">
          <button
            onClick={() => setIsVisible(true)}
            className="w-1/3 bg-[#102E50] hover:bg-[#1b3a63] 
              text-white py-3 rounded-lg font-semibold 
              transition-colors duration-200"
          >
            Open Material
          </button>

          
          {userRole === "teacher" && (
            <div className="flex items-end justify-end self-end w-1/2 gap-2 ml-auto">
              <button
                className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#F5C45E]"
                onClick={() => setEditMaterialOpen(true)}
              >
                <MdEdit size={24} />
              </button>

              <button
                className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#BE3D2A]"
                onClick={() => setArchiveMaterialOpen(true)}
              >
                <MdArchive size={24} />
              </button>
            </div>
          )}
        </div>
      </div>

      
      {userRole === "student" && (
        <div className="child sm:w-1/4 sm:h-3/5 shadow-md rounded-xl bg-[#F4F6FF] p-4 gap-5 border border-black/10">
          <div className="flex flex-col gap-4 w-full h-full items-start">

            
            {!submissionData ? (
              <>
                <FileUploader
                  type=".pdf, .doc, .docx"
                  handleFileChange={handleFileChange}
                />

                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#102E50] text-white py-2 rounded-md hover:bg-[#1b3a63]"
                >
                  Submit File
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[#102E50] font-bold text-3xl">Your Work</h2>
                <p className="text-[#F5C45E] font-semibold">
                  You already submitted this task.
                </p>

                <div className="w-full flex gap-2">
                  <button
                    onClick={() => setViewSubmittedFile(true)}
                    className="w-1/2 h-full bg-[#102E50] text-white px-4 py-2 rounded-md hover:bg-[#1b406f] transition"
                  >
                    View File
                  </button>

                  <button
                    onClick={handleUnsubmit}
                    className="w-1/2 h-full bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Unsubmit
                  </button>
                </div>

                {unsubmitError && <p className="text-red-800">{unsubmitError}</p>}

                
                {submissionData.score != null ? (
                  <p className="text-[#F5C45E] font-semibold">
                    Score: {submissionData.score}/{materialData.totalScore}
                  </p>
                ) : (
                  <p className="text-[#F5C45E] font-semibold">
                    Total Score: {materialData.totalScore} points
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {userRole === "teacher" && (
        <div className="child sm:w-1/4 sm:h-2/5 shadow-md rounded-xl bg-[#F4F6FF] p-4 gap-5 border border-black/10 mt-5">
          <h2 className="text-[#F5C45E] font-bold text-md">Submitted: <span className="font-semibold text-[#102E50]">{stats.totalSubmissions}</span></h2>
          <h2 className="text-[#F5C45E] font-bold text-md">Graded: <span className="font-semibold text-[#102E50]">{stats.scoredSubmissions}</span></h2>
          <button 
            className="mt-5 bg-[#102E50]"
            onClick={() => navigate(`/submissions/${materialData.materialId}`)}
          >
            View Submissions
          </button>
        </div>
      )}
    </div>

    
    {userRole === "student" &&
      submissionData &&
      submissionData.remarks != null && (
        <div className="child sm:w-3/4 shadow-md sm:h-auto rounded-xl p-4 bg-[#F4F6FF] border border-black/10 mt-5">
          <h2 className="text-[#F5C45E] font-bold text-lg">Remarks:</h2>
          <p className="text-[#102E50]">{submissionData.remarks}</p>
        </div>
    )}

  </div>
);


}
