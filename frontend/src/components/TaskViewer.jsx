import { useState, useEffect } from "react";
import { MdEdit, MdArchive, MdFileUpload, MdMenuBook, MdCalendarToday, 
  MdOutlineComment, MdOutlineCancel, MdVisibility, MdPerson } from "react-icons/md";
import { LuClipboardCheck } from "react-icons/lu";
import FileView from "../pages/Lesson/FileView";
import FileUploader from "./FileUploader";
import useUserStore from "../store/useUserStore";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClassicButton from "./classicButton";

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
        `${import.meta.env.VITE_API_URL}/student_submission/check/${materialData.materialId}/${userId}`
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
        `${import.meta.env.VITE_API_URL}/student_submission/stats/${materialData.materialId}`
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
        `${import.meta.env.VITE_API_URL}/student_submission/upload`,
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
        `${import.meta.env.VITE_API_URL}/student_submission/unsubmit/${submissionData.id}`
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
            className="bg-[#102E50] text-white px-4 py-2 rounded-md hover:bg-[#1b3a63] xl:text-lg p-2"
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
  <div className="w-full h-auto grid grid-cols-1 xl:grid-cols-[3fr_2fr] 
          py-[10px] xl:px-[20px] gap-4"
  >
    {/* Material */}
    
      <div className="child w-full flex flex-col rounded-2xl bg-white
              h-auto p-[25px] pb-12 shadow-lg
              backdrop-blur-lg relative overflow-hidden"
      >
        
        <div className="absolute h-[2%] w-full bg-black/10 bottom-0 left-0"></div>

        
        <div className="relative z-10 flex flex-col h-full">
          {uploadError && <p className="text-red-800">{uploadError}</p>}

          <h2 className="font-bold text-2xl md:text-4xl text-[#102E50] truncate mb-1">
            {materialData.title}
          </h2>

          <p className="text-base md:text-lg leading-tight text-[#102E50]/80 mb-12">
            {materialData.description}
          </p>

          <p className="text-[#E78B48]/90 flex justify-items 
                        items-center gap-2 text-sm md:text-lg self-end mb-2"
          >
            <MdCalendarToday/> Due: {formattedDue}
          </p>

          <hr className="h-px bg-[#102E50]/50 border-0 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-2">
            <ClassicButton 
              buttonName="View Material"
              className="shadow-md w-full 2xl:w-3/4"
              onClick={() => setIsVisible(true)}
              mainColor="#E78B48" 
              darkColor="#B9652B"
              icon={MdMenuBook}
            />
            
            {userRole === "teacher" && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 items-end justify-end self-end gap-2  
                              mt-2 md:mt-0">
                <ClassicButton 
                  buttonName="Edit"
                  className="shadow-md text-md"
                  onClick={() => setEditMaterialOpen(true)}
                  mainColor="#183D65" 
                  darkColor="#102E50"
                  icon={MdEdit}
                />

                <ClassicButton 
                  buttonName="Archive"
                  className="shadow-md text-md"
                  onClick={() => setArchiveMaterialOpen(true)}
                  mainColor="#C53030" 
                  darkColor="#8E1616"
                  icon={MdArchive}
                />
              </div>
            )}
          </div>
        </div>
    </div>
    

    {/* Submit */}
    <div className="xl:max-h-[500px] flex 2xl:justify-end ">

      {userRole === "teacher" && (
        <div className="child w-full md:w-1/2 xl:w-full 2xl:w-4/5 h-auto shadow-2xl rounded-xl 
                bg-[#102E50] flex flex-col p-[20px] pb-10 gap-0 relative overflow-hidden"
        >
          
          <div className="absolute h-[3%] w-full bg-black/10 bottom-0 left-0"></div>

          
          <div className="relative z-10 flex flex-col gap-8 h-auto justify-center">

            <div className="w-full flex h-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl py-8 px-4 border border-white/20 flex gap-12 w-full flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="bg-[#E78B48] p-2 rounded-lg">
                      <MdPerson className="text-[#102E50] text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">----</p>
                      <p className="text-[10px] uppercase tracking-tighter text-[#EBECF1]">Pending</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[#E78B48] p-2 rounded-lg">
                      <MdPerson className="text-[#102E50] text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                      <p className="text-[10px] uppercase tracking-tighter text-[#EBECF1]">Submissions</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#E78B48] p-2 rounded-lg">
                      <MdPerson className="text-[#102E50] text-xl" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.scoredSubmissions}</p>
                      <p className="text-[10px] uppercase tracking-tighter text-[#EBECF1]">Graded</p>
                    </div>
                </div>
                
              </div>
            </div>

            <ClassicButton 
              buttonName="View Submissions"
              className="shadow-md w-full text-md mt-auto"
              onClick={() => navigate(`/submissions/${materialData.materialId}`)}
              mainColor="#E78B48" 
              darkColor="#B9652B"
              icon={LuClipboardCheck}
            />

          </div>
        </div>
      )}

      {userRole === "student" && (
        <div className="child w-full sm:w-1/2 xl:w-full 2xl:w-4/5 h-auto shadow-md rounded-xl bg-[#F4F6FF] 
                        flex flex-col p-[15px] 2xl:px-[20px] pb-10 gap-5 relative overflow-hidden
                        "
        >
          
          <div className="absolute h-[2%] w-full bg-black/10 bottom-0 left-0"></div>

          
          <div className="relative z-10 flex flex-col gap-4">
            {!submissionData ? (
              <>
                <FileUploader
                  type=".pdf, .doc, .docx"
                  handleFileChange={handleFileChange}
                />

                <ClassicButton 
                  buttonName="Submit File"
                  onClick={handleSubmit}
                  className="w-full shadow-md"
                  mainColor="#102E50" 
                  darkColor="#0B2239"
                  icon={MdFileUpload}
                />
              </>
            ) : (
              <>
                <h2 className="text-[#102E50] font-bold text-2xl md:text-3xl xl:text-4xl">Your Work</h2>
                <p className="text-[#102E50]/80 font-semibold md:text-md lg:text-lg xl:text-xl">
                  You already submitted this task.
                </p>

                <div className="w-full flex gap-2">
                  <ClassicButton 
                    buttonName="View File"
                    onClick={() => setViewSubmittedFile(true)}
                    className="flex-1 shadow-md"
                    mainColor="#102E50" 
                    darkColor="#0B2239"
                    icon={MdVisibility}
                  />

                  <ClassicButton 
                    buttonName="Unsubmit"
                    onClick={handleUnsubmit}
                    className="flex-1 shadow-md"
                    mainColor="#8E1616" 
                    darkColor="#660F0F"
                    icon={MdOutlineCancel}
                  />
                </div>

                {unsubmitError && <p className="text-red-800">{unsubmitError}</p>}
                
                <div className="bg-white/50 p-3 rounded-lg border border-[#206A5D]/20">
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
              </>
            )}

            {submissionData && submissionData.remarks != null && (
              <div className="mt-2 p-3 bg-[#102E50]/5 rounded-lg border-l-4 border-[#102E50]">
                <h2 className="text-[#102E50] font-bold text-lg flex items-center gap-1">
                  <MdOutlineComment /> Remarks:
                </h2>
                <p className="text-[#102E50]/80 italic">"{submissionData.remarks}"</p>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
    
</div>
);


}
