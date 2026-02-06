import { useState } from "react";
import axios from "axios";
import FileUploader from "../../components/FileUploader";
import ClassicButton from "../../components/classicButton";
import { MoonLoader } from "react-spinners";
import { LuUpload } from "react-icons/lu";
import { MdClose } from "react-icons/md";

export default function ImportEnrollments({ onSuccess, onClose }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Fetch classes on component mount
  useState(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/classes/get`
        );
        setClasses(response.data);
      } catch (err) {
        setError("Failed to load classes. Please try again.");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleImport = async () => {
    // Reset messages
    setError("");
    setSuccess("");
    setValidationErrors([]);

    // Validate inputs
    if (!selectedClass) {
      setError("Please select a class");
      return;
    }

    if (!file) {
      setError("Please upload a CSV file");
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const fileContent = e.target.result;

        // Send to backend
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/enrollment/import/`,
          {
            classId: parseInt(selectedClass),
            fileContent: fileContent
          }
        );

        if (response.data.failedEmails && response.data.failedEmails.length > 0) {
          setValidationErrors(response.data.failedEmails);
          setError(response.data.message);
        } else {
          setSuccess(response.data.message);
          if (onSuccess) {
            onSuccess();
          }
          // Reset form after successful import
          setTimeout(() => {
            setSelectedClass("");
            setFile(null);
            if (onClose) {
              onClose();
            }
          }, 2000);
        }
      } catch (err) {
        if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to import enrollments. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-semibold text-[#102E50] mb-4">
        Import Enrollments from CSV
      </h3>

      {/* Class Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#102E50] mb-1">
          Select Class *
        </label>
        {loadingClasses ? (
          <div className="flex justify-center py-2">
            <MoonLoader color="#102E50" size={20} />
          </div>
        ) : (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-[#102E50] 
                     focus:border-transparent bg-white text-[#102E50]"
          >
            <option value="">Select a class...</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.subject?.name} ({classItem.academicYear})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <FileUploader
          type=".csv"
          handleFileChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 mt-2">
          CSV format: First column = Name, Second column = Email
        </p>
        {file && (
          <p className="text-sm text-green-600 mt-1">
            Selected: {file.name}
          </p>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800 mb-1">
            Failed emails ({validationErrors.length}):
          </p>
          <ul className="text-xs text-red-600 max-h-32 overflow-y-auto">
            {validationErrors.map((email, index) => (
              <li key={index} className="py-1">
                {email}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex grid grid-cols-[1fr_1.5fr] space-x-3">
        <ClassicButton 
          buttonName="Cancel"
          className="shadow-md hover:bg-gray-500"
          onClick={onClose}
          disabled={loading}
          mainColor="#9CA3AF"  
          darkColor="#6B7280"  
          icon={MdClose}
        />
        
        <ClassicButton
          buttonName={loading ? "Importing..." : "Import Enrollments"}
          className="shadow-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleImport}
          disabled={loading || !selectedClass || !file}
          mainColor="#102E50"
          darkColor="#0d243f"
          icon={LuUpload}
        />
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <MoonLoader color="#102E50" size={30} />
        </div>
      )}
    </div>
  );
}