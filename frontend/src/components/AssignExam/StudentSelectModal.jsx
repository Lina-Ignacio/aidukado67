export default function StudentSelectModal({ 
  students, 
  selectedStudents, 
  disabledStudents = [],  
  onToggle, 
  onConfirm, 
  onCancel,
  title = "Assign to Students",
  confirmText = "Confirm Assign",
  cancelText = "Cancel"
}) {
  // Check if all selectable students are selected
  const selectableStudents = students.filter(s => !disabledStudents.includes(s.id));
  const allSelectableSelected = selectableStudents.length > 0 && 
    selectableStudents.every(s => selectedStudents.includes(s.id));

  const handleSelectAll = () => {
    // Toggle all selectable students
    if (allSelectableSelected) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white text-black rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 border rounded-lg p-2">
          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students available</p>
              <p className="text-sm text-gray-400 mt-1">
                Add students to this class first
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Select All Button */}
              {selectableStudents.length > 0 && (
                <div className="flex justify-end mb-2 pb-2 border-b border-gray-200">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium"
                  >
                    {allSelectableSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}

              {students.map((student) => {
                const isDisabled = disabledStudents.includes(student.id);
                const isSelected = selectedStudents.includes(student.id);

                return (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all
                      ${isDisabled 
                        ? "opacity-50 cursor-not-allowed bg-gray-50" 
                        : "cursor-pointer hover:bg-gray-50"
                      }
                      ${isSelected ? "bg-blue-50 border border-blue-200" : ""}
                    `}
                  >
                    <input
                      type="checkbox"
                      disabled={isDisabled}
                      checked={isSelected}
                      onChange={() => onToggle(student.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {student.last_name}, {student.first_name}
                      </div>
                      {student.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {student.email}
                        </div>
                      )}
                    </div>

                    {isDisabled && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Assigned
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-sm text-gray-600">
            Total: {students.length} student{students.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-blue-700 hover:text-white  
                  bg-gray-100 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 bg-[#102E50] text-white rounded-lg hover:bg-blue-700 transition-colors 
                font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedStudents.length === 0}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}