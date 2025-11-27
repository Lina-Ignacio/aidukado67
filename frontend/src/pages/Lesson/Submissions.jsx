import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import StudentSubmissionCard from "../../components/classMaterials/studentSubmissionCard";
import FileView from "./FileView";

export default function Submissions() {
  const { materialId } = useParams();
  const [submissions, setSubmissions] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch submissions for this material
  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/student_submission/material/${materialId}`
      );

      setSubmissions(response.data);
      setCurrentPage(1); // reset to first page when loading new records

    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [materialId]);

  // Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSubmissions = submissions.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(submissions.length / itemsPerPage);


  //for file viewing

  const [openFile, setOpenFile] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const onClick = async (submission) => {
    setSelectedSubmission(submission)
    const response = await axios.get(`http://localhost:8000/student_submission/get_url/${submission.id}`)
    setFileUrl(response.data.url)
    console.log("hello", response.data.url)
    setOpenFile(true);
  }

  
  const getExtension = (url) => {
    if (!url) return null;
    const cleanUrl = url.split("?")[0]; 
    return cleanUrl.split(".").pop().toLowerCase();
  };

  const fileExtension = getExtension(fileUrl);

  //for score and remark
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
      const payload = {
        score: score ? Number(score) : null,
        remarks: remarks || null,
        status: "graded",
      };

      await axios.patch(
        `http://localhost:8000/student_submission/update_score/${selectedSubmission.id}`,
        payload
      );

      // Refresh submissions list
      fetchSubmissions();

      alert(isGraded ? "Updated successfully!" : "Submitted successfully!");

    } catch (err) {
      console.error(err);
      alert("Failed to submit grade.");
    }
  };

  return (
    <div className="w-full h-full grid grid-cols-[2.5fr_1fr] gap-x-5">
      <div className="grid grid-rows-[6fr_1fr]">

        {openFile && fileUrl ? (
          <FileView 
            fileExtension={fileExtension}
            fileUrl={fileUrl} 
          />
        ) : (
          <p className="text-[#102E50] self-center font-bold text-[2.5rem] justify-self-center">Select a student to view their submission.</p>
        )}

        <div className="p-1 rounded flex flex-col gap-4">
            <textarea
                className="w-full h-1/2 p-2 rounded outline-none bg-[#F4F6FF] placeholder-[#102E50] text-[#102E50]"
                placeholder="Remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="flex items-center gap-4">
                <input
                    type="number"
                    className="w-24 p-2 rounded outline-none bg-[#F4F6FF] placeholder-[#102E50] text-[#102E50]"
                    placeholder="Score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                />

                <button 
                  onClick={handleSubmitGrade}
                  className="px-6 py-2 bg-[#102E50] text-white rounded font-bold"
                >
                    {isGraded ? "UPDATE" : "SUBMIT"}
                </button>
            </div>

        </div>
    </div>

      {/* LEFT SIDE – list of students */}
      <div className="p-4 overflow-y-auto flex flex-col gap-4 bg-[#F5C45E]">
        <h2 className="font-bold text-[#102E50] text-xl">LIST OF STUDENTS</h2>

        {currentSubmissions.length > 0 ? (
          currentSubmissions.map((submission) => (
            <StudentSubmissionCard
              key={submission.id}
              submission={submission}
              onClick={onClick}
            />
          ))
        ) : (
          <p className="text-white">No submissions found.</p>
        )}

        {/* Pagination */}
        {submissions.length > itemsPerPage && (
          <div className="flex justify-center gap-3 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1 bg-[#102E50] text-white rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-white font-bold">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1 bg-[#102E50] text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

    



    </div>
  );
}
