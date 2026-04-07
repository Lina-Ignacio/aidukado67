import * as XLSX from "xlsx";
import { useState } from "react";
import axios from "../../services/axiosConfig";
import { MdClose, MdDownload } from "react-icons/md";
import FileUploader from "../../components/FileUploader";

export default function BatchAddUser({ onClose, onSuccess }) {
    const [rows, setRows] = useState([]);
    const [uploadError, setUploadError] = useState("");
    const [success, setSuccess] = useState("");
    const [preview, setPreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError("");
        setSuccess("");
        setPreview([]);
        setValidationErrors([]);

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setRows(json);

                // Create preview (first 5 rows)
                const previewData = json.slice(0, 5);
                setPreview(previewData);

                // Validation for ALL mandatory columns
                const errors = [];
                const requiredColumns = ['first_name', 'last_name', 'email', 'password', 'role'];
                const columnVariations = {
                    'first_name': ['firstName', 'First Name', 'firstname'],
                    'last_name': ['lastName', 'Last Name', 'lastname'],
                    'email': ['Email', 'email_address', 'Email Address'],
                    'password': ['Password', 'pass'],
                    'role': ['Role', 'user_role']
                };

                json.forEach((row, index) => {
                    requiredColumns.forEach(col => {
                        const variations = [col, ...(columnVariations[col] || [])];
                        const hasColumn = variations.some(variation => row[variation] !== undefined);
                        
                        if (!hasColumn) {
                            errors.push(`Row ${index + 1}: Missing "${col}" column`);
                        } else {
                            // Check if value is empty
                            const value = variations.reduce((val, variation) => 
                                val || String(row[variation] || '').trim(), ''
                            );
                            if (!value) {
                                errors.push(`Row ${index + 1}: "${col}" cannot be empty`);
                            }
                        }
                    });
                });

                if (errors.length > 0) {
                    setValidationErrors(errors);
                }
            } catch (err) {
                setUploadError("Error reading file. Please ensure it's a valid Excel or CSV file.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (validationErrors.length > 0) {
            setUploadError("Please fix validation errors before uploading");
            return;
        }

        if (rows.length === 0) {
            setUploadError("No data found in file");
            return;
        }

        try {
            const transformedData = rows.map(row => ({
                first_name: String(row.first_name || row.firstName || row["First Name"] || row.firstname || "").trim(),
                last_name: String(row.last_name || row.lastName || row["Last Name"] || row.lastname || "").trim(),
                middle_name: String(row.middle_name || row.middleName || row["Middle Name"] || row.middlename || "").trim(),
                email: String(row.email || row.Email || row["Email Address"] || row.email_address || "").trim(),
                password: String(row.password || row.Password || row.pass || "").trim(),
                role: String(row.role || row.Role || row.user_role || "").toLowerCase().trim()
            })).filter(user => 
                user.first_name && 
                user.last_name && 
                user.email && 
                user.password && 
                user.role
            );

            if (transformedData.length === 0) {
                setUploadError("No valid rows found. Ensure all required columns are filled.");
                return;
            }

            console.log(transformedData);
            
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/user/batch_create`, 
                transformedData,
                {
                    headers: { "Content-Type": "application/json" }
                }
            );
            
            setSuccess(`${response.data.message || `${transformedData.length} users created successfully!`}`);
            setRows([]);
            setPreview([]);
            
            if (onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            }
            
        } catch (err) {
            if (err.response?.data?.detail) {
                setUploadError(err.response.data.detail);
            } else {
                setUploadError("Network Error. Please try again.");
            }
        }
    };

    // Function to download template Excel file
    const downloadTemplate = () => {
        // Define the columns in the specified order
        const templateData = [
            {
                first_name: "John",
                last_name: "Doe",
                email: "john.doe@example.com",
                password: "temporary123",
                role: "student",
                middle_name: "Robert"
            },
            {
                first_name: "Jane",
                last_name: "Smith",
                email: "jane.smith@example.com",
                password: "temporary456",
                role: "teacher",
                middle_name: ""
            }
        ];

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        
        // Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 15 }, // first_name
            { wch: 15 }, // last_name
            { wch: 25 }, // email
            { wch: 15 }, // password
            { wch: 12 }, // role
            { wch: 15 }  // middle_name
        ];

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User_Template");

        // Add instructions sheet
        const instructionsData = [
            { Instruction: "Required Columns (all must be filled except middle_name):", Details: "" },
            { Instruction: "first_name", Details: "User's first name (required)" },
            { Instruction: "last_name", Details: "User's last name (required)" },
            { Instruction: "email", Details: "User's email address - must be unique (required)" },
            { Instruction: "password", Details: "Temporary password for initial login (required)" },
            { Instruction: "role", Details: "User role: student, teacher, admin, etc. (required)" },
            { Instruction: "middle_name", Details: "User's middle name (optional - can be left empty)" },
            { Instruction: "", Details: "" },
            { Instruction: "Notes:", Details: "" },
            { Instruction: "•", Details: "All required columns must have values" },
            { Instruction: "•", Details: "Email addresses must be unique in the system" },
            { Instruction: "•", Details: "Passwords are temporary - users must change on first login" },
            { Instruction: "•", Details: "Role values are case-insensitive" },
            { Instruction: "•", Details: "Delete the example rows and add your actual data" },
            { Instruction: "•", Details: "Do not modify the column headers" }
        ];

        const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
        instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

        // Export the file
        XLSX.writeFile(workbook, "user_import_template.xlsx");
    };

    return (
        <div className="w-full h-auto flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-xl space-y-4 relative max-w-2xl mx-auto">
            
            {/* Close button */}
            <div 
                className="self-end cursor-pointer bg-[#EBECF1] rounded-full p-1
                    transition-transform duration-300 hover:scale-110 absolute top-4 right-4" 
                onClick={onClose}>
                <MdClose className="text-[#393E46] text-2xl" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-[#102E50] mb-2">Import Users From a File</h2>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-blue-800 font-semibold">File Format Instructions:</h3>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                            hover:bg-blue-700 transition-colors"
                    >
                        <MdDownload className="text-lg" />
                        Download Template
                    </button>
                </div>
                
                <div className="mb-4">
                    <p className="text-blue-700 text-sm mb-3">
                        Upload an <strong>Excel (.xlsx, .xls)</strong> or <strong>CSV (.csv)</strong> file with the following columns:
                    </p>
                    
                    <div className="bg-white p-4 border rounded mb-4">
                        <p className="text-blue-800 font-medium mb-2">Required Columns (all must be present and filled):</p>
                        <ul className="text-gray-700 text-sm space-y-2">
                            <li><strong>first_name</strong> (or firstName, First Name) - User's first name</li>
                            <li><strong>last_name</strong> (or lastName, Last Name) - User's last name</li>
                            <li><strong>email</strong> (or Email, Email Address) - User's email address</li>
                            <li><strong>password</strong> (or Password) - Temporary password for initial login</li>
                            <li><strong>role</strong> (or Role) - User role (student, teacher, admin, etc.)</li>
                        </ul>
                        
                        <p className="text-blue-800 font-medium mt-4 mb-2">Optional Column:</p>
                        <ul className="text-gray-700 text-sm">
                            <li><strong>middle_name</strong> (or middleName, Middle Name) - User's middle name (can be left empty)</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
                        <p className="text-yellow-800 font-medium mb-2">Important Notes:</p>
                        <ul className="text-yellow-700 text-sm space-y-1">
                            <li>• All columns except middle_name are <strong>mandatory and cannot be empty</strong></li>
                            <li>• Email addresses must be unique in the system</li>
                            <li>• The password will be used for initial login only - users will be required to change it on their first login</li>
                            <li>• Role values are case-insensitive (e.g., "Student" or "student" both work)</li>
                            <li>• Empty rows will be skipped automatically</li>
                            <li>• Column headers can use any of the variations mentioned above</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div className="w-full mb-4">
                <FileUploader 
                    type=".xlsx, .xls, .csv" 
                    handleFileChange={handleFileUpload}
                />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
                <div className="w-full mb-6">
                    <h3 className="text-[#102E50] font-semibold mb-2">Preview (first {preview.length} rows):</h3>
                    <div className="overflow-x-auto border rounded-lg max-h-60">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    {Object.keys(preview[0] || {}).map((header) => (
                                        <th key={header} className="p-2 text-left text-[#102E50] border-b whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="p-2 border-b text-[#102E50]">
                                                {value !== undefined && value !== null && value !== '' 
                                                    ? value 
                                                    : <span className="text-gray-400 italic">(empty)</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Total rows to process: {rows.length}
                    </p>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-red-800 font-semibold mb-2">Validation Issues ({validationErrors.length}):</h3>
                    <div className="max-h-40 overflow-y-auto">
                        {validationErrors.slice(0, 10).map((error, index) => (
                            <p key={index} className="text-red-600 text-sm mb-1">
                                • {error}
                            </p>
                        ))}
                        {validationErrors.length > 10 && (
                            <p className="text-red-600 text-sm">
                                ... and {validationErrors.length - 10} more issues
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            {success && (
                <div className="w-full mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">{success}</p>
                </div>
            )}
            
            {uploadError && !validationErrors.length && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">{uploadError}</p>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 w-full">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-200 text-[#102E50] font-medium rounded-lg
                        hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpload}
                    disabled={rows.length === 0 || validationErrors.length > 0}
                    className={`flex-1 py-3 text-lg rounded-lg font-medium transition ${
                        rows.length && validationErrors.length === 0
                        ? "bg-[#102E50] text-white hover:bg-[#0b223a]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    Register {rows.length > 0 ? `${rows.length} Users` : 'Users'}
                </button>
            </div>
        </div>
    );
}