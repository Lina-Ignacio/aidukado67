import { useState, useEffect } from "react"
import { MdClose } from "react-icons/md";
import axios from "axios";

export default function EditUser({ userId, onClose, onSuccess }) {

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    middleName: "",
    role: ""
  });

  const getUser = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/getById/${userId}`);
      setFormData({
        email: response.data.email,
        role: response.data.role,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        middleName: response.data.middleName
      });
    } catch (err) {
      console.error("Error fetching user: ", err);
    }
  };

  useEffect(() => {
    if (userId) {
      getUser();
    }
  }, [userId]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const currentErrors = {};

    if (!formData.email) {
      currentErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      currentErrors.email = "Email is invalid";
    }

    if (!formData.role) {
      currentErrors.role = "Role is required";
    }

    if (!formData.firstName) {
      currentErrors.firstName = "First Name is required";
    }

    if (!formData.lastName) {
      currentErrors.lastName = "Last Name is required";
    }

    return currentErrors;
  };

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
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/user/patch/${userId}`, {
        email: formData.email,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName
      });

      setSuccess(`User Modified: ${res.data.email}`);

      setFormData({
        email: "",
        role: "",
        firstName: "",
        lastName: "",
        middleName: ""
      });

      if (onSuccess) onSuccess();
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

  const inputClass =`w-full p-2 rounded-lg border border-gray-300 bg-gray-100 text-md text-[#102E50] 
            focus:outline-none focus:ring-2 focus:ring-[#102E50]/40 transition duration-200`;
  const labelClass = "text-[#102E50] font-bold opacity-75";

  return (
    <div className="w-full max-w-lg flex flex-col bg-white p-6 shadow-xl rounded-xl h-auto">
      {errors.api && <p className="text-red-800">{errors.api}</p>}
      {success && <p className="text-green-800">{success}</p>}
      <div 
          className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1 
              transition-transform duration-300 hover:scale-110" 
          onClick={onClose}
      >
        <MdClose className="text-[#393E46] text-2xl" />
      </div>
      <form
        method="post"
        onSubmit={handleSubmit}
        className="flex flex-col h-auto w-full gap-2 text-left"
      >
        <label htmlFor="firstName" className={labelClass}>
          First Name:
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className={inputClass}
        />

        <label htmlFor="lastName" className={labelClass}>
          Last Name:
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className={inputClass}
        />

        <label htmlFor="middleName" className={labelClass}>
          Middle Name:
        </label>
        <input
          type="text"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange}
          className={inputClass}
        />

        <label htmlFor="email" className={labelClass}>
          Email:
        </label>
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
        />

        <label htmlFor="role" className={labelClass}>
          Role
        </label>
        <select
          value={formData.role}
          name="role"
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Select a role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        <button
          type="submit"
          className="w-full mt-3 bg-[#10375C] text-white transition-all duration-200 
                     hover:bg-[#0a2642] active:scale-95 shadow-md xl:text-lg p-2"
        >
          {loading ? "SUBMITTING..." : "SUBMIT"}
        </button>
      </form>
    </div>
  );
}
