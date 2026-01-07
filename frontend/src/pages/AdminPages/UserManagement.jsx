import { useEffect, useState} from "react"
import axios from "axios";
import Modal from "../../components/Modal";
import AddUser from "../Users/AddUser";
import BatchAddUser from "../Users/BatchAddUser";
import DeleteUser from "../Users/DeleteUser";
import EditUser from "../Users/EditUser";
import Table from "../../components/Table"
import SearchForm from "../../components/SearchForm";
import { MoonLoader } from "react-spinners";
import { FiUserPlus } from "react-icons/fi";
import { MdUploadFile } from "react-icons/md";

export default function UserManagement() {

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
    const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
    const [isOpenBatchModal, setIsOpenBatchModal] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState(null);

    const getUsers = async() => {
        try {
            setLoading(true)
            const response = await axios.get("http://localhost:8000/user/get", {
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


    

    const panelStyleAdd = "w-full h-2/3 max-w-lg rounded-xl shadow-xl"
    const panelStyleDelete = "w-full h-1/3 max-w-lg rounded-xl shadow-xl"
    const panelStyleEdit = "w-full h-2/3 max-w-lg rounded-xl shadow-xl"
    const panelStyleAddBatch = "w-full h-1/3 max-w-lg rounded-xl shadow-xl"

    return (
        <>
            <div className="grid lg:hidden justify-items-center w-full h-full px-5">
                <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                    NOT AVAILABLE ON MOBILE AND TABLET!
                </h1>
            </div>

            <div className="hidden lg:flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center text-white">
                <div className="w-full h-auto grid grid-cols-[2.5fr_1fr_1fr] gap-2 2xl:w-11/12 self-end">
                    <SearchForm query={query} setQuery={setQuery} inputPlaceholder="Search by email or name"/>
                    <button 
                        className="bg-[#102E50] shadow-md lg:text-lg
                            flex justify-center items-center gap-2 w-3/4 place-self-end" 
                        onClick={() => (setIsOpen(true))}
                    >
                        <FiUserPlus className="text-lg xl:text-2xl 2xl:text-2xl"/>
                        <span className="text-md xl:text-lg 2xl:text-xxl">Add User</span> 
                    </button>
                    <button 
                        className="bg-[#102E50] shadow-md lg:text-lg
                            flex justify-center items-center gap-2" 
                        onClick={() => (setIsOpenBatchModal(true))}
                    >
                        <MdUploadFile className="text-lg xl:text-2xl 2xl:text-2xl"/>
                        <span className="text-md xl:text-lg 2xl:text-xl">Import Users</span> 
                    </button>
                </div>

                <div className="overflow-x-auto w-full mt-2">
                    {fetchingError && <p className="text-red-800">{fetchingError}</p>}
                    {!loading ? (
                    <Table
                        columns={classesColumns}
                        data={users}
                        setSelectedData={setSelectedUserData}
                        setIsOpenEditModal={setIsOpenEditModal}
                        setIsOpenDeleteModal={setIsOpenDeleteModal}
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

                <Modal isOpen={isOpenDeleteModal} onClose={() => setIsOpenDeleteModal(false)} panelStyle={panelStyleDelete}>
                    <DeleteUser 
                        userId = {selectedUserData?.id}
                        onClose={() => setIsOpenDeleteModal(false)}
                        onSuccess={() => {
                            getUsers();
                            setIsOpenDeleteModal(false);
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