import { useState } from "react";
import axios from "axios";
import { MdClose } from "react-icons/md";

export default function AddUser({ onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    firstName: "",
    lastName: "",
    middleName: ""
  });

  const [errors, setErrors] = useState({}); // Stores validation errors like { firstName: "..." }
  const [apiError, setApiError] = useState(""); // Stores backend strings like "Email already exists"
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the specific error when user starts typing again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const currentErrors = {};
    if (!formData.firstName) currentErrors.firstName = "First name is required";
    if (!formData.lastName) currentErrors.lastName = "Last name is required";
    if (!formData.email) {
      currentErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      currentErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      currentErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      currentErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.role) currentErrors.role = "Please select a role";

    return currentErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/user/create", formData);
      setSuccess(`User Created: ${res.data.email}`);
      setFormData({ email: "", password: "", role: "", firstName: "", lastName: "", middleName: "" });
      if (onSuccess) onSuccess();
    } catch (err) {
      // Handle the backend error specifically
      setApiError(err.response?.data?.detail || "Something went wrong on the server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
                        focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200`;
  const labelClass = "text-[#102E50] font-bold opacity-75 mt-2";
  const errorSpan = "text-red-500 text-xs mt-1 font-medium";

  return (
    <div className="w-full max-w-lg flex flex-col bg-white p-6 shadow-xl rounded-xl">
      {/* Top Level Messages */}
      {apiError && <p className="bg-red-50 text-red-800 p-2 rounded text-sm mb-4">{apiError}</p>}
      {success && <p className="bg-green-50 text-green-800 p-2 rounded text-sm mb-4">{success}</p>}

      <div 
          className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1 
              transition-transform duration-300 hover:scale-110" 
          onClick={onClose}
      >
        <MdClose className="text-[#393E46] text-2xl" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2 text-left">
        
        {/* First Name */}
        <label className={labelClass}>First Name:</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
        {errors.firstName && <span className={errorSpan}>{errors.firstName}</span>}

        {/* Last Name */}
        <label className={labelClass}>Last Name:</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
        {errors.lastName && <span className={errorSpan}>{errors.lastName}</span>}

        {/* Middle Name (Optional) */}
        <label className={labelClass}>Middle Name (Optional):</label>
        <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={inputClass} />

        {/* Email */}
        <label className={labelClass}>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
        {errors.email && <span className={errorSpan}>{errors.email}</span>}

        {/* Password */}
        <label className={labelClass}>Password:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} />
        {errors.password && <span className={errorSpan}>{errors.password}</span>}

        {/* Role */}
        <label className={labelClass}>Role:</label>
        <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
          <option value="">Select a role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <span className={errorSpan}>{errors.role}</span>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-3 bg-[#10375C] text-white font-bold transition-all duration-200 
                     hover:bg-[#0a2642] active:scale-95 shadow-md rounded-xl disabled:opacity-50"
        >
          {loading ? "SUBMITTING..." : "SUBMIT"}
        </button>
      </form>
    </div>
  );
}