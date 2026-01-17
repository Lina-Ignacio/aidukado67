import { useEffect, useState} from "react"
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "../../components/Modal";
import AddUser from "../Users/AddUser";
import BatchAddUser from "../Users/BatchAddUser";
import ArchiveUser from "../Users/ArchiveUser";
import EditUser from "../Users/EditUser";
import Table from "../../components/Table"
import SearchForm from "../../components/SearchForm";
import { MoonLoader } from "react-spinners";
import { FiUserPlus } from "react-icons/fi";
import { MdUploadFile, MdVpnKey } from "react-icons/md";
import ClassicButton from "../../components/classicButton";

export default function UserManagement() {
    const navigate = useNavigate();

    const classesColumns = [
    { id: 1, name: "ID", key: "id" },
    { id: 2, name: "Email", key: "email" },
    { id: 3, name: "Role", key: "role" },
    { id: 4, name: "FirstName", key: "firstName" },
    { id: 5, name: "LastName", key: "lastName" },
    { id: 6, name: "MiddleName", key: "middleName" }
  ];

    // for the tablee
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(false);
    
    const [fetchingError, setFetchtingError] = useState("");

    // for modal

    const [isOpen, setIsOpen] = useState(false);
    const [isOpenEditModal, setIsOpenEditModal]  = useState(false)
    const [isOpenArchiveModal, setIsOpenArchiveModal] = useState(false);
    const [isOpenBatchModal, setIsOpenBatchModal] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState(null);

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


    

    const panelStyleAdd = "w-full h-auto max-w-lg rounded-2xl shadow-xl"
    const panelStyleArchive = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleEdit = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const panelStyleAddBatch = "w-full h-auto max-w-lg rounded-xl shadow-xl"
    const pagination = [10, 12]
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
                            getUsers(); 
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
                            getUsers();
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
                            getUsers();
                            setIsOpenArchiveModal(false);
                        }
                            
                        }
                    />
                </Modal>
                
                {/* Modal for excel registration */}
                <Modal isOpen={isOpenBatchModal} onClose={() => setIsOpenBatchModal(false)} title="Register" panelStyle={panelStyleAddBatch}>
                    <BatchAddUser
                            onClose={() => setIsOpenBatchModal(false)}
                            onSuccess={() => {
                                getUsers();
                                setIsOpenBatchModal(false);
                            }}
                    />
                </Modal>
            </div>
        </>
    )
}