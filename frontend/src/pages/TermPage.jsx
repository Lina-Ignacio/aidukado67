import TermCard from "../components/TermCard";


export default function TermPage() {
    const terms = [1, 2, 3];

    return (
        <div className="flex flex-col lg:flex-row w-full h-auto min-h-screen text-white 
            justify-center items-center lg:items-start gap-8 p-8 lg:py-[80px]">
            {terms.map((term, index) => (
                <TermCard key={index} term={term}/>
            ))}
        </div>
    )
}