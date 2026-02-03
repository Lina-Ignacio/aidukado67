
import { useState, useEffect } from "react";
import useScreenSize from "../../hooks/useScreenSize";

export default function ScoresTable({ columns, data, pagination }) {
  const { width } = useScreenSize();

  const columnStyle = "px-4 py-2 text-left text-md xl:text-lg 2xl:text-xl";
  const tableDataStyle = "text-[#10375C] px-4 py-2 text-left text-sm xl:text-md 2xl:text-lg";
  const maxScoreStyle = "px-4 py-2 text-left text-sm xl:text-md 2xl:text-lg font-bold text-blue-700 bg-blue-50";

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
      <div className="overflow-x-auto w-auto">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-[#10375C] text-white">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className={columnStyle}>
                  {column.name}
                </th>
              ))}
              {/* No Action column needed for scores table */}
            </tr>
          </thead>

          <tbody>
            {currentItems && currentItems.length > 0 ? (
              currentItems.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className={isMaxScoreRow(row) ? "bg-blue-50" : ""}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.id} 
                      className={isMaxScoreRow(row) ? maxScoreStyle : tableDataStyle}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                  {/* No action buttons for scores table */}
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
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 
                  ? "bg-[#B9652B] text-white" 
                  : "bg-[#102E50] text-white hover:bg-[#183D65]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}