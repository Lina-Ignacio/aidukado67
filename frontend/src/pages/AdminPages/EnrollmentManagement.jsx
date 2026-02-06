import { useState, useEffect } from "react";
import axios from "axios";
import SearchForm from "../../components/SearchForm";
import { MoonLoader } from "react-spinners";
import AddEnrollment from "../Enrollment/AddEnrollment";
import EditEnrollment from "../Enrollment/EditEnrollment";
import ArchiveEnrollment from "../Enrollment/ArchiveEnrollment";
import Modal from "../../components/Modal";
import Table from "../../components/Table";
import ClassicButton from "../../components/classicButton";
import { LuUserPlus, LuImport } from "react-icons/lu"
import ImportEnrollments from "../Enrollment/ImportEnrollments";

export default function EnrollmentManagement() {
  const enrollmentColumns = [
    { id: 1, name: "ID", key: "id" },
    { id: 2, name: "Course Code", key: "className" },
    { id: 3, name: "Full Name", key: "fullName" },
    { id: 4, name: "Status", key: "status" }
  ];

  const [query, setQuery] = useState("");
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const studentOptions = students.map((student) => ({
    value: student.id,
    label: `${student.lastName} ${student.firstName}`
  }));

  const classOptions = classes.map((classData) => ({
    value: classData.id,
    label: classData.name
  }));

  const [loading, setLoading] = useState(false);
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

  const getStudents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/get_students`);
      setStudents(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchingError((prev) => ({
          ...prev,
          studentError: err.response.data.detail
        }));
      } else {
        setFetchingError((prev) => ({
          ...prev,
          studentError: "Network Error"
        }));
      }
    }
  };

  const getClasses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/get`);
      setClasses(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchingError((prev) => ({
          ...prev,
          classesError: err.response.data.detail
        }));
      } else {
        setFetchingError((prev) => ({
          ...prev,
          classesError: "Network Error"
        }));
      }
    }
  };

  const getEnrollment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/enrollment/get`, {
        params: query.trim() !== "" ? { query } : {}
      });

      setEnrollmentData(response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchDataError(err.response.data.detail);
      } else {
        setFetchDataError("Network Error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getEnrollment();
    }, 500);
    return () => {
      clearTimeout(delayDebounce);
    };
  }, [query]);

  useEffect(() => {
    getStudents();
    getClasses();
  }, []);

    const transformedData = enrollmentData.map((data) => {
    const className = classes.find((c) => c.id === data.classId)?.name || "";
    const student = students.find((s) => s.id === data.studentId);
    const fullName = student ? `${student.firstName} ${student.lastName}` : "";

    return {
      ...data,
      className,
      fullName
    };
  });

  const panelStyleAdd = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleDelete = "w-full h-auto max-w-lg rounded-xl shadow-xl";
  const panelStyleImport = "w-full h-auto max-w-xl rounded-xl shadow-xl bg-gradient-to-br from-[#102E50] to-[#0d243f] p-5";
  const pagination = [10, 12]
  return (
    <>
      <div className="grid lg:hidden justify-items-center w-full h-full px-5">
          <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
            NOT AVAILABLE ON MOBILE AND TABLET!
          </h1>
      </div>

      <div className="hidden lg:flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center text-white">
        {fetchDataError && <p className="text-red-800">{fetchDataError}</p>}
        <div className="w-4/5 h-auto grid grid-cols-[3fr_1.5fr_1fr] gap-2 
                        lg:h-11 xl:h-12 2xl:h-15 mt-3">
          <SearchForm query={query} setQuery={setQuery} inputPlaceholder="Search by course code, name, status"/>
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

        <div className="overflow-x-auto w-4/5 mt-[20px]">
          {success && <p className="text-green-800">{success}</p>}
          {fetchingError.studentError && (
            <p className="text-red-800">{fetchingError.studentError}</p>
          )}
          {fetchingError.classesError && (
            <p className="text-red-800">{fetchingError.classesError}</p>
          )}
          
          {!loading ? (
            <Table
              columns={enrollmentColumns}
              data={transformedData}
              setSelectedData={setSelectedEnrollmentData}
              setIsOpenEditModal={setIsOpenEditModal}
              setIsOpenDeleteModal={setIsOpenArchiveModal}
              pagination={pagination}
            />
          ) : (
            <MoonLoader color="blue" loading={true} size={80} />
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
            }}
          />
        </Modal>

        {/* Import Enrollments Modal */}
        <Modal
          isOpen={isOpenImportModal}
          onClose={() => setIsOpenImportModal(false)}
          title=""
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
