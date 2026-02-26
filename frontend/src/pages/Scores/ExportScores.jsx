// pages/ExportScores.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../services/axiosConfig";
import ClassicButton from "../../components/classicButton";
import ScoresTable from "../../components/Scores/ScoresTable";
import { PiExport } from "react-icons/pi";
import { LuStepBack } from "react-icons/lu";
import UserDropup from "../../components/DropUp/UserDropUp";

export default function ExportScores() {
  const { classId, term } = useParams();
  const navigate = useNavigate();
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const fetchScoresData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/score/export-scores/${classId}/${term}`
      );
      setTableData(response.data);
      console.log("this", response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch scores data");
      console.error("Error fetching scores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/score/export-scores/${classId}/${term}/csv`,
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download", 
        `Scores_Class${classId}_Term${term}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchScoresData();
  }, [classId, term]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading scores data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <ClassicButton 
          buttonName="Back to Class"
          onClick={() => navigate(-1)}
          mainColor="#183D65" 
          darkColor="#102E50"
        />
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="p-6">
        <div className="text-gray-600 mb-4">No scores data available</div>
        <ClassicButton 
          buttonName="Back to Class"
          onClick={() => navigate(-1)}
          mainColor="#183D65" 
          darkColor="#102E50"
        />
      </div>
    );
  }

  // Prepare columns for the table
  const tableColumns = [
    { id: "student_name", name: "Student Name", key: "student_name" }
  ];
  
  // Add activity columns
  tableData.headers.slice(1).forEach(header => {
    tableColumns.push({
      id: header.key,
      name: header.label,
      key: header.key
    });
  });

  // Prepare rows data
  const tableRows = tableData.students.map(student => {
    const row = {
      id: student.student_id,
      student_name: student.student_name
    };
    
    // Add scores for each activity
    tableData.headers.slice(1).forEach(header => {
      const activityId = header.key;
      const score = student.scores[activityId] || 0;
      const maxScore = header.max_score || 0;
      row[activityId] = `${score}`; // Just show the score, not the max
    });
    
    return row;
  });

  // Add the "Highest Possible Score" row as first row
  const highestScoreRow = {
    id: "highest_score",
    student_name: "Highest Possible Score",
    isMaxScoreRow: true
  };
  
  tableData.headers.slice(1).forEach((header, index) => {
    highestScoreRow[header.key] = tableData.max_scores_row[index + 1];
  });

  const allRows = [highestScoreRow, ...tableRows];

  return (
    <div className="px-24 py-10 mx-auto w-full h-auto min-h-screen">
      <UserDropup />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="">
          <h1 className="text-2xl font-bold text-[#102E50] mb-2">
            Scores Export 
          </h1>
          <p className="text-gray-600">
            {tableData.summary.total_students} students, {tableData.summary.total_activities} activities
          </p>
        </div>
        
        <div className="flex gap-3">
          <ClassicButton 
            buttonName={exporting ? "Exporting..." : "Export as CSV"}
            onClick={handleExportCSV}
            disabled={exporting}
            mainColor="#183D65" 
            darkColor="#102E50"
            icon={PiExport}
          />
          
          <ClassicButton 
            buttonName="Back to Class"
            onClick={() => navigate(-1)}
            mainColor="#E78B48" 
            darkColor="#B9652B"
            icon={LuStepBack}
          />
        </div>
      </div>

      {/* Scores Table */}
      <ScoresTable 
        columns={tableColumns} 
        data={allRows} 
        pagination={[8, 10]} 
      />
    </div>
  );
}