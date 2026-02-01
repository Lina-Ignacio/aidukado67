export default function StudentSubmissionCard({ submission, onClick }) {
  const fullName = `${submission.student.firstName} ${submission.student.lastName}`;

  return (
    <div
      className="w-full p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-gray-100 transition relative"
      onClick={() => onClick && onClick(submission)}
    >
      <div className="absolute w-[1%] h-full rounded-tl-lg rounded-bl-lg bg-orange-400 left-0 top-0">
      </div>
      {/* Shadow bottom */}
      <div className="absolute w-full h-[4%] rounded-xl bg-black/70 left-0 bottom-0">
      
      </div>
      <h2 className="text-lg font-semibold text-[#102E50]">
        {fullName}
      </h2>
    </div>
  );
}
