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

            <div className="hidden lg:grid relative rounded-r-[20%] bg-[#102E50] w-full h-full justify-items-center content-center gap-5 p-[30px]">
                <div className="bg-white/90 w-[80px] h-[75px] flex rounded-full mb-4">
                    <h1 className="text-[#102E50] m-auto font-bold lg:text-2xl xl:text-4xl 2xl:text-5xl">A</h1>
                </div>
                <h1 className="lg:text-[40px] xl:text-[55px] font-bold text-white text-center">
                    WELCOME BACK !
                </h1>
                <p className="text-white/90 lg:text-md xl:text-lg text-center max-w-md">
                    Aidukado is an AI-assisted LMS that enhances learning through smart content generation and automation.
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

                    <a className="text-[#102E50]/80 self-end">Forgot Password?</a>
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