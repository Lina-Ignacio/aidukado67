import { useState, useEffect, useMemo } from "react";
import axios from "../../services/axiosConfig";
import { MoonLoader } from "react-spinners";
import Table from "../../components/Table";

export default function AuditLogs() {
  const auditLogColumns = [
    //{ id: 1, name: "ID", key: "id" },
    { id: 2, name: "Table", key: "table_name" },
    { id: 3, name: "Record ID", key: "record_id" },
    { id: 4, name: "Operation", key: "operation_type" },
    { id: 5, name: "Changed At", key: "changed_at" },
    { id: 6, name: "User ID", key: "changed_by_id" },
    { id: 7, name: "User's Name", key: "user_name" },
    { id: 8, name: "Changed Fields", key: "changed_fields_summary" }
  ];

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchDataError, setFetchDataError] = useState("");

  // Date filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch all audit logs
  const getAuditLogs = async () => {
    try {
      setLoading(true);
      setFetchDataError("");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/audit-logs/get`
      );
      
      setAuditLogs(response.data);
      console.log("Audit logs:", response.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setFetchDataError(err.response.data.detail);
      } else if (err.message) {
        setFetchDataError(err.message);
      } else {
        setFetchDataError("Failed to load audit logs. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    getAuditLogs();
  }, []);

  // Clear date filters
  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  // Transform and filter data for table display
  const transformedData = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return [];
    
    return auditLogs
      .filter((log) => {
        if (!log.changed_at) return true;

        const logDate = new Date(log.changed_at);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (logDate < from) return false;
        }

        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) return false;
        }

        return true;
      })
      .map((log) => {
        // Format changed_at date
        const changedAt = log.changed_at 
          ? new Date(log.changed_at).toLocaleString() 
          : "";
        
        // Get user info
        const user = log.user || log.changed_by_user || {};
        
        // Construct full name from first_name and last_name
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || "System";
        
        // User ID (fallback to changed_by if user object missing)
        const userId = user.id || log.changed_by || "-";
        
        // Create summary of changed fields
        let changedFieldsSummary = "";
        if (log.changed_fields) {
          const fields = Object.keys(log.changed_fields);
          changedFieldsSummary = fields.length > 0 
            ? fields.slice(0, 3).join(", ") + (fields.length > 3 ? "..." : "")
            : "All fields";
        } else if (log.operation_type === "INSERT") {
          changedFieldsSummary = "New record";
        } else if (log.operation_type === "DELETE") {
          changedFieldsSummary = "Deleted record";
        }

        return {
          id: log.id,
          table_name: log.table_name,
          record_id: log.record_id || "-",
          operation_type: (
            <span className={`px-2 py-1 rounded text-xs font-medium
              ${log.operation_type === 'INSERT' ? 'bg-green-100 text-green-800' : ''}
              ${log.operation_type === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${log.operation_type === 'DELETE' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {log.operation_type}
            </span>
          ),
          changed_at: changedAt,
          changed_by_id: userId,
          user_name: fullName,
          changed_fields_summary: changedFieldsSummary || "-"
        };
      });
  }, [auditLogs, dateFrom, dateTo]);

  const isFiltered = dateFrom || dateTo;
  const pagination = [9, 11];

  return (
    <div className="flex flex-col w-full h-auto min-h-screen py-5 px-10 items-center">
      <h1 className="text-2xl font-bold text-[#102E50] mb-6">Audit Logs</h1>

      {fetchDataError && (
        <div className="w-4/5 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{fetchDataError}</p>
          <button
            onClick={getAuditLogs}
            className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto w-4/5 mt-[20px]">

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent"
            />
          </div>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="mb-2">
          <div className="text-sm text-gray-400">
            {isFiltered
              ? `Showing ${transformedData.length} of ${auditLogs.length} audit logs (filtered by date)`
              : `Showing all ${transformedData.length} audit logs`}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <MoonLoader color="#102E50" loading={true} size={60} />
            <p className="mt-4 text-gray-400">Loading audit logs...</p>
          </div>
        ) : (
          <>
            {transformedData.length === 0 && (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-400 text-lg">
                  {isFiltered
                    ? "No audit logs found for the selected date range."
                    : "No audit logs found"}
                </p>
                {isFiltered && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-3 px-4 py-2 text-sm bg-[#102E50] text-white rounded-md hover:bg-[#1a3f6b] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {transformedData.length > 0 && (
              <Table
                columns={auditLogColumns}
                data={transformedData}
                setSelectedData={() => {}} 
                setIsOpenEditModal={() => {}}
                setIsOpenDeleteModal={() => {}}
                pagination={pagination}
                showActions={false}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}