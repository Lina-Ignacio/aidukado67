import { useState, useEffect } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import useScreenSize from "../hooks/useScreenSize";

export default function Table({ columns, data, setSelectedData, setIsOpenEditModal, setIsOpenDeleteModal, pagination }) {

    // For Screen Size
    const { width } = useScreenSize();


    const columnStyle = "px-4 py-2 text-left text-md xl:text-lg 2xl:text-xl";
    const tableDataStyle = "text-[#10375C] px-4 py-2 text-left text-sm xl:text-md 2xl:text-lg"

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (width < 1024) {
            setItemsPerPage(6);   // Tablet
        } else if (width < 1280) {
            setItemsPerPage(7);   // Small Desktop / Large Tablet
        } else if (width < 1536) {
            setItemsPerPage(pagination[0]);  // Standard Desktop (1366 falls here)
        } else {
            setItemsPerPage(pagination[1]);  // Large Display
        }

        setCurrentPage(1); // reset page when size changes
    }, [width]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentItems = data.slice(startIndex, endIndex);

    const totalPages = Math.ceil(data.length / itemsPerPage)

    return (
        <>
            <table className="w-full border border-gray-300 rounded-lg">
                <thead className="bg-[#10375C] text-white">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.id} className={columnStyle}>
                                {column.name}
                            </th>
                            
                        ))}
                        <th className={columnStyle}>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {currentItems && currentItems.length > 0 ? (
                        currentItems.map((row, i) => (
                            <tr key={row.id || i}>
                                {columns.map((column) => (
                                    <td key={column.id} className={tableDataStyle}>
                                        {row[column.key]}
                                    </td>
                                ))}
                                <td className={tableDataStyle}>
                                    <div className="w-full h-full flex gap-2">
                                        <button
                                            className="text-sm text-white bg-[#2563EB]/90 p-2"
                                            onClick={ () => {
                                                setSelectedData(row);
                                                setIsOpenEditModal(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-sm text-white bg-[#8E1616] p-2"
                                            onClick={ () => {
                                                setSelectedData(row);
                                                setIsOpenDeleteModal(true);
                                                }
                                            }
                                        >
                                            Archive
                                        </button>                            
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-2 text-left text-red-800">
                                No Data
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-[#B9652B] text-white" : "bg-[#102E50]"}`}
                >
                    {i + 1}
                </button>
                ))}
            </div>        
        </>
    )
}