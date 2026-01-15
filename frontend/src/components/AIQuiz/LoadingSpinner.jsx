export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 m-auto">
      <div className="w-12 h-12 border-4 border-[#102E50] border-t-transparent rounded-full animate-spin"></div>
      <div className="text-[#102E50] text-xl font-semibold animate-pulse">
        Generating Quiz... Please Wait
      </div>
    </div>
  );
}