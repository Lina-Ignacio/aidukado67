
import SearchForm from "../../components/SearchForm"
import Table from "../../components/Table"
import { useState, useEffect } from "react"
import axios from "axios";
import Modal from "../../components/Modal";
import AddClass from "../SchoolClasses/AddClass";
import EditClass from "../SchoolClasses/EditClass";
import ArchiveClass from "../SchoolClasses/ArchiveClass";
import { MoonLoader } from "react-spinners";
import ClassicButton from "../../components/classicButton";
import { LuPlus } from "react-icons/lu";

export default function ClassManagement() {

    const classesColumns = [
        { id: 1, name: "ID", key: "id" },
        { id: 2, name: "Name", key: "name" },
        { id: 3, name: "Subject Name", key: "subjectName" },
        { id: 4, name: "Teacher Name", key: "teacherName" },
        { id: 5, name: "Schedule", key: "schedule"}
    ];


    const [query, setQuery] = useState("");
    const [classesData, setClassesData] = useState([])
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [selectedClassData, setSelectedClassData] = useState(null);
    const [isOpenAddModal, setIsOpenAddModal] = useState(false);
    const [isOpenEditModal, setIsOpenEditModal] = useState(false);
    const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);


    const getClasses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/get`, {
                params : query.trim() !== "" ? {query} : {}
            })
            console.log(response.data);
            const formatted = response.data.map((cls) => ({
                ...cls,
                subjectName: cls.subject?.name || "—",
                teacherName: cls.userTeacher ? `${cls.userTeacher.firstName} ${cls.userTeacher.lastName}` : "—",
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
        const delayDebounce = setTimeout(() => {
            getClasses();
        }, 500)
        return () => clearTimeout(delayDebounce)
    }, [query])

    
    const panelStyleAdd = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleDelete = "w-full h-auto max-w-lg rounded-xl shadow-xl rounded-xl"
    const pagination = [10, 13]
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
                <div className="w-4/5 h-auto grid grid-cols-[2.5fr_1fr] gap-2 
                        lg:h-11 xl:h-12 2xl:h-15 mt-3">
                    <SearchForm query={query} setQuery={setQuery} inputPlaceholder="Search by Class Name"/>
                    <ClassicButton 
                        buttonName="Add Class"
                        icon={LuPlus}
                        onClick={() => setIsOpenAddModal(true)}
                        className="xl:w-full 2xl:w-2/3 place-self-end" 
                        mainColor="#E78B48" 
                        darkColor="#B9652B"
                    />
                </div>
                <div className="overflow-x-auto w-4/5 mt-[20px]">
                    {error && <p className="text-red-800">{error}</p>}
                    {!loading ? (
                        <Table 
                            columns={classesColumns}
                            data={classesData}
                            setSelectedData={setSelectedClassData}
                            setIsOpenEditModal={setIsOpenEditModal}
                            setIsOpenDeleteModal={setIsOpenArchiveModal}
                            pagination={pagination}
                        />
                    ) : (                   
                        (<MoonLoader color="blue" loading={true} size={80} />)
                    )}
                </div>

                {/* Modal for adding a class :> */}

                <Modal isOpen={isOpenAddModal} onClose={() => setIsOpenAddModal(false)} title="Add Class" panelStyle={panelStyleAdd}>
                    <AddClass 
                        onClose={() => setIsOpenAddModal(false)}
                        onSuccess={() => {
                            getClasses();
                            setIsOpenAddModal(false);
                        }}
                    />
                </Modal>

                {/* Edit */}
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
                
                {/* Archive */}

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