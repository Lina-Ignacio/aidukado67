import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "../services/axiosConfig";
import useUserStore from "../store/useUserStore";
import { MdPerson, MdEmail, MdSecurity, MdVisibility, MdVisibilityOff } from "react-icons/md";


export default function Login() {
    console.log('Axios test:', {
        withCredentials: axios.defaults?.withCredentials,
        isConfigured: !!axios.interceptors?.request
    });

    const navigate = useNavigate();

    const storeUser = useUserStore((state) => state.storeUser);
    
    const [formData, setFormData] = useState({
        email : "",
        password : ""
    })
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    // For Password Showing
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({ ...prev, [name]: value}));
    }

    const validate = () => {
        const currentErrors = {};
        if (!formData.email) {
            currentErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            currentErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            currentErrors.password = "Password is required";
        }

        return currentErrors;

    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/login`, 
                formData, 
                { 
                    headers: { "Content-Type": "application/json" },
                    
                    withCredentials: true 
                }
            );

            
            const { id, role, must_change_password, email, first_name } = response.data;
            console.log(must_change_password);

            setSuccess(`User ${email} authenticated`);
            setFormData({ email: "", password: "" });

            storeUser(id, role, email, first_name);
            sessionStorage.clear(); 

            
            if (must_change_password) {
                navigate("/force-change-password");
            } else {
                navigate("/dashboard"); 
            }

        } catch (err) {
            if (err.response?.data?.detail) {
                setErrors({ api: err.response.data.detail });
            } else {
                setErrors({ api: "Network Error" });
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[4.5fr_5.5fr] h-screen w-screen bg-white">

            <div className="hidden lg:grid relative rounded-r-[20%] bg-[#102E50] w-full h-full justify-items-center content-center overflow-hidden">   
        
                <div className="bg-white/95 w-[85px] h-[85px] flex rounded-full mb-6 justify-center items-center shadow-xl relative group transition-transform duration-300 hover:scale-105">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E78B48]/20 to-transparent"></div>
                    <h1 className="text-[#102E50] font-bold lg:text-3xl xl:text-5xl 2xl:text-6xl relative z-10">A</h1>
                </div>
                
                
                <h1 className="lg:text-[40px] xl:text-[55px] 2xl:text-[65px] font-bold text-[#E78B48] text-center mb-4 relative">
                    WELCOME BACK!
                </h1>
                
                {/* Subheading with improved typography */}
                <p className="text-white/90 lg:text-md xl:text-xl 2xl:text-2xl text-center max-w-2xl mb-3 font-light tracking-wide">
                    AIDUKADO: AI-Assisted Learning Management System
                </p>
                
                
                <p className="text-white/70 lg:text-md xl:text-lg 2xl:text-xl text-center max-w-xl italic">
                    "Turning Automation and AI into Better Learning Experiences"
                </p>
                
            </div>



            <div className="flex w-full h-full bg-white justify-center items-center flex-col">
                {success && <p className="text-green-800">{success}</p>}
                
                <form 
                    onSubmit={handleSubmit}
                    className="bg-transparent backdrop-blur-md w-3/4 sm:w-3/5 lg:w-1/2 flex justify-center flex-col gap-8 rounded-3xl p-4"
                >
                    <h1 className="text-[40px] font-extrabold text-[#102E50] text-center mb-5">
                        Login
                    </h1>

                    <div className="relative">
                        <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-[#102E50] text-2xl" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            className="w-full px-12 py-3 rounded-lg border border-gray-300
                                bg-gray-100 text-lg text-[#102E50] placeholder:font-semibold
                                placeholder:text-gray-600 focus:outline-none focus:ring-2 
                                focus:ring-[#102E50]/40 focus:border-[#102E50] transition duration-200
                            "
                        />
                    </div>

                    <div className="relative">
                        <MdSecurity className="absolute left-4 top-1/2 -translate-y-1/2 text-[#102E50] text-2xl" />
                        <input
                            type={showPassword? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full px-12 py-3 rounded-lg border border-gray-300 bg-gray-100
                                text-lg text-[#102E50] placeholder:font-semibold placeholder:text-gray-600
                                focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 focus:border-[#102E50]
                                transition duration-200"
                        />
                        {showPassword? 
                            <MdVisibility 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#102E50] text-2xl" 
                                onClick={togglePasswordVisibility}
                            /> :
                            <MdVisibilityOff 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#102E50] text-2xl" 
                                onClick={togglePasswordVisibility}
                            />
                        }
                    </div>

                    {/* <a className="text-[#102E50]/80 self-end">Forgot Password?</a> */}
                    <NavLink 
                        className="text-[#102E50]/80 self-end"
                        to="/ForgotPasswordPage"
                    >
                        Forgot Password?
                    </NavLink>
                    <button 
                        disabled={loading} 
                        className={`p-3 bg-[#102E50] ${loading && "opacity-50"} rounded-lg text-white 
                        font-bold lg:text-[20px] hover:bg-[#E78B48] focus:outline-none transition duration-200
                        xl:text-lg p-2`}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {errors.api && <p className="text-red-800">{errors.api}</p>}
                </form>
            </div>

            
        </div>
    )
}