import { useState } from "react";
import axios from "axios";
import FileUploader from "../../components/FileUploader";
import { LuUpload } from "react-icons/lu";

export default function UploadClasses({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [preview, setPreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError("");
        setSuccess("");
        setPreview([]);
        setValidationErrors([]);

        // Preview CSV content
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseCSVPreview(text);
        };
        reader.readAsText(selectedFile);
    };

    const parseCSVPreview = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            setError("CSV file must have at least 2 lines (header + data)");
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = [
            'course_code',
            'course_name',
            'teacher_email',
            'section',
            'room',
            'units',
            'schedule',
            'academic_year',
            'semester'
        ];

        // Validate headers
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            setError(`Missing required columns: ${missingHeaders.join(', ')}`);
            return;
        }

        // Parse preview (first 5 rows)
        const previewData = [];
        for (let i = 1; i < Math.min(6, lines.length); i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                previewData.push(row);
            }
        }

        setPreview(previewData);
    };

    const validateRow = (row, rowNum) => {
        const errors = [];

        // Required fields validation
        const requiredFields = [
            'course_code', 'course_name', 'teacher_email', 'section', 'room',
            'units', 'schedule', 'academic_year', 'semester'
        ];

        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
                errors.push(`Row ${rowNum}: ${field.replace('_', ' ')} is required`);
            }
        });

        // Course code validation (maps to DB "name" field)
        if (row.course_code && row.course_code.trim().length > 50) {
            errors.push(`Row ${rowNum}: course_code cannot exceed 50 characters`);
        }

        // Section validation
        if (row.section && row.section.trim().length > 10) {
            errors.push(`Row ${rowNum}: section cannot exceed 10 characters`);
        }

        // Room validation
        if (row.room && row.room.trim().length > 50) {
            errors.push(`Row ${rowNum}: room cannot exceed 50 characters`);
        }

        // Parse units from format "3" or "3/1"
        let lectureUnits = 0;
        let labUnits = 0;
        
        if (row.units) {
            const unitsMatch = row.units.match(/^(\d+)(?:\/(\d+))?$/);
            if (unitsMatch) {
                lectureUnits = parseInt(unitsMatch[1]) || 0;
                labUnits = parseInt(unitsMatch[2]) || 0;
            } else {
                errors.push(`Row ${rowNum}: units must be in format "3" or "3/1"`);
            }
        }

        // Units validation
        if (lectureUnits < 0 || lectureUnits > 10) {
            errors.push(`Row ${rowNum}: lecture units must be between 0-10`);
        }
        
        if (labUnits < 0 || labUnits > 10) {
            errors.push(`Row ${rowNum}: lab units must be between 0-10`);
        }

        // At least one unit must be > 0
        if (lectureUnits === 0 && labUnits === 0) {
            errors.push(`Row ${rowNum}: at least one unit (lecture or lab) must be greater than 0`);
        }

        // Academic year format validation (e.g., 2025-2026)
        if (row.academic_year && !/^\d{4}-\d{4}$/.test(row.academic_year)) {
            errors.push(`Row ${rowNum}: academic_year must be in format YYYY-YYYY`);
        }

        // Semester validation
        const validSemesters = ['1st semester', '2nd semester'];
        if (row.semester && !validSemesters.includes(row.semester.toLowerCase())) {
            errors.push(`Row ${rowNum}: semester must be '1st semester' or '2nd semester'`);
        }

        // Email validation
        if (row.teacher_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.teacher_email)) {
            errors.push(`Row ${rowNum}: Invalid teacher email format`);
        }

        // Store parsed units
        row.lecture_units = lectureUnits;
        row.lab_units = labUnits;

        return errors;
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a CSV file first");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvText = event.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length < 2) {
                setError("CSV file is empty or has no data rows");
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = [
                'course_code', 'course_name', 'teacher_email', 'section', 'room',
                'units', 'schedule', 'academic_year', 'semester'
            ];

            // Validate all headers
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                setError(`Missing required columns: ${missingHeaders.join(', ')}`);
                return;
            }

            // Validate all rows
            const allErrors = [];
            const validRows = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });

                    const rowErrors = validateRow(row, i);
                    if (rowErrors.length === 0) {
                        // Convert to backend format
                        const backendRow = {
                            course_code: row.course_code,           // Maps to DB "name"
                            course_name: row.course_name,           // Used for subject
                            section: row.section,                   // Same
                            room: row.room,                         // Same
                            schedule: row.schedule,                 // Same
                            academic_year: row.academic_year,       // Same
                            semester: row.semester,                 // Same
                            lecture_units: row.lecture_units,       // Parsed from units
                            lab_units: row.lab_units,               // Parsed from units
                            teacher_email: row.teacher_email        // Used for teacher
                        };
                        validRows.push(backendRow);
                    } else {
                        allErrors.push(...rowErrors);
                    }
                } else {
                    allErrors.push(`Row ${i}: Invalid number of columns`);
                }
            }

            if (allErrors.length > 0) {
                setValidationErrors(allErrors);
                setError(`Found ${allErrors.length} validation errors`);
                return;
            }

            if (validRows.length === 0) {
                setError("No valid rows found in CSV file");
                return;
            }

            // Send to backend
            setLoading(true);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/classes/bulk-upload`,
                    { classes: validRows },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                setSuccess(`${response.data.created} classes created successfully! ${response.data.skipped} duplicates skipped.`);
                setValidationErrors([]);
                
                // Clear file after successful upload
                setFile(null);
                setPreview([]);

                // Call success callback after delay
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 2000);

            } catch (err) {
                const errorMsg = err.response?.data?.detail || "Network Error";
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white 
                py-6 px-4 shadow-2xl rounded-lg max-w-2xl mx-auto"
        >
            <h2 className="text-xl font-bold text-[#102E50] mb-4">Upload Classes via CSV</h2>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                <h3 className="text-blue-800 font-semibold mb-2">CSV Format (Match Table Columns):</h3>
                <ul className="text-blue-600 text-sm list-disc pl-5 space-y-1">
                    <li>Required columns in this order: <code>course_code, course_name, teacher_email, section, room, units, schedule, academic_year, semester</code></li>
                    <li><strong>course_code</strong>: Course code (maps to "Course Code" in table)</li>
                    <li><strong>course_name</strong>: Full course name (maps to "Course Name" in table)</li>
                    <li><strong>teacher_email</strong>: Teacher's registered email (maps to "Teacher Name")</li>
                    <li><strong>section</strong>: Class section (e.g., IV-CS1)</li>
                    <li><strong>room</strong>: Room location</li>
                    <li><strong>units</strong>: Format "3" (lecture only) or "3/1" (3 lecture + 1 lab)</li>
                    <li><strong>schedule</strong>: Format "Days: Time" (e.g., "MW: 9:00am-12:00pm")</li>
                    <li><strong>academic_year</strong>: Format "YYYY-YYYY" (e.g., 2025-2026)</li>
                    <li><strong>semester</strong>: "1st semester" or "2nd semester"</li>
                </ul>
                <div className="mt-3 p-3 bg-white border rounded">
                    <p className="text-blue-800 text-sm font-semibold mb-1">Example CSV row:</p>
                    <code className="text-gray-700 text-sm">
                        CS101,Computer Science 101,teacher@example.com,IV-CS1,CB27,3/1,MW: 9:00am-12:00pm,2025-2026,1st semester
                    </code>
                </div>
            </div>

            {/* File Upload */}
            <div className="w-full mb-6">
                <FileUploader 
                    type=".csv" 
                    handleFileChange={handleFileChange} 
                />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
                <div className="w-full mb-6">
                    <h3 className="text-[#102E50] font-semibold mb-2">Preview (first 5 rows):</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {Object.keys(preview[0] || {}).map((header) => (
                                        <th key={header} className="p-2 text-left text-[#102E50] border-b">
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
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Total rows to process: {file ? (preview.length === 5 ? '5+' : preview.length) : 0}
                    </p>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-red-800 font-semibold mb-2">Validation Errors ({validationErrors.length}):</h3>
                    <div className="max-h-40 overflow-y-auto">
                        {validationErrors.slice(0, 10).map((error, index) => (
                            <p key={index} className="text-red-600 text-sm mb-1">
                                • {error}
                            </p>
                        ))}
                        {validationErrors.length > 10 && (
                            <p className="text-red-600 text-sm">
                                ... and {validationErrors.length - 10} more errors
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
            
            {error && !validationErrors.length && (
                <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">{error}</p>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 w-full">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-200 text-[#102E50] font-medium rounded-lg
                        hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !file}
                    className="flex-1 py-3 bg-[#10375C] text-white font-medium rounded-lg
                        hover:bg-[#102E50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <LuUpload />
                            Upload Classes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}