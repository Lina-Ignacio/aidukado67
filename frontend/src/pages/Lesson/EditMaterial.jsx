import FileUploader from "../../components/FileUploader";
import { useState, useEffect } from "react";
import useClassStore from "../../store/useClassStore";
import axios from "../../services/axiosConfig";

export default function EditMaterial({materialId, setEditMaterialOpen, setSuccessMessage, onSuccess}) {

  const [metaData, setMetaData] = useState({});
  const [file, setFile] = useState(null)

  // Error and Message
  const [fetchError, setFetchError] = useState("");
  const [updateError, setUpdateError] = useState("");
  

  const getMaterialInfo = async() => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/class_material/getMaterialById/${materialId}`)
      setMetaData(response.data);
      setFetchError("");
    }catch(err) {
      setFetchError(err.response?.data?.detail ?? "Network Error");
    }
  }
  
  useEffect(() => {
    getMaterialInfo();
  }, [materialId])


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

  const handleUpdate = async(e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metaData));
      if (file) formData.append("file", file); 
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/class_material/updateMaterial/${materialId}`, formData, {
        headers : {"Content-Type" : "multipart/form-data"}
      })

      setSuccessMessage(response.data.message)
      setUpdateError("");
      if (onSuccess) onSuccess();
    }catch(err) {
      setUpdateError(err.response?.data?.detail ?? "Network Error");
    }
  }

  const inputClass= "w-full h-auto border-solid border border-[#C9CCD5] bg-transparent text-[#102E50] p-2 rounded-md shadow-md mb-4";
  const labelClass= "text-[#102E50] font-bold opacity-75 mb-2";

  return (
      <form
            className="flex flex-col justify-center w-full h-auto gap-[2%] text-left rounded-2xl bg-[#F4F6FF] p-4 shadow-2xl"
          >
            

            <label className={labelClass}>(Optional)</label>
            <FileUploader type=".pdf, .doc, .docx" handleFileChange={handleFileChange} />
            <span className="mt-8 mb-4">
              {fetchError && <p className="text-red-800">{fetchError}</p>}
              {updateError && <p className="text-red-800">{updateError}</p>}
            </span>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={metaData.title || ""}
              placeholder="Enter the name"
              onChange={(e) => setMetaData((prev) => ({ ...prev, title: e.target.value }))}
            />
      
            <label className={labelClass}>Type</label>
            <select
              name="type"
              value={metaData.type || ""}
              onChange={(e) => setMetaData((prev) => ({ ...prev, type: e.target.value }))}
              className={inputClass}
            >
              <option value="lesson">Lesson</option>
              <option value="experiment">Experiment / Exercise</option>
              <option value="activity">Assignment / Activity</option>
              <option value="project">Project / Case Study</option>
            </select>
      
            <label className={labelClass}>Description</label>
            <textarea
              className="w-full h-auto border-solid border border-[#C9CCD5] bg-transparent text-[#102E50] p-[1%] rounded-md shadow-md"
              value={metaData.description || ""}
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
      
      
            <div className="flex gap-2 mt-4 mb-8">
              <button 
                onClick={() => setEditMaterialOpen(false)} 
                className="bg-gray-300 w-1/2 xl:text-lg p-2 text-[#102E50]" 
                type="button"
              >
                CANCEL
              </button>
              <button 
                className="bg-[#102E50] w-1/2 xl:text-lg p-2" 
                onClick={handleUpdate}
              >
                UPDATE
              </button>
            </div>
          </form>
  );
}
