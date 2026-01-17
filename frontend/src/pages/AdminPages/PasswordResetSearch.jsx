import { useState, useEffect } from "react";
import axios from "axios";
import { MdArrowBack, MdSearch, MdVpnKey } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import ResetPasswordModalContent from "../Users/ResetPasswordModalContent";

export default function PasswordResetSearch() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Search logic with debounce
    useEffect(() => {
        if (query.trim() === "") {
            setUsers([]);
            return;
        }
        const delay = setTimeout(async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/get`, { params: { query } });
                setUsers(res.data);
            } catch (err) { console.error(err); }
        }, 400);
        return () => clearTimeout(delay);
    }, [query]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="grid lg:hidden justify-items-center w-full h-full px-5">
                <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                    NOT AVAILABLE ON MOBILE AND TABLET!
                </h1>
            </div>
            
            <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
            <div className="w-full max-w-2xl flex items-center gap-4 mb-12">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-[#102E50]">
                    <MdArrowBack size={24} />
                </button>
                <h1 className="text-3xl font-bold text-[#102E50]">Account Recovery Center</h1>
            </div>

            <div className="w-full max-w-2xl">
                <div className="relative mb-8">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl" />
                    <input 
                        type="text"
                        placeholder="Search student or teacher name/email..."
                        className="w-full h-auto pl-12 text-sm md:text-base py-3
                            bg-white border border-2 border-[#EBECF1] rounded-xl text-[#102E50]
                            focus:ring-2 focus:ring[#EBECF1]/90 focus:border-[#EBECF1]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="grid gap-4">
                    {users.map(user => (
                        <div 
                            key={user.id}
                            className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center border border-transparent hover:border-[#102E50] transition-all cursor-pointer group"
                            onClick={() => handleSelectUser(user)}
                        >
                            <div>
                                <h3 className="font-bold text-[#102E50] text-lg">{user.firstName} {user.lastName}</h3>
                                <p className="text-gray-500">{user.email} • <span className="capitalize">{user.role}</span></p>
                            </div>
                            <div className="bg-[#F3F4F6] group-hover:bg-[#102E50] group-hover:text-white p-3 rounded-full transition-colors">
                                <MdVpnKey size={20} />
                            </div>
                        </div>
                    ))}
                    {query && users.length === 0 && <p className="text-center text-gray-400">No accounts found.</p>}
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title=""
                panelStyle="w-full max-w-md rounded-2xl bg-[#102E50]"
            >
                <ResetPasswordModalContent 
                    user={selectedUser} 
                    onClose={() => setIsModalOpen(false)} 
                />
            </Modal>
        </div>
        </>
    );
}