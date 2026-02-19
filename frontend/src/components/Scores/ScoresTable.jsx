import { useState, useEffect } from "react";
import useScreenSize from "../../hooks/useScreenSize";

export default function ScoresTable({ columns, data, pagination }) {
  const { width } = useScreenSize();

  const columnStyle = "px-4 py-3 text-left text-sm xl:text-base 2xl:text-lg font-semibold";
  const tableDataStyle = "text-[#102E50] px-4 py-3 text-left text-sm xl:text-base 2xl:text-lg border-b border-gray-100";
  const maxScoreStyle = "px-4 py-3 text-left text-sm xl:text-base 2xl:text-lg font-bold text-[#E78B48] bg-[#F5C45E]/10 border-b border-[#F5C45E]/20";

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (width < 1024) {
      setItemsPerPage(6);
    } else if (width < 1280) {
      setItemsPerPage(7);
    } else if (width < 1536) {
      setItemsPerPage(pagination[0] || 8);
    } else {
      setItemsPerPage(pagination[1] || 10);
    }
    setCurrentPage(1);
  }, [width, pagination]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Function to check if a row is the "Highest Possible Score" row
  const isMaxScoreRow = (row) => row.id === "highest_score" || row.isMaxScoreRow;

  return (
    <>
      <div className="overflow-x-auto w-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-[#102E50]">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className={columnStyle}>
                  <div className="flex items-center gap-2 text-white">
                    {column.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {currentItems && currentItems.length > 0 ? (
              currentItems.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className={`
                    ${isMaxScoreRow(row) ? "bg-[#F5C45E]/5" : "hover:bg-gray-50"} 
                    transition-colors duration-150
                  `}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.id} 
                      className={isMaxScoreRow(row) ? maxScoreStyle : tableDataStyle}
                    >
                      <span className={isMaxScoreRow(row) ? "font-bold" : ""}>
                        {row[column.key]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-8 text-center text-gray-500 italic"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No scores available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              currentPage === 1
                ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                : "border-[#102E50] text-[#102E50] hover:bg-[#102E50] hover:text-white bg-white"
            }`}
          >
            Previous
          </button>
          
          <div className="flex gap-1 mx-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  currentPage === i + 1 
                    ? "bg-[#E78B48] text-white border-[#E78B48] shadow-md shadow-[#E78B48]/30" 
                    : "bg-white text-[#102E50] border-gray-200 hover:bg-[#F5C45E] hover:text-[#102E50] hover:border-[#F5C45E]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              currentPage === totalPages
                ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                : "border-[#102E50] text-[#102E50] hover:bg-[#102E50] hover:text-white bg-white"
            }`}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Items per page indicator */}
      {data.length > 0 && (
        <div className="text-xs text-gray-500 text-center mt-3">
          Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} entries
        </div>
      )}
    </>
  );
}