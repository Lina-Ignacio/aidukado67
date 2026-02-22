export default function SearchForm({query, setQuery, inputPlaceholder}) {
    return (
        <form className="w-full h-full">
            <div className="relative h-full group">
                {/* Icon with gradient effect */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-[#7E8FA6] group-focus-within:text-[#10375C] transition-colors duration-200"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                    </svg>
                </div>

                {/* Input with enhanced styling */}
                <input
                    type="search"
                    className="w-full h-full pl-10 pr-4 text-sm md:text-base
                        bg-white border-2 border-[#E2E7F0] rounded-xl text-[#102E50]
                        placeholder:text-[#7E8FA6] placeholder:font-light
                        focus:outline-none focus:border-[#10375C] focus:ring-4 focus:ring-[#10375C]/10
                        hover:border-[#C3CBD9] transition-all duration-200
                        shadow-sm hover:shadow"
                    placeholder={inputPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </form>
    )
}