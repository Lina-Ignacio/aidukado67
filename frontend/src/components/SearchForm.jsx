


export default function SearchForm({query, setQuery, inputPlaceholder}) {
    return (
        <form className="w-full h-full">
            <div className="relative h-full">
                {/* Icon */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                >
                    <path
                    stroke="currentColor"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                </svg>
                </div>

                {/* Input */}
                <input
                type="search"
                className="w-full h-full pl-10 text-sm md:text-base
                    bg-white border border-gray-300 rounded-xl
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={inputPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </form>

    )
}