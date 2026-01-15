export default function StudentSelectModal({ 
  students, 
  selectedStudents, 
  onToggle, 
  onConfirm, 
  onCancel 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-black rounded-xl p-6 w-96 max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-md xl:text-2xl font-bold mb-4 text-[#102E50]">Assign to Students</h2>

        <div className="flex-1 overflow-y-auto mb-4">
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No students found in this class
            </p>
          ) : (
            students.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => onToggle(student.id)}
                  className="w-4 h-4"
                />
                <span className="text-md xl:text-lg">{student.last_name}, {student.first_name}</span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 border-t pt-4 mt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded text-[#102E50] text-md hover:text-white
              hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#102E50] text-white rounded hover:bg-blue-700 transition 
              disabled:opacity-50 disabled:cursor-not-allowed text-md"
            disabled={students.length === 0}
          >
            Confirm Assign
          </button>
        </div>
      </div>
    </div>
  );
}