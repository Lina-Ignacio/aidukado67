import { useState, useEffect, useMemo } from "react";
import axios from "../../services/axiosConfig";
import SearchForm from "../../components/SearchForm";
import { MoonLoader } from "react-spinners";
import AddEnrollment from "../Enrollment/AddEnrollment";
import EditEnrollment from "../Enrollment/EditEnrollment";
import ArchiveEnrollment from "../Enrollment/ArchiveEnrollment";
import Modal from "../../components/Modal";
import Table from "../../components/Table";
import ClassicButton from "../../components/classicButton";
import { LuUserPlus, LuImport } from "react-icons/lu";
import ImportEnrollments from "../Enrollment/ImportEnrollments";

export default function EnrollmentManagement() {
  const enrollmentColumns = [
    { id: 1, name: "Course Code", key: "className" },
    { id: 2, name: "Full Name", key: "fullName" },
    { id: 3, name: "Enrollment Date", key: "enrollmentDate" },
    { id: 4, name: "Status", key: "status" }
  ];

  const [query, setQuery] = useState("");
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [selectedEnrollmentData, setSelectedEnrollmentData] = useState(null);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
  const [isOpenImportModal, setIsOpenImportModal] = useState(false);
  const [fetchDataError, setFetchDataError] = useState("");
  const [fetchingError, setFetchingError] = useState({
    studentError: "",
    classesError: ""
  });

  const studentOptions = students.map((student) => ({
    value: student.id,
    label: `${student.lastName || student.last_name} ${student.firstName || student.first_name}`
  }));

  const classOptions = classes.map((classData) => ({
    value: classData.id,
    label: classData.name
  }));

  const getStudents = async () => {
    try {
      setStudentsLoading(true);
      setFetchingError(prev => ({ ...prev, studentError: "" }));
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/get_students`);
      setStudents(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchingError(prev => ({ ...prev, studentError: err.response.data.detail }));
      } else if (err.message) {
        setFetchingError(prev => ({ ...prev, studentError: err.message }));
      } else {
        setFetchingError(prev => ({ ...prev, studentError: "Failed to load students. Please try again." }));
      }
    } finally {
      setStudentsLoading(false);
    }
  };

  const getClasses = async () => {
    try {
      setClassesLoading(true);
      setFetchingError(prev => ({ ...prev, classesError: "" }));
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/get`);
      setClasses(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchingError(prev => ({ ...prev, classesError: err.response.data.detail }));
      } else if (err.message) {
        setFetchingError(prev => ({ ...prev, classesError: err.message }));
      } else {
        setFetchingError(prev => ({ ...prev, classesError: "Failed to load classes. Please try again." }));
      }
    } finally {
      setClassesLoading(false);
    }
  };

  // Fetch enrollments with backend filtering when query exists
  const getEnrollment = async () => {
    try {
      setLoading(true);
      setFetchDataError("");
      
      // Choose endpoint based on whether there's a search query
      const endpoint = query.trim() !== "" 
        ? "/enrollment/get-filtered" 
        : "/enrollment/get";
      
      const params = query.trim() !== "" 
        ? { query: query.trim() } 
        : {};
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        { params }
      );
      
      setEnrollmentData(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchDataError(err.response.data.detail);
      } else if (err.message) {
        setFetchDataError(err.message);
      } else {
        setFetchDataError("Failed to load enrollments. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    getEnrollment();
    getStudents();
    getClasses();
  }, []);

  // Debounced search - calls API when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getEnrollment();
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Transform data for table display (no frontend filtering needed)
  const transformedData = useMemo(() => {
    if (!enrollmentData || enrollmentData.length === 0) return [];
    
    return enrollmentData.map((data) => {
      const className = data.className || "";
      const fullName = `${data.studentFirstName || ""} ${data.studentLastName || ""}`.trim();

      return {
        id: data.id,
        className,
        fullName,
        enrollmentDate: data.enrollmentDate, // ADD THIS LINE
        status: data.status || "",
        originalData: data
      };
    });
  }, [enrollmentData]);

  const panelStyleAdd = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleDelete = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleImport = "w-full h-auto max-w-xl rounded-xl shadow-xl";
  const pagination = [10, 12];

  return (
    <>
      <div className="grid lg:hidden justify-items-center w-full h-full px-5">
        <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
          NOT AVAILABLE ON MOBILE AND TABLET!
        </h1>
      </div>

      <div className="hidden lg:flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center text-white">
        {fetchDataError && (
          <div className="w-4/5 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Enrollment Error:</p>
            <p className="text-red-600 text-sm">{fetchDataError}</p>
            <button
              onClick={getEnrollment}
              className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="w-4/5 mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="w-4/5 h-auto grid grid-cols-[3fr_1.5fr_1fr] gap-2 
                        lg:h-11 xl:h-12 2xl:h-15 mt-3">
          <SearchForm 
            query={query} 
            setQuery={setQuery} 
            inputPlaceholder="Search by course code, status"
          />
          <ClassicButton 
            buttonName="Import Enrollments"
            className="shadow-md w-full place-self-end hover:bg-[#0d243f]"
            onClick={() => setIsOpenImportModal(true)}
            mainColor="#102E50"
            darkColor="#0d243f"
            icon={LuImport}
          />
          <ClassicButton 
            buttonName="Enroll"
            className="shadow-md w-full place-self-end"
            onClick={() => setIsOpenAddModal(true)}
            mainColor="#E78B48" 
            darkColor="#B9652B"
            icon={LuUserPlus}
          />
        </div>

        {(studentsLoading || classesLoading) && (
          <div className="w-4/5 mt-2 text-sm text-gray-400">
            {studentsLoading && "Loading students... "}
            {classesLoading && "Loading classes... "}
          </div>
        )}

        {fetchingError.studentError && (
          <div className="w-4/5 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">Student Error: {fetchingError.studentError}</p>
            <button
              onClick={getStudents}
              className="mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry Loading Students
            </button>
          </div>
        )}

        {fetchingError.classesError && (
          <div className="w-4/5 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">Class Error: {fetchingError.classesError}</p>
            <button
              onClick={getClasses}
              className="mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry Loading Classes
            </button>
          </div>
        )}

        <div className="overflow-x-auto w-4/5 mt-[20px]">
          <div className="mb-2">
            <div className="text-sm text-gray-400">
              {query ? (
                <>Found {transformedData.length} enrollments for "<span>{query}</span>"</>
              ) : (
                <>Showing all {transformedData.length} enrollments</>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <MoonLoader color="#102E50" loading={true} size={60} />
              <p className="mt-4 text-gray-400">Loading enrollments...</p>
            </div>
          ) : (
            <>
              {transformedData.length === 0 && query && (
                <div className="text-center p-8 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-lg">No enrollments found for</p>
                  <p className="text-white font-medium">"{query}"</p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-3 px-4 py-2 text-sm bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {transformedData.length === 0 && !loading && !query && (
                <div className="text-center p-8 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-lg">No enrollments found</p>
                  <p className="text-gray-500 text-sm mt-1">Try adding some enrollments</p>
                </div>
              )}

              {transformedData.length > 0 && (
                <Table
                  columns={enrollmentColumns}
                  data={transformedData}
                  setSelectedData={setSelectedEnrollmentData}
                  setIsOpenEditModal={setIsOpenEditModal}
                  setIsOpenDeleteModal={setIsOpenArchiveModal}
                  pagination={pagination}
                />
              )}
            </>
          )}
        </div>

        <Modal
          isOpen={isOpenAddModal}
          onClose={() => setIsOpenAddModal(false)}
          title="Add Enrollment"
          panelStyle={panelStyleAdd}
        >
          <AddEnrollment
            studentOptions={studentOptions}
            classOptions={classOptions}
            setSuccess={setSuccess}
            onClose={() => setIsOpenAddModal(false)}
            onSuccess={() => {
              getEnrollment();
              setIsOpenAddModal(false);
              setSuccess("Enrollment added successfully!");
              setTimeout(() => setSuccess(""), 3000);
            }}
          />
        </Modal>

        <Modal
          isOpen={isOpenEditModal}
          onClose={() => setIsOpenEditModal(false)}
          title="Edit Enrollment"
          panelStyle={panelStyleEdit}
        >
          <EditEnrollment
            enrollmentId={selectedEnrollmentData?.id}
            classOptions={classOptions}
            studentOptions={studentOptions}
            setSuccess={setSuccess}
            onClose={() => setIsOpenEditModal(false)}
            onSuccess={() => {
              getEnrollment();
              setIsOpenEditModal(false);
              setSuccess("Enrollment updated successfully!");
              setTimeout(() => setSuccess(""), 3000);
            }}
          />
        </Modal>

        <Modal
          isOpen={isOpenArchiveModal}
          onClose={() => setIsOpenArchiveModal(false)}
          title="Archive Enrollment"
          panelStyle={panelStyleDelete}
        >
          <ArchiveEnrollment
            enrollmentId={selectedEnrollmentData?.id}
            setSuccess={setSuccess}
            onClose={() => setIsOpenArchiveModal(false)}
            onSuccess={() => {
              getEnrollment();
              setIsOpenArchiveModal(false);
              setSuccess("Enrollment archived successfully!");
              setTimeout(() => setSuccess(""), 3000);
            }}
          />
        </Modal>

        <Modal
          isOpen={isOpenImportModal}
          onClose={() => setIsOpenImportModal(false)}
          title="Import Enrollments"
          panelStyle={panelStyleImport}
        >
          <ImportEnrollments
            onSuccess={() => {
              getEnrollment();
              setSuccess("Enrollments imported successfully!");
              setTimeout(() => setSuccess(""), 3000);
            }}
            onClose={() => setIsOpenImportModal(false)}
          />
        </Modal>
      </div>
    </>
  );
}