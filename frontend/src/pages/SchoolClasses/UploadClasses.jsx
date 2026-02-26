import { useState } from "react";
import axios from "../../services/axiosConfig";
import * as XLSX from "xlsx";
import FileUploader from "../../components/FileUploader";
import { LuUpload } from "react-icons/lu";

export default function UploadClasses({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [preview, setPreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
            return;
        }

        setFile(selectedFile);
        setError("");
        setSuccess("");
        setPreview([]);
        setValidationErrors([]);

        try {
            if (fileExtension === '.csv') {
                await parseCSVFile(selectedFile);
            } else {
                await parseExcelFile(selectedFile);
            }
        } catch (err) {
            setError(`Failed to parse file: ${err.message}`);
        }
    };

    const parseCSVFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    parseCSVPreview(text);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read CSV file"));
            reader.readAsText(file);
        });
    };

    const fixExcelUnits = (value) => {
        if (!value) return '';
        
        const strValue = String(value).trim();
        
        if (/^\d{5,}$/.test(strValue)) {
            const num = parseInt(strValue);
            
            const dateToUnitsMap = {
                45957: '2/1',
                46082: '3/1',
                46113: '4/1',
                46143: '5/1',
                46174: '6/1',
                46204: '7/1',
                46235: '8/1',
                46266: '9/1',
                46296: '10/1',
                46327: '11/1',
                46357: '12/1',
                43831: '1/1',
                44197: '1/2',
                44562: '1/3',
                44927: '1/4',
                45292: '1/5',
                45657: '1/6',
                46022: '1/7',
            };
            
            if (dateToUnitsMap[num]) {
                return dateToUnitsMap[num];
            }
            
            const excelEpoch = new Date(1899, 11, 30);
            const actualDate = new Date(excelEpoch.getTime() + num * 86400000);
            const month = actualDate.getMonth() + 1;
            const day = actualDate.getDate();
            
            if (day === 1 && month >= 1 && month <= 12) {
                return `${month}/1`;
            } else if (month === 1 && day >= 1 && day <= 31) {
                return `1/${day}`;
            } else if (day <= 31 && month <= 12) {
                return `${month}/${day}`;
            }
        }
        
        return strValue;
    };

    const parseExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: false,
                        raw: false,
                        cellNF: true
                    });
                    
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1, 
                        raw: false,
                        defval: '' 
                    });
                    
                    if (jsonData.length < 2) {
                        reject(new Error("Excel file must have at least 2 rows (header + data)"));
                        return;
                    }
                    
                    const headers = jsonData[0].map(header => 
                        String(header || '').trim().toLowerCase().replace(/\s+/g, '_')
                    );
                    
                    const headerMapping = {
                        'course_code': ['course_code', 'code', 'course'],
                        'teacher_email': ['teacher_email', 'teacher', 'email', 'instructor_email'],
                        'section': ['section'],
                        'room': ['room', 'location', 'classroom'],
                        'units': ['units', 'credit', 'credits'],
                        'schedule': ['schedule', 'time', 'class_time'],
                    };
                    
                    const columnIndices = {};
                    Object.keys(headerMapping).forEach(expectedHeader => {
                        const possibleNames = headerMapping[expectedHeader];
                        for (let i = 0; i < headers.length; i++) {
                            if (possibleNames.includes(headers[i])) {
                                columnIndices[expectedHeader] = i;
                                break;
                            }
                        }
                    });
                    
                    const requiredColumns = [
                        'course_code', 'teacher_email', 'section', 'room', 'units', 'schedule'
                    ];
                    
                    const missingColumns = requiredColumns.filter(col => columnIndices[col] === undefined);
                    if (missingColumns.length > 0) {
                        reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
                        return;
                    }
                    
                    const csvLines = [];
                    csvLines.push(requiredColumns.join(','));
                    
                    for (let i = 1; i < Math.min(6, jsonData.length); i++) {
                        const row = jsonData[i];
                        if (row && row.length > 0) {
                            const csvRow = requiredColumns.map(col => {
                                let value = row[columnIndices[col]] || '';
                                value = String(value).trim();
                                
                                if (col === 'units') {
                                    value = fixExcelUnits(value);
                                }
                                
                                return value;
                            });
                            csvLines.push(csvRow.join(','));
                        }
                    }
                    
                    parseCSVPreview(csvLines.join('\n'));
                    resolve();
                    
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read Excel file"));
            reader.readAsArrayBuffer(file);
        });
    };

    const parseCSVPreview = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            setError("File must have at least 2 lines (header + data)");
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = [
            'course_code', 'teacher_email', 'section', 'room', 'units', 'schedule'
        ];

        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            setError(`File must contain these exact columns: ${requiredHeaders.join(', ')}`);
            return;
        }

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

        const requiredFields = [
            'course_code', 'teacher_email', 'section', 'room', 'units', 'schedule'
        ];

        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
                errors.push(`Row ${rowNum}: ${field.replace('_', ' ')} is required`);
            }
        });

        if (row.course_code && row.course_code.trim().length > 15) {
            errors.push(`Row ${rowNum}: course_code cannot exceed 15 characters`);
        }

        if (row.section && row.section.trim().length > 10) {
            errors.push(`Row ${rowNum}: section cannot exceed 10 characters`);
        }

        if (row.room && row.room.trim().length > 50) {
            errors.push(`Row ${rowNum}: room cannot exceed 50 characters`);
        }

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

        if (lectureUnits < 0 || lectureUnits > 10) {
            errors.push(`Row ${rowNum}: lecture units must be between 0-10`);
        }
        
        if (labUnits < 0 || labUnits > 10) {
            errors.push(`Row ${rowNum}: lab units must be between 0-10`);
        }

        if (lectureUnits === 0 && labUnits === 0) {
            errors.push(`Row ${rowNum}: at least one unit (lecture or lab) must be greater than 0`);
        }

        if (row.teacher_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.teacher_email)) {
            errors.push(`Row ${rowNum}: Invalid teacher email format`);
        }

        row.lecture_units = lectureUnits;
        row.lab_units = labUnits;

        return errors;
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please select a CSV or Excel file first");
            return;
        }

        setLoading(true);
        try {
            const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            let csvContent = "";

            if (fileExtension === '.csv') {
                csvContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = () => reject(new Error("Failed to read CSV file"));
                    reader.readAsText(file);
                });
            } else {
                csvContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = new Uint8Array(event.target.result);
                            const workbook = XLSX.read(data, { 
                                type: 'array',
                                cellDates: false,
                                raw: false,
                                cellNF: true
                            });
                            
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                                header: 1, 
                                raw: false,
                                defval: '' 
                            });
                            
                            const headers = jsonData[0].map(header => 
                                String(header || '').trim().toLowerCase().replace(/\s+/g, '_')
                            );
                            
                            const headerMapping = {
                                'course_code': ['course_code', 'code', 'course'],
                                'teacher_email': ['teacher_email', 'teacher', 'email', 'instructor_email'],
                                'section': ['section'],
                                'room': ['room', 'location', 'classroom'],
                                'units': ['units', 'credit', 'credits'],
                                'schedule': ['schedule', 'time', 'class_time'],
                            };
                            
                            const columnIndices = {};
                            Object.keys(headerMapping).forEach(expectedHeader => {
                                const possibleNames = headerMapping[expectedHeader];
                                for (let i = 0; i < headers.length; i++) {
                                    if (possibleNames.includes(headers[i])) {
                                        columnIndices[expectedHeader] = i;
                                        break;
                                    }
                                }
                            });
                            
                            const requiredColumns = [
                                'course_code', 'teacher_email', 'section', 'room', 'units', 'schedule'
                            ];
                            
                            const csvLines = [];
                            csvLines.push(requiredColumns.join(','));
                            
                            for (let i = 1; i < jsonData.length; i++) {
                                const row = jsonData[i];
                                if (row && row.length > 0) {
                                    const csvRow = requiredColumns.map(col => {
                                        let value = row[columnIndices[col]] || '';
                                        value = String(value).trim();
                                        
                                        if (col === 'units') {
                                            value = fixExcelUnits(value);
                                        }
                                        
                                        return value;
                                    });
                                    csvLines.push(csvRow.join(','));
                                }
                            }
                            
                            resolve(csvLines.join('\n'));
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = () => reject(new Error("Failed to read Excel file"));
                    reader.readAsArrayBuffer(file);
                });
            }

            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length < 2) {
                setError("File is empty or has no data rows");
                setLoading(false);
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = [
                'course_code', 'teacher_email', 'section', 'room', 'units', 'schedule'
            ];

            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                setError(`File must contain these exact columns: ${requiredHeaders.join(', ')}`);
                setLoading(false);
                return;
            }

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
                        const backendRow = {
                            course_code: row.course_code,
                            section: row.section,
                            room: row.room,
                            schedule: row.schedule,
                            lecture_units: row.lecture_units,
                            lab_units: row.lab_units,
                            teacher_email: row.teacher_email
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
                setLoading(false);
                return;
            }

            if (validRows.length === 0) {
                setError("No valid rows found in file");
                setLoading(false);
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/classes/bulk-upload`,
                { classes: validRows },
                { headers: { 'Content-Type': 'application/json' } }
            );

            setSuccess(`${response.data.created} classes created successfully! ${response.data.skipped} duplicates skipped.`);
            setValidationErrors([]);
            
            setFile(null);
            setPreview([]);

            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2000);

        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || "Upload failed";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-auto flex flex-col justify-center items-center bg-white 
                py-6 px-4 shadow-2xl rounded-lg max-w-2xl mx-auto"
        >
            <h2 className="text-xl font-bold text-[#102E50] mb-4">Upload Classes via CSV/Excel</h2>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                <h3 className="text-blue-800 font-semibold mb-2">File Format Requirements:</h3>
                <ul className="text-blue-600 text-sm list-disc pl-5 space-y-1">
                    <li>Supported formats: CSV, Excel (.csv, .xlsx, .xls)</li>
                    <li><strong>Required columns:</strong> <code>course_code, teacher_email, section, room, units, schedule</code></li>
                    <li>Classes will be assigned to the current active semester automatically</li>
                    <li>Excel files will automatically detect columns with similar names</li>
                </ul>
                
                <div className="mt-3 p-3 bg-white border rounded">
                    <p className="text-blue-800 text-sm font-semibold mb-1">Column Formats:</p>
                    <ul className="text-gray-700 text-sm space-y-1">
                        <li><code>course_code</code>: Course code (max 15 chars)</li>
                        <li><code>teacher_email</code>: Teacher's registered email address</li>
                        <li><code>section</code>: Class section (max 10 chars)</li>
                        <li><code>room</code>: Room location (max 50 chars)</li>
                        <li><code>units</code>: Format "3" (lecture only) or "3/1" (3 lecture + 1 lab)</li>
                        <li><code>schedule</code>: Class schedule (e.g., "MW: 9:00am-12:00pm")</li>
                    </ul>
                </div>

                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm font-semibold mb-1">For Excel files:</p>
                    <ul className="text-yellow-700 text-sm list-disc pl-5 space-y-1">
                        <li>The <strong>units column</strong> should be formatted as <strong>Text</strong> to prevent Excel from converting fractions to dates</li>
                        <li>Or use an apostrophe before values: <code>'3/1</code></li>
                        <li>Common units like 3/1, 2/1 will be automatically converted if Excel treats them as dates</li>
                    </ul>
                </div>
            </div>

            {/* File Upload */}
            <div className="w-full mb-6">
                <FileUploader 
                    type=".csv,.xlsx,.xls" 
                    handleFileChange={handleFileChange} 
                />
                {file && (
                    <p className="text-sm text-green-600 mt-2">
                        Selected: {file.name} ({file.type || file.name.split('.').pop().toUpperCase()} format)
                    </p>
                )}
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
                    disabled={loading}
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