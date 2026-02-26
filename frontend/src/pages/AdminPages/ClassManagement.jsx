import SearchForm from "../../components/SearchForm"
import Table from "../../components/Table"
import { useState, useEffect } from "react"
import axios from "../../services/axiosConfig";
import Modal from "../../components/Modal";
import AddClass from "../SchoolClasses/AddClass";
import EditClass from "../SchoolClasses/EditClass";
import ArchiveClass from "../SchoolClasses/ArchiveClass";
import UploadClasses from "../SchoolClasses/UploadClasses";
import { MoonLoader } from "react-spinners";
import ClassicButton from "../../components/classicButton";
import { LuPlus, LuUpload, LuFilter } from "react-icons/lu"; 

export default function ClassManagement() {

    const classesColumns = [
        { id: 2, name: "Course Code", key: "subjectName" },
        { id: 4, name: "Teacher Name", key: "teacherName" },
        { id: 5, name: "Section", key: "section" }, 
        { id: 6, name: "Room", key: "room" },  
        { id: 7, name: "Units", key: "units" },
        { id: 8, name: "Schedule", key: "schedule" },
    ];

    const [query, setQuery] = useState("");
    const [classesData, setClassesData] = useState([])
    const [filteredClasses, setFilteredClasses] = useState([])
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentSemester, setCurrentSemester] = useState(null);
    
    const [academicSemesters, setAcademicSemesters] = useState([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState("");

    const [selectedClassData, setSelectedClassData] = useState(null);
    const [isOpenAddModal, setIsOpenAddModal] = useState(false);
    const [isOpenEditModal, setIsOpenEditModal] = useState(false);
    const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
    const [isOpenUploadModal, setIsOpenUploadModal] = useState(false);

    const getCurrentSemester = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/academic-semesters/get-current`);
            setCurrentSemester(response.data);
            if (response.data) {
                setSelectedSemesterId(response.data.id);
            }
        } catch (err) {
            console.log("No current semester set or error fetching:", err);
        }
    }

    const getAllSemesters = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/academic-semesters/get`, {
                params: { include_archived: false }
            });
            setAcademicSemesters(response.data);
        } catch (err) {
            console.log("Error fetching academic semesters:", err);
        }
    }

    const getClasses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/get/`, {
                params : query.trim() !== "" ? {query} : {}
            })
            
            const formatted = response.data.map((cls) => ({
                ...cls,
                subjectName: cls.subject?.name || "—",
                teacherName: cls.userTeacher ? `${cls.userTeacher.firstName} ${cls.userTeacher.lastName}` : "—",
                section: cls.section || "—",  
                room: cls.room || "—",  
                units: `${cls.lectureUnits || 0}${cls.labUnits > 0 ? `/${cls.labUnits}` : ''}`,
                lectureUnits: cls.lectureUnits || 0,
                labUnits: cls.labUnits || 0,
                academic_semester_id: cls.academicSemesterId
            }));
            
            setClassesData(formatted);
        } catch(err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else {
                setError("Network Error")
            } 
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log("Selected Semester ID:", selectedSemesterId);
        console.log("Classes Data length:", classesData.length);
        
        if (!selectedSemesterId || selectedSemesterId === "") {
            setFilteredClasses(classesData);
            return;
        }
        
        const selectedIdNum = parseInt(selectedSemesterId, 10);
        console.log("Selected ID as number:", selectedIdNum);
        
        const filtered = classesData.filter(cls => {
            console.log(`Class ID: ${cls.id}, Semester ID: ${cls.academic_semester_id} (${typeof cls.academic_semester_id})`);
            
            if (cls.academic_semester_id === null || cls.academic_semester_id === undefined) {
                return false;
            }
            
            return Number(cls.academic_semester_id) === selectedIdNum;
        });
        
        console.log(`Filtered ${filtered.length} classes`);
        setFilteredClasses(filtered);
        
    }, [selectedSemesterId, classesData]);

    useEffect(() => {
        getClasses();
        getCurrentSemester();
        getAllSemesters();
    }, [])

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            getClasses();
        }, 500)
        return () => clearTimeout(delayDebounce)
    }, [query])

    const handleSemesterChange = (e) => {
        const value = e.target.value;
        console.log("Dropdown changed to:", value, "Type:", typeof value);
        setSelectedSemesterId(value);
    };

    const panelStyleAdd = "w-full h-auto rounded-xl shadow-xl"
    const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleDelete = "w-full h-auto max-w-lg rounded-xl shadow-xl rounded-xl"
    const panelStyleUpload = "w-full h-auto max-w-2xl rounded-xl shadow-xl" 

    const pagination = [7, 10]
    
    return (
        <>
            <div className="grid grid-rows-2 lg:hidden justify-items-center w-full h-full px-5">
                <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                    Sorry!
                </h1>
                <p className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                    NOT AVAILABLE ON MOBILE AND TABLET!
                </p>
            </div>

            <div className="hidden lg:flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center text-white">
                
                {currentSemester && (
                    <div className="w-full mb-4 p-4 bg-gradient-to-r from-[#102E50] to-[#1a3f6a] rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-[#E78B48] font-semibold text-lg">📅 Current Academic Period:</span>
                                <span className="text-white font-bold text-xl">
                                    {currentSemester.academic_year} - {currentSemester.semester}
                                </span>
                                {/* {currentSemester.current && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                        ACTIVE
                                    </span>
                                )} */}
                            </div>
                            <div className="text-gray-300 text-sm">
                                {selectedSemesterId ? "Showing filtered classes" : "Showing all classes"}
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full h-auto grid grid-cols-[1.5fr_3fr_1.5fr_1fr] gap-2 
                        lg:h-11 xl:h-12 2xl:h-15 mt-3">
                    
                    <div className="relative">
                        <select
                            value={selectedSemesterId}
                            onChange={handleSemesterChange}
                            className="w-full h-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#102E50] font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 appearance-none cursor-pointer"
                        >
                            <option value="">All Semesters</option>
                            {academicSemesters.map((sem) => (
                                <option key={sem.id} value={sem.id}>
                                    {sem.academic_year} - {sem.semester} {sem.current ? ' (Current)' : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <LuFilter className="text-gray-400" />
                        </div>
                    </div>

                    <SearchForm 
                        query={query} 
                        setQuery={setQuery} 
                        inputPlaceholder="Search by Course Code, Course Name, Teacher, Section, Room"
                    />
                    
                    <ClassicButton 
                        buttonName="Import Classes"
                        icon={LuUpload}
                        onClick={() => setIsOpenUploadModal(true)}
                        className="w-full" 
                        mainColor="#5C6BC0" 
                        darkColor="#3949AB"
                    />
                    
                    <ClassicButton 
                        buttonName="Add Class"
                        icon={LuPlus}
                        onClick={() => setIsOpenAddModal(true)}
                        className="w-full" 
                        mainColor="#E78B48" 
                        darkColor="#B9652B"
                    />
                </div>
                
                <div className="w-full mt-4 text-left">
                    <p className="text-[#102E50] font-medium">
                        Showing {filteredClasses.length} of {classesData.length} classes
                        {selectedSemesterId && " (filtered)"}
                    </p>
                </div>
                
                <div className="overflow-x-auto w-full mt-[20px]">
                    {error && <p className="text-red-800">{error}</p>}
                    {!loading ? (
                        <Table 
                            columns={classesColumns}
                            data={filteredClasses}
                            setSelectedData={setSelectedClassData}
                            setIsOpenEditModal={setIsOpenEditModal}
                            setIsOpenDeleteModal={setIsOpenArchiveModal}
                            pagination={pagination}
                        />
                    ) : (                   
                        (<MoonLoader color="blue" loading={true} size={80} />)
                    )}
                </div>

                <Modal isOpen={isOpenUploadModal} onClose={() => setIsOpenUploadModal(false)} title="" panelStyle={panelStyleUpload}>
                    <UploadClasses 
                        onClose={() => setIsOpenUploadModal(false)}
                        onSuccess={() => {
                            getClasses();
                            getAllSemesters();
                            setIsOpenUploadModal(false);
                        }}
                    />
                </Modal>

                <Modal isOpen={isOpenAddModal} onClose={() => setIsOpenAddModal(false)} title="" panelStyle={panelStyleAdd}>
                    <AddClass 
                        onClose={() => setIsOpenAddModal(false)}
                        onSuccess={() => {
                            getClasses();
                            getAllSemesters();
                            setIsOpenAddModal(false);
                        }}
                        currentSemester={currentSemester}
                    />
                </Modal>

                <Modal isOpen={isOpenEditModal} onClose={() => setIsOpenEditModal(false)} title="Edit Class" panelStyle={panelStyleEdit}>
                    <EditClass
                        classId={selectedClassData?.id}
                        onClose={() => setIsOpenEditModal(false)}
                        onSuccess={() => {
                            getClasses();
                            setIsOpenEditModal(false);
                        }}
                    />
                </Modal>
                
                <Modal isOpen={isOpenArchiveModal} onClose={() => setIsOpenArchiveModal(false)} title="Archive Class" panelStyle={panelStyleDelete}>
                    <ArchiveClass
                        class_id={selectedClassData?.id}
                        onClose={() => setIsOpenArchiveModal(false)}
                        onSuccess={() => {
                            getClasses();
                            setIsOpenArchiveModal(false);
                        }}
                    />
                </Modal>
            </div>
        </>
    )
}