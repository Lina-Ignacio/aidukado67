import FileUploader from "../../components/FileUploader";
import { useState, useEffect } from "react";
import useClassStore from "../../store/useClassStore";
import axios from "axios";

import { FaExclamationCircle, FaCloudUploadAlt, FaTimes, FaHeading, FaTag, FaPen, FaChevronDown, FaAlignLeft, 
FaStar, FaChartBar, FaCalendarAlt, FaClock } from 'react-icons/fa';

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


  return (


<form
  className="flex flex-col w-full h-auto gap-4 text-left rounded-2xl bg-gray-50 px-6 py-8 shadow-xl border border-gray-200"
>
  {uploadError && (
    <div className="flex items-center p-3 mb-2 rounded-lg bg-red-50 border border-red-200">
      <FaExclamationCircle className="text-red-500 mr-3" />
      <p className="text-red-800 font-medium">{uploadError}</p>
    </div>
  )}
  
  <div className="mb-2">
    <FileUploader type=".pdf, .doc, .docx" handleFileChange={handleFileChange} />
  </div>

  <div className="space-y-1">
    <label className="text-sm font-semibold text-[#102E50] mb-1">
      Title
    </label>
    <div className="relative">
      <input
        className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400"
        value={metaData.title}
        placeholder="Enter the material name"
        onChange={(e) => setMetaData((prev) => ({ ...prev, title: e.target.value }))}
      />
      <FaPen className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
    </div>
  </div>

  <div className="space-y-1">
    <label className="text-sm font-semibold text-[#102E50] mb-1">
      Type
    </label>
    <div className="relative">
      <select
        name="type"
        value={metaData.type}
        onChange={(e) => setMetaData((prev) => ({ ...prev, type: e.target.value }))}
        className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 appearance-none pr-10"
      >
        <option value="lesson">Lesson</option>
        <option value="activity">Activity</option>
        <option value="assignment">Assignment</option>
        <option value="project">Project</option>
      </select>
      <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
    </div>
  </div>

  <div className="space-y-1">
    <label className="text-sm font-semibold text-[#102E50] mb-1">
      Description
    </label>
    <textarea
      className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-y"
      value={metaData.description}
      onChange={(e) => setMetaData((prev) => ({ ...prev, description: e.target.value }))}
      placeholder="Describe this material..."
      rows={4}
    />
  </div>

  {metaData.type != "lesson" && (
    <div className="space-y-4 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <div className="space-y-1">
        <label className="flex items-center text-sm font-semibold text-[#102E50] mb-1">
          <FaStar className="mr-2 text-sm" />Total Score
        </label>
        <div className="relative">
          <input
            className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 placeholder-gray-400"
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
          <FaChartBar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center text-sm font-semibold text-[#102E50] mb-1">
          <FaCalendarAlt className="mr-2 text-sm" />Due Date
        </label>
        <div className="relative">
          <input
            className="w-full border border-gray-300 bg-white text-[#102E50] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E78B48] focus:border-transparent transition-all duration-200 pr-10"
            type="datetime-local"
            value={metaData.dueDate || ""}
            onChange={(e) => setMetaData((prev) => ({ ...prev, dueDate: e.target.value }))}
            step="60"
          />
          <FaClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        </div>
      </div>
    </div>
  )}

  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
    <button
      onClick={() => setIsOpen(false)}
      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white font-semibold text-[#102E50] rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-95 shadow-sm"
      type="button"
    >
      <FaTimes className="mr-1" />CANCEL
    </button>
    <button
      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#102E50] text-white font-semibold rounded-lg border border-[#102E50] transition-all duration-200 hover:bg-[#0e2642] hover:shadow-md active:scale-95 shadow"
      onClick={handleUpload}
    >
      <FaCloudUploadAlt className="mr-1" />UPLOAD
    </button>
  </div>
</form>
  );
}




