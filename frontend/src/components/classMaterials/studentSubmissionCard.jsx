export default function StudentSubmissionCard({ submission, onClick }) {
  const fullName = `${submission.student.firstName} ${submission.student.lastName}`;

  return (
    <div
      className="w-full p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-gray-100 transition"
      onClick={() => onClick && onClick(submission)}
    >
      <h2 className="text-lg font-semibold text-[#102E50]">
        {fullName}
      </h2>
    </div>
  );
}
