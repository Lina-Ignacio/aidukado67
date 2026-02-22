import { useState, useEffect } from "react";
import axios from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";
import StudentTable from "../components/StudentTable";
import { 
    MdArrowBack, 
    MdGroup, 
    MdDownload, 
    MdPrint, 
    MdSearch
} from "react-icons/md";
import useClassStore from "../store/useClassStore";
import ClassicButton from "../components/classicButton";
import UserDropup from "../components/DropUp/UserDropUp";

export default function StudentList() {
    const classId = useClassStore((state) => state.classId);
    const className = useClassStore((state) => state.className);
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classInfo, setClassInfo] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    
    // Filter students based on search
    const filteredStudents = students.filter(student => {
        const fullName = `${student.last_name || ''} ${student.first_name || ''} ${student.middle_name || ''}`.toLowerCase();
        const email = (student.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || email.includes(search);
    });
    
    // Table columns definition
    const columns = [
        {
            id: "number",
            name: "#",
            key: "number"
        },
        {
            id: "fullName",
            name: "Student Name",
            key: "fullName"
        },
        {
            id: "email",
            name: "Email Address",
            key: "email"
        }
    ];
    
    // Format data for the table
    const tableData = filteredStudents.map((student, index) => ({
        id: student.id,
        number: index + 1,
        fullName: formatFullName(student),
        email: student.email
    }));
    
    // Helper function to format full name
    function formatFullName(student) {
        if (student.full_name) {
            return student.full_name;
        }
        
        const middleInitial = student.middle_name 
            ? ` ${student.middle_name.charAt(0)}.`
            : "";
        return `${student.last_name}, ${student.first_name}${middleInitial}`;
    }
    
    // Fetch students for the class
    const fetchStudents = async () => {
        if (!classId) {
            setError("No class ID provided");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/${classId}/students`,
                { 
                    withCredentials: true,
                    params: { include_class_info: true },
                    timeout: 20000 
                }
            );
            
            // Handle different response structures
            if (Array.isArray(response.data)) {
                setStudents(response.data);
                setClassInfo({
                    name: `Class ${classId}`,
                    totalStudents: response.data.length
                });
            } else if (response.data.students) {
                setStudents(response.data.students);
                setClassInfo({
                    name: response.data.class_name || `Class ${classId}`,
                    totalStudents: response.data.total_students || response.data.students.length
                });
            } else {
                setStudents([]);
            }
            
        } catch (err) {
            let errorMessage = "Failed to load students";
            
            if (err.response) {
                errorMessage = err.response.data?.detail || 
                             err.response.data?.message || 
                             `Server error: ${err.response.status}`;
            } else if (err.request) {
                errorMessage = "No response from server. Check if backend is running.";
            } else {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    // Export to CSV function
    const exportToCSV = () => {
        const headers = ["Number", "Last Name", "First Name", "Middle Name", "Email"];
        
        const csvContent = [
            headers.join(","),
            ...students.map((student, index) => [
                index + 1,
                `"${student.last_name}"`,
                `"${student.first_name}"`,
                `"${student.middle_name || ''}"`,
                `"${student.email}"`
            ].join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `students_class_${classId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Print function
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Student List - Class ${className || classId}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #102E50; }
                        h2 { color: #E78B48; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #102E50; color: white; padding: 10px; text-align: left; }
                        td { padding: 8px; border-bottom: 1px solid #ddd; }
                        .header { margin-bottom: 20px; }
                        .timestamp { color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${className || 'Class'} Student List</h1>
                        <p>Class ID: ${classId}</p>
                        <p>Total Students: ${students.length}</p>
                        <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Name</th>
                                <th>Email Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map((student, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${formatFullName(student)}</td>
                                    <td>${student.email}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };
    
    // Fetch data on component mount
    useEffect(() => {
        if (classId) {
            fetchStudents();
        } else {
            setError("No class ID found");
            setLoading(false);
        }
    }, [classId]);
    
    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center mb-6">
                    <ClassicButton 
                        buttonName="Back"
                        icon={MdArrowBack}
                        onClick={() => navigate(-1)}
                        className="xl:w-1-/4 mb-4" 
                        mainColor="#E78B48" 
                        darkColor="#B9652B"
                    />
                </div>
                
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E78B48] border-t-[#102E50] mx-auto"></div>
                        <p className="mt-6 text-xl font-medium text-[#102E50]">Loading students...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-end mb-6">
                    <ClassicButton 
                        buttonName="Back"
                        icon={MdArrowBack}
                        onClick={() => navigate(-1)}
                        className="xl:w-1-/4 mb-4" 
                        mainColor="#E78B48" 
                        darkColor="#B9652B"
                    />
                </div>
                
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-red-200 p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MdGroup className="text-3xl text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-700 mb-3">Error Loading Students</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Go Back
                            </button>
                            <button 
                                onClick={fetchStudents}
                                className="px-6 py-3 bg-[#102E50] text-white rounded-lg hover:bg-[#0A1F33] transition-colors duration-200"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <UserDropup />
            {/* Header Section */}
            <div className="mb-8">
                <ClassicButton 
                    buttonName="Back"
                    icon={MdArrowBack}
                    onClick={() => navigate(-1)}
                    className="xl:w-1-/4 mb-4 place-self-start" 
                    mainColor="#E78B48" 
                    darkColor="#B9652B"
                />
                
                {/* Class Info Card */}
                <div className="bg-gradient-to-r from-[#102E50] to-[#1A3E6C] rounded-2xl p-6 text-white shadow-lg mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                {className || `Class ${classId}`}
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <MdGroup className="text-xl" />
                                    <span className="text-lg">
                                        {students.length} student{students.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="hidden md:block h-6 w-px bg-white/30"></div>
                                <div className="text-gray-200">
                                    Sorted alphabetically by last name
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                            <div className="text-sm text-gray-200">Class ID</div>
                            <div className="font-mono font-bold text-lg">{classId}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Search and Controls Bar */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Search Box */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                <input
                                    type="text"
                                    placeholder="Search students by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white text-[#102E50] border border-gray-300 rounded-lg focus:outline-none 
                                        focus:ring-2 focus:ring-[#E78B48]/50 focus:border-[#E78B48] transition-all duration-200"
                                />
        
                            </div>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="text-gray-600 text-sm">
                                Showing {filteredStudents.length} of {students.length} students
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-white rounded-lg bg-[#102E50]
                                        hover:brightness-110 transition-colors duration-200"
                                    title="Print List"
                                >
                                    <MdPrint className="text-lg" />
                                    <span className="hidden sm:inline">Print</span>
                                </button>
                                
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#E78B48] text-white rounded-lg hover:bg-[#D67A37] transition-colors duration-200"
                                    title="Export to CSV"
                                >
                                    <MdDownload className="text-lg" />
                                    <span className="hidden sm:inline">Export CSV</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Student List Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-[#102E50] flex items-center gap-2">
                            <MdGroup className="text-[#E78B48]" />
                            Student Roster
                        </h2>
                        <p className="text-gray-600 mt-1">
                            List of all enrolled students in this class
                        </p>
                    </div>
                    
                    {/* Table Content */}
                    {filteredStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <StudentTable
                                columns={columns}
                                data={tableData}
                                setSelectedData={() => {}}
                                setIsOpenEditModal={() => {}}
                                setIsOpenDeleteModal={() => {}}
                                pagination={[10, 15]}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-16 px-4">
                            {searchTerm ? (
                                <>
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MdSearch className="text-4xl text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-3">No students found</h3>
                                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                                        No students match "<span className="font-semibold">{searchTerm}</span>". 
                                        Try a different search term.
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="px-6 py-3 bg-[#102E50] text-white rounded-lg hover:bg-[#0A1F33] transition-colors duration-200"
                                    >
                                        Clear Search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MdGroup className="text-4xl text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-3">No students enrolled</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        There are no students currently enrolled in this class.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Footer Stats */}
                    {filteredStudents.length > 0 && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#E78B48]"></div>
                                    <span>Displaying {filteredStudents.length} students</span>
                                </div>
                                <div className="text-gray-500">
                                    Last updated: {new Date().toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                
                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-[#102E50]">
                        <strong>Note:</strong> This is a read-only view of all students enrolled in this class. 
                        Students are automatically sorted alphabetically by last name. 
                        Use the search box to quickly find specific students.
                    </p>
                </div>
            </div>
        </div>
    );
}