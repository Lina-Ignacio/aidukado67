import { useState } from "react";
import axios from "axios";
import { MdContentCopy, MdCheckCircle, MdError } from "react-icons/md";

export default function ResetPasswordModalContent({ user, onClose }) {
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ type: "", message: "" });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!tempPassword) return;

    setLoading(true);
    setResult({ type: "", message: "" });

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/user/reset-password/${user.id}`, {
        new_password: tempPassword,
      });

      setResult({
        type: "success",
        message: `Successfully reset password for ${user.firstName}.`,
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err.response?.data?.detail || "Failed to update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-auto p-2">

      <div className="mb-8 text-center">
        <p className="text-white text-md">Account:</p>
        <h3 className="text-xl font-bold text-white">
          {user?.firstName} {user?.lastName}
        </h3>
        <p className="text-xs text-[#E78B48] font-mono">{user?.email}</p>
      </div>

      {result.message ? (
        <div className="flex flex-col items-center py-4">
          {result.type === "success" ? (
            <MdCheckCircle className="text-green-500 text-5xl mb-2" />
          ) : (
            <MdError className="text-red-500 text-5xl mb-2" />
          )}
          <p className={`text-center font-medium ${result.type === 'success' ? 'text-white' : 'text-red-800'}`}>
            {result.message}
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-1/3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="bg-white h-auto px-4 py-6 rounded-2xl relative flex flex-col">
          {/* shadow */}
          <div className="absolute h-[2%] w-full bg-black/20 bottom-0 left-0 rounded-2xl"></div>

          <div className="relative mb-4 flex flex-col">
            <label className="text-xs font-bold text-gray-600 uppercase ml-2 mb-1">
              Temporary Password
            </label>

            <div className="flex gap-2 mt-1">
              <input
                autoFocus
                type="text"
                className="w-full px-2 py-2 rounded-lg border border-gray-300
                    bg-gray-100 text-lg text-[#102E50] placeholder:text-md text-md
                    placeholder:text-gray-600 focus:outline-none focus:ring-2 
                    focus:ring-[#102E50]/40 focus:border-[#102E50] transition duration-200"
                            
                placeholder="Enter password..."
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!tempPassword}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600 transition disabled:opacity-50"
                title="Copy to clipboard"
              >
                {copied ? <MdCheckCircle className="text-green-600" /> : <MdContentCopy />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
            <p className="text-xs text-[#102E50] leading-tight">
              <strong>Note:</strong> The user will be required to create a new password
              the next time they log in.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold rounded-xl text-[#102E50]
                 transition bg-[#F3F4F6] transition-all duration-200 ease-in-out
                  hover:brightness-110 hover:shadow-lg active:scale-95 active:brightness-90"
                  
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !tempPassword}
              className="flex-1 py-3 bg-[#102E50] text-white font-bold rounded-xl hover:bg-[#0a2642] shadow-lg disabled:opacity-50 transition"
            >
              {loading ? "SAVING..." : "UPDATE"}
            </button>
         </div>
        </form>
      )}
    </div>
  );
}