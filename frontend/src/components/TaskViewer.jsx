import { useState, useEffect } from "react";
import { MdEdit, MdArchive, MdFileUpload, MdMenuBook, MdCalendarToday, 
  MdOutlineComment, MdOutlinePreview, MdOutlineCancel, MdVisibility } from "react-icons/md";
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
  <div className="w-full h-auto grid xl:grid-cols-[3fr_2fr] py-[10px] xl:px-[80px] ">
    {/* Material */}
    <div className="xl:max-h-[600px] p-[25px] xl:p-[60px]">
      <div className="child w-full flex flex-col rounded-2xl
              gap-5 h-auto p-[25px] bg-[#F4F6FF] border border-black/10 "
      >
        {uploadError && <p className="text-red-800">{uploadError}</p>}

        <h2 className="font-bold text-2xl md:text-4xl text-[#102E50]">
          {materialData.title}
        </h2>

        <p className="text-base md:text-xl text-[#102E50]/80">
          {materialData.description}
        </p>

        <p className="text-[#F5C45E]/90 font-bold flex justify-items 
              items-center gap-2 text-sm md:text-lg"
        >
          <MdCalendarToday/> Due: {formattedDue}
        </p>

        <hr className="h-[1px] bg-[#102E50] border-0" />

        <div className="flex w-full h-[50px]">
          <button
            onClick={() => setIsVisible(true)}
            className="bg-[#102E50] hover:bg-[#0B2239] text-white py-3 rounded-lg font-semibold 
              transition-colors duration-200 flex justify-items items-center gap-2"
          >
            <MdMenuBook className="text-lg lg:text-xl xl:text-2xl text-white"/>
            <span className="text-md lg:text-lg">Open</span>
          </button>

          
          {userRole === "teacher" && (
            <div className="flex items-end justify-end self-end w-1/2 gap-2 ml-auto">
              <button
                className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#F5C45E] py-3"
                onClick={() => setEditMaterialOpen(true)}
              >
                <MdEdit size={24} />
              </button>

              <button
                className="sm:h-[50px] rounded-lg flex items-center justify-center bg-[#BE3D2A] py-3"
                onClick={() => setArchiveMaterialOpen(true)}
              >
                <MdArchive size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Submit */}
    <div className="xl:max-h-[500px] p-[25px] xl:py-[60px]">

      {userRole === "teacher" && (
        <div className="child w-full xl:w-4/5 h-auto shadow-md rounded-xl bg-[#F4F6FF] 
                border border-black/10 flex flex-col p-[25px]">

          <h2 className="text-[#F5C45E] font-bold text-md xl:text-lg">Submitted: <span className="font-semibold text-[#102E50]">{stats.totalSubmissions}</span></h2>
          <h2 className="text-[#F5C45E] font-bold text-md xl:text-lg">Graded: <span className="font-semibold text-[#102E50]">{stats.scoredSubmissions}</span></h2>
          
          <button 
            className="bg-[#102E50] text-white py-2 rounded-md hover:bg-[##0B2239]
                      flex justify-center items-center gap-2 mt-5 w-full"
            onClick={() => navigate(`/submissions/${materialData.materialId}`)}
          >
            <span className="text-md lg:text-lg">View Submissions</span>
          </button>
        </div>
      )}

      {userRole === "student" && (
        <div className="child w-full sm:w-1/2 xl:w-full 2xl:w-4/5 h-auto shadow-md rounded-xl bg-[#F4F6FF] 
                border border-black/10 flex flex-col p-[15px] 2xl:px-[20px] gap-5"
        >
            {!submissionData ? (
              <>
                <FileUploader
                  type=".pdf, .doc, .docx"
                  handleFileChange={handleFileChange}
                />

                <button
                  onClick={handleSubmit}
                  className="bg-[#102E50] text-white py-2 rounded-md hover:bg-[##0B2239]
                      flex justify-center items-center gap-2"
                >
                  <MdFileUpload className="text-lg lg:text-xl xl:text-2xl text-white"/>
                  <span className="text-md lg:text-lg">Submit File</span>
                </button>
              </>
            ) : (
              <>
                <h2 className="text-[#102E50] font-bold text-2xl md:text-3xl xl:text-4xl">Your Work</h2>
                <p className="text-[#102E50]/80 font-semibold md:text-md lg:text-lg xl:text-xl">
                  You already submitted this task.
                </p>

                <div className="w-full flex gap-2">
                  <button
                    onClick={() => setViewSubmittedFile(true)}
                    className="bg-[#102E50] text-white px-4 py-2 rounded-md hover:bg-[#0B2239] 
                      flex items-center justify-items gap-2 transition"
                  >
                    <MdVisibility className="text-lg lg:text-xl xl:text-2xl text-white"/>
                    <span className="text-md lg:text-lg">View File</span>
                  </button>

                  <button
                    onClick={handleUnsubmit}
                    className="bg-red-600 text-white rounded-md
                      flex items-center justify-items gap-2"
                  >
                    <MdOutlineCancel className="text-lg lg:text-xl xl:text-2xl text-white" />
                    <span className="text-md lg:text-lg">Unsubmit</span>
                  </button>
                </div>

                {unsubmitError && <p className="text-red-800">{unsubmitError}</p>}

                
                {submissionData.score != null ? (
                  <p className="text-[#206A5D] font-semibold">
                    Score: {submissionData.score}/{materialData.totalScore}
                  </p>
                ) : (
                  <p className="text-[#206A5D] font-semibold">
                    Total Score: {materialData.totalScore} points
                  </p>
                )}
              </>
            )}

            

            {submissionData &&
            submissionData.remarks != null && (
              <>
                <h2 className="text-[#102E50] font-bold text-lg self-center flex justify-items items-center gap-1"><MdOutlineComment />Remarks:</h2>
                <p className="text-[#102E50]/80">{submissionData.remarks}</p>
              </>
            )}
          
        </div>
        
      )}
      
    </div>
    
</div>
);


}
