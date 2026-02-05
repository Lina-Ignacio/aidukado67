export default function StudentSubmissionCard({ submission, onClick, studentName }) {
  const isGraded = submission.score !== null && submission.score !== undefined;
  
  return (
    <div
      className="w-full p-4 bg-white rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 relative group border border-[#102E50]/10 hover:border-[#E78B48]/30"
      onClick={() => onClick && onClick(submission)}
    >
      {/* Left accent bar */}
      <div className="absolute w-1.5 h-3/4 rounded-full bg-gradient-to-b from-[#E78B48] to-[#ff9c5a] left-3 top-1/2 transform -translate-y-1/2 group-hover:h-4/5 transition-all"></div>
      
      {/* Content */}
      <div className="ml-6">
        <h2 className="text-lg font-semibold text-[#102E50] mb-1">
          {studentName}
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isGraded 
                ? 'bg-green-100 text-green-800' 
                : 'bg-[#102E50]/10 text-[#102E50]'
            }`}>
              {isGraded ? 'Graded' : 'Pending'}
            </span>
            
            {isGraded && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#102E50]/60">Score:</span>
                <span className="font-semibold text-[#102E50]">{submission.score}</span>
              </div>
            )}
          </div>
          
          <div className="text-[#102E50]/40 group-hover:text-[#E78B48] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}