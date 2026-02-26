import { useState, useEffect } from "react";
import axios from "../../services/axiosConfig";
import { MoonLoader } from "react-spinners";
import { LuPlus, LuCheck, LuArchive, LuCalendar, LuChevronRight } from "react-icons/lu";

export default function AcademicSemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  const [formData, setFormData] = useState({
    academic_year: "",
    semester: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const semesterOptions = ["1st Semester", "2nd Semester", "Summer"];

  const getSemesters = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/academic-semesters/get`,
        { params: { include_archived: false } }
      );
      setSemesters(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load semesters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSemesters();
  }, []);

  const handleSetCurrent = async (id) => {
    try {
      setError("");
      setSuccess("");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/academic-semesters/set-current/${id}`
      );
      setSuccess("Current semester updated successfully!");
      getSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to set current semester.");
    }
  };

  const handleArchive = async (id) => {
    try {
      setError("");
      setSuccess("");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/academic-semesters/archive/${id}`
      );
      setSuccess("Semester archived successfully!");
      getSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to archive semester.");
    }
  };

  const validateForm = () => {
    if (!formData.academic_year.trim()) return "Academic year is required.";
    if (!/^\d{4}-\d{4}$/.test(formData.academic_year.trim()))
      return "Academic year must be in format YYYY-YYYY (e.g. 2024-2025).";
    const [start, end] = formData.academic_year.split("-").map(Number);
    if (end !== start + 1) return "Academic year end must be start year + 1.";
    if (!formData.semester) return "Please select a semester.";
    return "";
  };

  const handleAddSemester = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/academic-semesters/create`,
        {
          academic_year: formData.academic_year.trim(),
          semester: formData.semester,
          current: true,
          is_archive: false,
        }
      );
      setSuccess("New semester created and set as current!");
      setFormData({ academic_year: "", semester: "" });
      setIsOpenAddModal(false);
      getSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message || "Failed to create semester.");
    } finally {
      setFormLoading(false);
    }
  };

  const currentSemester = semesters.find((s) => s.current);

  return (
    <div className="flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center">

      {/* Current Semester Banner */}
      {currentSemester && (
        <div className="w-full mb-6 p-4 bg-gradient-to-r from-[#102E50] to-[#1a3f6a] rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LuCalendar className="text-yellow-300 text-xl" />
              <span className="text-[#E78B48] font-semibold text-lg">Current Academic Period:</span>
              <span className="text-white font-bold text-xl">
                {currentSemester.academic_year} — {currentSemester.semester}
              </span>
              {/* <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                ACTIVE
              </span> */}
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Header Row */}
      <div className="w-full flex justify-between items-center mb-4">
        <div>
          <h2 className="text-[#102E50] font-bold text-xl">Academic Semesters</h2>
          <p className="text-gray-500 text-sm mt-1">
            Creating a new semester automatically sets it as the current active period.
          </p>
        </div>
        <button
          onClick={() => setIsOpenAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E78B48] hover:bg-[#B9652B] 
            text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          <LuPlus />
          Add Semester
        </button>
      </div>

      {/* Semester Table */}
      <div className="w-full bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <MoonLoader color="#102E50" loading={true} size={50} />
            <p className="mt-4 text-gray-400 text-sm">Loading semesters...</p>
          </div>
        ) : semesters.length === 0 ? (
          <div className="text-center p-12">
            <LuCalendar className="text-gray-300 text-5xl mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No semesters found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first academic semester to get started.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-[#102E50] text-white">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Academic Year</th>
                <th className="px-6 py-3 text-left font-semibold">Semester</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((sem, index) => (
                <tr
                  key={sem.id}
                  className={`border-b transition-colors
                    ${sem.current ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    hover:bg-blue-50/60`}
                >
                  <td className="px-6 py-4 font-medium text-[#102E50]">
                    <div className="flex items-center gap-2">
                      {sem.current && <LuChevronRight className="text-green-500" />}
                      {sem.academic_year}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{sem.semester}</td>
                  <td className="px-6 py-4">
                    {sem.current ? (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Current
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!sem.current && (
                        <button
                          onClick={() => handleSetCurrent(sem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#102E50] hover:bg-[#1a3f6a]
                            text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <LuCheck className="text-xs" />
                          Set as Current
                        </button>
                      )}
                      {!sem.current && (
                        <button
                          onClick={() => handleArchive(sem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200
                            text-gray-600 text-xs font-medium rounded-lg transition-colors"
                        >
                          <LuArchive className="text-xs" />
                          Archive
                        </button>
                      )}
                      {sem.current && (
                        <span className="text-xs text-gray-400 italic">Active semester</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Semester Modal */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-[#102E50] font-bold text-lg mb-1">Add New Semester</h3>
            <p className="text-gray-500 text-sm mb-5">
              This will automatically become the current active semester.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleAddSemester} className="flex flex-col gap-4">
              <div>
                <label className="text-[#102E50] font-semibold text-sm mb-1 block opacity-75">
                  Academic Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024-2025"
                  value={formData.academic_year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, academic_year: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50]
                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-[#102E50] font-semibold text-sm mb-1 block opacity-75">
                  Semester
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-[#102E50]
                    focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-transparent"
                >
                  <option value="">Select a semester</option>
                  {semesterOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenAddModal(false);
                    setFormData({ academic_year: "", semester: "" });
                    setFormError("");
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#102E50] 
                    font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-[#E78B48] hover:bg-[#B9652B] text-white 
                    font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Creating..." : "Create Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}