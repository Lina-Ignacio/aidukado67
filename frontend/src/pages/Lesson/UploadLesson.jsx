import FileUploader from "../../components/FileUploader";
import { useState, useEffect } from "react";
import useClassStore from "../../store/useClassStore";
import axios from "axios";

export default function UploadLesson({ setIsOpen, onSuccess, term, setSuccessMessage }) {
  const classId = useClassStore((state) => state.classId);
  const [uploadError, setUploadError] = useState("");
  const [file, setFile] = useState(null);

  const [metaData, setMetaData] = useState({
    classId: classId,
    termId: term,
    title: "",
    description: "",
    type: "lesson",      
    totalScore: null,    
    dueDate: null        
  });

  useEffect(() => {
    setMetaData((prev) => ({
      ...prev,
      termId: term,
    }));
  }, [term]);

  const maxFileSize = 20 * 1024 * 1024;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > maxFileSize) {
      alert("File size exceeds 5 MB. Please upload a smaller file.");
      e.target.value = "";
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file first!");
      return;
    }

    if (!metaData.title.trim()) {
      setUploadError("Please enter a title!");
      return;
    }

    if (!metaData.termId) {
      setUploadError("Invalid term selected!");
      return;
    }

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metaData));
    formData.append("file", file);

    try {
      const baseUrl = `${import.meta.env.VITE_API_URL}`;
      const url = `${baseUrl}/class_material/upload`;

      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage(response.data.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.data?.detail) {
        setUploadError(err.response.data.detail);
      } else {
        setUploadError("Network Error");
      }
    }
  };

  const inputClass =`w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200`;
  const labelClass = "text-[#102E50] font-bold opacity-75";

  return (
    <form
      className="flex flex-col justify-center w-full h-auto gap-3
       text-left rounded-2xl bg-[#F4F6FF] px-4 py-8 shadow-2xl"
    >
      {uploadError && <p className="text-red-800">{uploadError}</p>}
      <FileUploader type=".pdf, .doc, .docx" handleFileChange={handleFileChange} />

      <label className={labelClass}>Title</label>
      <input
        className={inputClass}
        value={metaData.title}
        placeholder="Enter the name"
        onChange={(e) => setMetaData((prev) => ({ ...prev, title: e.target.value }))}
      />

      <label className={labelClass}>Type</label>
      <select
        name="type"
        value={metaData.type}
        onChange={(e) => setMetaData((prev) => ({ ...prev, type: e.target.value }))}
        className={inputClass}
      >
        <option value="lesson">Lesson</option>
        <option value="activity">Activity</option>
        <option value="assignment">Assignment</option>
        <option value="project">Project</option>
      </select>

      <label className={labelClass}>Description</label>
      <textarea
        className="w-full h-[20%] border-solid border border-[#C9CCD5] bg-transparent text-[#102E50] p-[1%] rounded-md shadow-md"
        value={metaData.description}
        onChange={(e) => setMetaData((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Describe this material"
        rows={3}
        cols={5}
      />

      {metaData.type != "lesson" && (
        <>
            <label className={labelClass}>Total Score</label>
            <input
                className={inputClass}
                type="number"
                value={metaData.totalScore || ""}
                placeholder="Enter total score"
                onChange={(e) =>
                setMetaData((prev) => ({
                    ...prev,
                    totalScore: e.target.value ? parseInt(e.target.value) : null,
                }))
                }
            />

            <label className={labelClass}>Due Date</label>
            <input
                className={inputClass}
                type="datetime-local"
                value={metaData.dueDate || ""}
                onChange={(e) => setMetaData((prev) => ({ ...prev, dueDate: e.target.value }))}
                step="60" 
            />
        </>
      )}


      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => setIsOpen(false)} 
          className="w-1/2 mt-[1%] bg-[#EBEBEB] font-bold text-[#102E50] transition-transform duration-200 
                hover:scale-95 shadow-md text-md xl:text-lg p-2" 
          type="button"
        >
          CANCEL
        </button>
        <button 
          className="w-1/2 mt-[1%] bg-[#10375C] text-white transition-transform duration-200 
              hover:scale-95 shadow-md text-md xl:text-lg p-2" 
          onClick={handleUpload}
        >
          UPLOAD
        </button>
      </div>
    </form>
  );
}




