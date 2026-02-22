import { useState } from "react";
import { useNavigate } from "react-router-dom";;
import { MdLockReset, MdVisibility, MdVisibilityOff, MdInfoOutline } from "react-icons/md";
import axios from "../../api/axiosConfig"

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!passwordRegex.test(password)) {
      return setError("Password must have 8+ chars, 1 uppercase, 1 number, and 1 special char.");
    }

    setError("");
    setLoading(true);

    try {
        const response = await axios.patch(
            `${import.meta.env.VITE_API_URL}/user/change-password-first-login`,
            { newPassword: password },
            { 
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            }
            }
        );

        
        alert("Password updated successfully! Please log in with your new password.");
        navigate("/login"); 
        

        } catch (err) {
        setError(err.response?.data?.detail || "Failed to update password.");
        } finally {
        setLoading(false);
        }
    };

  return (
    <>
        <div className="grid lg:hidden justify-items-center w-full h-full px-5">
            <h1 className="font-extrabold text-xl md:text-3xl text-[#102E50] mt-[150px]">
                NOT AVAILABLE ON MOBILE AND TABLET!
            </h1>
        </div>

        <div className="min-h-screen bg-[#102E50] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
            <div className="inline-block p-4 bg-blue-50 rounded-full text-[#102E50] mb-4">
                <MdLockReset size={40} />
            </div>
            <h2 className="text-2xl font-bold text-[#102E50]">Security Update</h2>
            <p className="text-gray-500 text-sm mt-2">Please set a strong password to continue.</p>
            </div>

            {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 border border-red-200 text-center">
                {error}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Field */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#102E50] uppercase ml-1">New Password</label>
                <div className="relative flex items-center">
                <input
                    type={showPass ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 
                        focus:ring-[#102E50]/20 focus:border-[#102E50] outline-none transition text-[#102E50]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    tabIndex="-1"
                    className="absolute right-3 p-1 flex items-center justify-center 
                                text-gray-400 hover:text-[#102E50] 
                                outline-none focus:outline-none focus:ring-0 border-none bg-transparent 
                                transition-colors cursor-pointer"
                    onClick={() => setShowPass(!showPass)}
                    >
                    {showPass ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                </button>
                </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#102E50] uppercase ml-1">Confirm Password</label>
                <div className="relative flex items-center">
                <input
                    type={showPass ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 
                        focus:ring-[#102E50]/20 focus:border-[#102E50] outline-none transition text-[#102E50]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl flex gap-3 items-start border border-blue-100">
                <MdInfoOutline className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-[#102E50] leading-tight italic">
                    Requirement: 8+ characters, including Uppercase, Numbers, and Special characters (@$!%*?&).
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E78B48] hover:bg-[#B9652B] text-white font-bold rounded-xl shadow-lg transition active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? "SAVING..." : "UPDATE PASSWORD"}
            </button>
            </form>
        </div>
        </div>
    </>
  );
}