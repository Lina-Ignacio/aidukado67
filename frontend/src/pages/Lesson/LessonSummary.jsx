import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';

export default function Summary() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const {materialId} = useParams(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/getLesson/${materialId}`);
        console.log(res.data)
        const formData = new FormData();
        formData.append('id', res.data.id);
        formData.append('lesson', res.data.extracted_content);

        await axios.post(`${import.meta.env.VITE_API_URL}/class_material/generateSummary`, formData, {
          headers: {
          "Content-Type": "multipart/form-data",
          }
        }
         );
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/class_material/getSummary/${res.data.id}`)
        console.log(response.data)
        setSummary(response.data.summary)
        
      } catch (error) {
        console.error("Error fetching summary:", error);
        setSummary("Failed to load summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [materialId]);

  const handleClick = () => {
    navigate(-1)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
          Lesson Summary
        </h1>

        {loading ? (
          <p className="text-gray-500 italic">Generating summary...</p>
        ) : (
          <div
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: marked(summary) }}
          ></div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClick}
            className="bg-[#333446] hover:bg-blue-700 text-white font-medium xl:text-lg p-2 
            rounded-lg shadow transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
