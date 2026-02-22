import { useEffect, useState} from "react"
import { useNavigate } from "react-router-dom";
import axios from "../../services/axiosConfig";
import Modal from "../../components/Modal";
import AddUser from "../Users/AddUser";
import BatchAddUser from "../Users/BatchAddUser";
import ArchiveUser from "../Users/ArchiveUser";
import EditUser from "../Users/EditUser";
import Table from "../../components/Table"
import SearchForm from "../../components/SearchForm";
import { MoonLoader } from "react-spinners";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import { MdUploadFile, MdVpnKey, MdSchool, MdAdminPanelSettings } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import ClassicButton from "../../components/classicButton";
import StatCard from "../../components/StatCard"; 

export default function UserManagement() {
    const navigate = useNavigate();

    const classesColumns = [
        { id: 1, name: "Email", key: "email" },
        { id: 2, name: "Role", key: "role" },
        { id: 3, name: "FirstName", key: "firstName" },
        { id: 4, name: "LastName", key: "lastName" },
        { id: 5, name: "MiddleName", key: "middleName" }
    ];

    // for the table
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    
    // for statistics
    const [statistics, setStatistics] = useState({
        total_users: 0,
        total_teachers: 0,
        total_students: 0,
        total_admins: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    
    const [fetchingError, setFetchtingError] = useState("");

    // for modal
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenEditModal, setIsOpenEditModal]  = useState(false)
    const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
    const [isOpenBatchModal, setIsOpenBatchModal] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState(null);

    // Fetch user statistics
    const getUserStatistics = async() => {
        try {
            setStatsLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/statistics`);
            setStatistics(response.data);
        } catch(err) {
            console.error("Error fetching statistics:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const getUsers = async() => {
        try {
            setLoading(true)
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/get`, {
                params : query.trim() !== "" ? { query } : {}
            })
            setUsers(response.data)
        } catch(err) {
            if (err.response?.data?.detail) {
                setFetchtingError(err.response.data.detail);
            } else {
                setFetchtingError("Network Error");
            }
        } finally{
            setLoading(false);
        }
    }
    
    // reading the users with delaydebouncee
    useEffect(() => {
       const delayDebounce = setTimeout(() => {
            getUsers();
       }, 500) 

       return () => clearTimeout(delayDebounce);
    }, [query]);

    // Fetch statistics on component mount
    useEffect(() => {
        getUserStatistics();
    }, []);

    // Refresh statistics after user operations (add, edit, archive)
    const refreshData = () => {
        getUsers();
        getUserStatistics();
    };

    const panelStyleAdd = "w-full h-auto max-w-lg rounded-2xl shadow-xl"
    const panelStyleArchive = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleAddBatch = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const pagination = [8, 10]
    
    return (
        <>
            <div className="grid lg:hidden justify-items-center w-full h-full px-5">
                <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                    NOT AVAILABLE ON MOBILE AND TABLET!
                </h1>
            </div>

            <div className="hidden lg:flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center text-white">

                <div className="w-full h-auto grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 self-end 
                        lg:h-11 xl:h-12 2xl:h-15 mt-3"
                >
                    
                    <SearchForm query={query} setQuery={setQuery} inputPlaceholder="Search by email or name"/>
                    <ClassicButton 
                        buttonName="Reset Pass"
                        icon={MdVpnKey}
                        onClick={() => navigate("/admin/reset-password")}
                        className="w-full" 
                        mainColor="#5C6BC0" 
                        darkColor="#3949AB"
                    />
                    <ClassicButton 
                        buttonName="Add User"
                        icon={FiUserPlus}
                        onClick={() => setIsOpen(true)}
                        
                        className="w-full place-self-end" 
                        mainColor="#E78B48" 
                        darkColor="#B9652B"
                    />
                    <ClassicButton
                        buttonName="Import Users"
                        icon={MdUploadFile}
                        onClick={() => setIsOpenBatchModal(true)}
                        className="w-full"
                        mainColor="#183D65" 
                        darkColor="#102E50"
                    />
                </div>

                {/* Statistics Cards - Add this section */}
                <div className="w-full grid grid-cols-4 gap-4 mt-6">
                    <StatCard
                        title="Total Users"
                        value={statistics.total_users}
                        icon={FiUsers}
                        color="bg-blue-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Teachers"
                        value={statistics.total_teachers}
                        icon={FaChalkboardTeacher}
                        color="bg-green-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Students"
                        value={statistics.total_students}
                        icon={MdSchool}
                        color="bg-purple-500"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Admins"
                        value={statistics.total_admins}
                        icon={MdAdminPanelSettings}
                        color="bg-orange-500"
                        loading={statsLoading}
                    />
                </div>

                <div className="overflow-x-auto w-full mt-[20px]">
                    {fetchingError && <p className="text-red-800">{fetchingError}</p>}
                    {!loading ? (
                    <Table
                        columns={classesColumns}
                        data={users}
                        setSelectedData={setSelectedUserData}
                        setIsOpenEditModal={setIsOpenEditModal}
                        setIsOpenDeleteModal={setIsOpenArchiveModal}
                        pagination={pagination}
                    />
                    ) : (
                    <MoonLoader color="blue" loading={true} size={80} />
                    )}
                </div>
                
                {/* Modal for creating user */}
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add User" panelStyle={panelStyleAdd}>
                    <AddUser
                        onSuccess={() => {
                            refreshData(); 
                            setIsOpen(false);
                        }}
                        onClose={() => setIsOpen(false) }
                    />
                </Modal>

                {/* Modal for editing a user */}
                <Modal isOpen={isOpenEditModal} onClose={() => setIsOpenEditModal(false)} title="Edit User" panelStyle={panelStyleEdit}>
                    <EditUser 
                        onClose={() => setIsOpenEditModal(false)}
                        userId = {selectedUserData?.id}
                        onSuccess={() => {
                            refreshData();
                            setIsOpenEditModal(false);
                        }}
                    />
                </Modal>

                {/* Modal for deleting a user */}
                <Modal isOpen={isOpenArchiveModal} onClose={() => setIsOpenArchiveModal(false)} panelStyle={panelStyleArchive}>
                    <ArchiveUser 
                        userId = {selectedUserData?.id}
                        onClose={() => setIsOpenArchiveModal(false)}
                        onSuccess={() => {
                            refreshData();
                            setIsOpenArchiveModal(false);
                        }}
                    />
                </Modal>
                
                {/* Modal for excel registration */}
                <Modal isOpen={isOpenBatchModal} onClose={() => setIsOpenBatchModal(false)} title="Register" panelStyle={panelStyleAddBatch}>
                    <BatchAddUser
                            onClose={() => setIsOpenBatchModal(false)}
                            onSuccess={() => {
                                refreshData();
                                setIsOpenBatchModal(false);
                            }}
                    />
                </Modal>
            </div>
        </>
    )
}