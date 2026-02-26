import { useState, useEffect } from "react";
import { MdArchive, MdChevronLeft, MdChevronRight } from "react-icons/md";
import useScreenSize from "../hooks/useScreenSize";

export default function Table({ 
  columns, 
  data, 
  setSelectedData, 
  setIsOpenEditModal, 
  setIsOpenDeleteModal, 
  pagination,
  showActions = true 
}) {

    // For Screen Size
    const { width } = useScreenSize();

    // Reduced text sizes for better laptop display
    const columnStyle = "px-3 py-2 text-left text-xs sm:text-xs md:text-sm 2xl:text-base font-semibold uppercase tracking-wider text-white";
    const tableDataStyle = "px-3 py-2 text-[#102E50] text-left text-xs sm:text-xs md:text-sm 2xl:text-base border-b border-gray-200";

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (width < 1024) {
            setItemsPerPage(6); // Tablet and below
        } else if (width < 1280) {
            setItemsPerPage(7); // Small desktop
        } else if (width < 1536) {
            setItemsPerPage(pagination[0]); // Standard desktop (default)
        } else if (width < 1920) {
            setItemsPerPage(pagination[1]); // Large desktop (HD)
        } else if (width < 2560) {
            setItemsPerPage(pagination[1] + 4); // Full HD
        } else {
            setItemsPerPage(pagination[1] + 8); // 2K, 4K and above
        }
        setCurrentPage(1);
    }, [width, pagination]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pageNumbers.push(i);
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-[#102E50] to-[#1a3f6a]">
                        <tr>
                            {columns.map((column) => (
                                <th key={column.id} className={columnStyle}>
                                    {column.name}
                                </th>
                            ))}
                            {showActions && (
                                <th className={columnStyle}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems && currentItems.length > 0 ? (
                            currentItems.map((row, i) => (
                                <tr 
                                    key={row.id || i} 
                                    className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                                >
                                    {columns.map((column) => (
                                        <td key={column.id} className={tableDataStyle}>
                                            <span className="font-medium text-[#102E50]">
                                                {row[column.key]}
                                            </span>
                                        </td>
                                    ))}
                                    {showActions && (
                                        <td className={tableDataStyle}>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    className="px-2 py-1 rounded-lg bg-[#E78B48] hover:bg-[#B9652B] text-white text-xs font-medium transition-all duration-200 shadow-sm"
                                                    onClick={() => {
                                                        setSelectedData(row);
                                                        setIsOpenEditModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="px-2 py-1 rounded-lg bg-[#102E50] hover:bg-[#0a1f33] text-white text-xs font-medium transition-all duration-200 shadow-sm"
                                                    onClick={() => {
                                                        setSelectedData(row);
                                                        setIsOpenDeleteModal(true);
                                                    }}
                                                >
                                                    Archive
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td 
                                    colSpan={showActions ? columns.length + 1 : columns.length} 
                                    className="px-4 py-8 text-center text-gray-500"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <MdArchive className="text-3xl text-gray-400" />
                                        <span className="text-xs font-medium">No data available</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-700">
                        Showing <span className="font-medium text-[#102E50]">{startIndex + 1}</span> to{' '}
                        <span className="font-medium text-[#102E50]">
                            {Math.min(endIndex, data.length)}
                        </span>{' '}
                        of <span className="font-medium text-[#102E50]">{data.length}</span> results
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
                                currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-[#102E50] text-[#102E50] hover:text-white shadow-sm border border-gray-300'
                            }`}
                        >
                            {/* <MdChevronLeft className="text-2xl" /> */}
                            <p>{'<<'}</p>
                        </button>

                        {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-gray-500">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        currentPage === page
                                            ? 'bg-[#E78B48] text-white shadow-md hover:bg-[#B9652B]'
                                            : 'bg-white text-[#102E50] hover:bg-gray-100 border border-gray-300'
                                    }`}
                                >
                                    {page}
                                </button>
                            )
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
                                currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-[#102E50] text-[#102E50] hover:text-white shadow-sm border border-gray-300'
                            }`}
                        >
                            {/* <MdChevronRight className="text-base text-2xl text-black" /> */}
                            <p>{'>>'}</p>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}