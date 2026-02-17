export default function StudentSelectModal({ 
  students, 
  selectedStudents, 
  disabledStudents = [],  
  onToggle, 
  onConfirm, 
  onCancel 
}) {
  // Get list of students that can be selected (not disabled)
  const selectableStudents = students.filter(
    student => !disabledStudents.includes(student.id)
  );
  
  // Check if all selectable students are selected
  const allSelected = selectableStudents.length > 0 && 
    selectableStudents.every(student => selectedStudents.includes(student.id));

  // Handle select all toggle
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all selectable students
      selectableStudents.forEach(student => {
        if (selectedStudents.includes(student.id)) {
          onToggle(student.id);
        }
      });
    } else {
      // Select all selectable students
      selectableStudents.forEach(student => {
        if (!selectedStudents.includes(student.id)) {
          onToggle(student.id);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-black rounded-xl p-6 w-96 max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-md xl:text-2xl font-bold mb-4 text-[#102E50]">
          Assign to Students
        </h2>

        {/* Select All Checkbox */}
        {students.length > 0 && (
          <label className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded border-b-2 border-gray-200 cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              disabled={selectableStudents.length === 0}
              className="w-4 h-4"
            />
            <span className="text-md xl:text-lg font-semibold text-[#102E50]">
              Select All
            </span>
          </label>
        )}

        <div className="flex-1 overflow-y-auto mb-4">
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No students found in this class
            </p>
          ) : (
            students.map((student) => {
              const isDisabled = disabledStudents.includes(student.id);

              return (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 mb-2 p-2 rounded transition
                    ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}
                  `}
                >
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => onToggle(student.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-md xl:text-lg">
                    {student.last_name}, {student.first_name}
                  </span>

                  {isDisabled && (
                    <span className="ml-auto text-xs text-gray-500">
                      Already assigned
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3 border-t pt-4 mt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded text-[#102E50]
                       hover:bg-blue-700 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#102E50] text-white rounded
                       hover:bg-blue-700 transition disabled:opacity-50"
            disabled={students.length === 0}
          >
            Confirm Assign
          </button>
        </div>
      </div>
    </div>
  );
}