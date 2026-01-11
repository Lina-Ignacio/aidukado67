import FileUploader from "../../components/FileUploader";
import { useState, useEffect } from "react";
import useClassStore from "../../store/useClassStore";
import axios from "axios";

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

  const inputClass= "w-full sm:h-[6%] border-solid border border-[#C9CCD5] bg-transparent text-[#102E50] p-[1%] rounded-md shadow-md";
  const labelClass= "text-[#102E50] font-bold opacity-75";

  return (
      <form
            className="flex flex-col justify-center w-full h-full gap-[2%] text-left rounded-2xl bg-[#F4F6FF] p-4 shadow-2xl"
          >
            {fetchError && <p className="text-red-800">{fetchError}</p>}
            {updateError && <p className="text-red-800">{updateError}</p>}

            <label className={labelClass}>(Optional)</label>
            <FileUploader type=".pdf, .doc, .docx" handleFileChange={handleFileChange} />
      
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
              <option value="activity">Activity</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
            </select>
      
            <label className={labelClass}>Description</label>
            <textarea
              className="w-full h-[20%] border-solid border border-[#C9CCD5] bg-transparent text-[#102E50] p-[1%] rounded-md shadow-md"
              value={metaData.description || ""}
              onChange={(e) => setMetaData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this material"
              rows={2}
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
      
      
            <div className="flex gap-2">
              <button onClick={() => setEditMaterialOpen(false)} className="bg-[#9BA4B4] w-1/2 xl:text-lg p-2" type="button">
                CANCEL
              </button>
              <button className="bg-[#102E50] w-1/2 xl:text-lg p-2" onClick={handleUpdate}>
                UPDATE
              </button>
            </div>
          </form>
  );
}
