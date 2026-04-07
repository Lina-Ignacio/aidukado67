import { useState, useEffect } from "react";
import axios from "../../services/axiosConfig";
import * as XLSX from "xlsx";
import FileUploader from "../../components/FileUploader";
import ClassicButton from "../../components/classicButton";
import { MoonLoader } from "react-spinners";
import { LuUpload, LuDownload } from "react-icons/lu";
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
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/classes/get`
        );
        setClasses(response.data);
        console.log(response.data);
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
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .slice(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
        return;
      }
      setFile(selectedFile);
      setError("");
      setValidationErrors([]);
      setSuccess("");
    }
  };

  const handleDownloadTemplate = () => {
    // Create workbook with template columns in the correct order
    const wb = XLSX.utils.book_new();
    const templateData = [
      ["name", "email"],           // headers row
      ["Juan dela Cruz", "juan.delacruz@email.com"],  // example row
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for readability
    ws["!cols"] = [{ wch: 30 }, { wch: 35 }];

    XLSX.utils.book_append_sheet(wb, ws, "Enrollments Template");
    XLSX.writeFile(wb, "enrollment_template.xlsx");
  };

  const convertExcelToCSV = (excelFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          const headers = jsonData[0];

          let nameIndex = -1;
          let emailIndex = -1;

          for (let i = 0; i < headers.length; i++) {
            const header = String(headers[i] || "")
              .trim()
              .toLowerCase();
            if (header.includes("name") && !header.includes("email")) {
              nameIndex = i;
            } else if (header.includes("email")) {
              emailIndex = i;
            }
          }

          if (nameIndex === -1 || emailIndex === -1) {
            nameIndex = 0;
            emailIndex = 1;

            if (jsonData.length > 1 && jsonData[1] && jsonData[1][emailIndex]) {
              const secondCol = String(jsonData[1][emailIndex]);
              if (!secondCol.includes("@")) {
                emailIndex = 0;
                nameIndex = 1;
              }
            }
          }

          const csvRows = [];
          csvRows.push(["name", "email"]);

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length > Math.max(nameIndex, emailIndex)) {
              const name = String(row[nameIndex] || "").trim();
              const email = String(row[emailIndex] || "").trim();

              if (name || email) {
                csvRows.push([name, email]);
              }
            }
          }

          const csvContent = csvRows
            .map((row) =>
              row
                .map((cell) => {
                  const escaped = cell.replace(/"/g, '""');
                  return cell.includes(",") || cell.includes('"')
                    ? `"${escaped}"`
                    : escaped;
                })
                .join(",")
            )
            .join("\n");

          resolve(csvContent);
        } catch (err) {
          reject(new Error("Failed to parse Excel file: " + err.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read Excel file"));
      };

      reader.readAsArrayBuffer(excelFile);
    });
  };

  const handleImport = async () => {
    setError("");
    setSuccess("");
    setValidationErrors([]);

    if (!selectedClass) {
      setError("Please select a class");
      return;
    }

    if (!file) {
      setError("Please upload a CSV or Excel file");
      return;
    }

    try {
      setLoading(true);

      let fileContent;
      const fileExtension = file.name
        .slice(file.name.lastIndexOf("."))
        .toLowerCase();

      if (fileExtension === ".csv") {
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read CSV file"));
          reader.readAsText(file);
        });

        const lines = fileContent.split("\n");
        if (lines.length > 0) {
          const firstLine = lines[0].trim().toLowerCase();
          if (firstLine.includes("name") || firstLine.includes("email")) {
            lines[0] = "name,email";
            fileContent = lines.join("\n");
          }
        }
      } else {
        fileContent = await convertExcelToCSV(file);
      }

      console.log(
        "Sending CSV content (first 200 chars):",
        fileContent.substring(0, 200)
      );
      console.log("Full CSV content lines:", fileContent.split("\n").length);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/enrollment/import`,
        {
          classId: parseInt(selectedClass),
          fileContent: fileContent,
        }
      );

      if (
        response.data.failedEmails &&
        response.data.failedEmails.length > 0
      ) {
        setValidationErrors(response.data.failedEmails);
        setError(response.data.message);
      } else {
        setSuccess(response.data.message);
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          setSelectedClass("");
          setFile(null);
          if (onClose) {
            onClose();
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Import error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to import enrollments. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl">
      <h3 className="text-lg font-semibold text-[#102E50] mb-4">
        Import Enrollments
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
                {classItem.name} - {classItem.subject?.name} (
                {classItem.academicYear})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <FileUploader
          type=".csv, .xlsx, .xls"
          handleFileChange={handleFileChange}
        />

        {/* Template download hint + button */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Supported formats: CSV or Excel (.csv, .xlsx, .xls).
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs font-medium text-[#102E50] 
                       border border-[#102E50] rounded-md px-2.5 py-1 
                       hover:bg-[#102E50] hover:text-white transition-colors duration-150"
          >
            <LuDownload size={13} />
            Download Template
          </button>
        </div>

        {file && (
          <p className="text-sm text-green-600 mt-1">Selected: {file.name}</p>
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