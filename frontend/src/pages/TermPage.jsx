import Term from "../components/Term"


export default function TermPage() {
    const terms = [1, 2, 3];

    return (
        <div className="flex flex-col lg:flex-row w-full h-auto min-h-screen text-white 
            justify-center items-center gap-8 p-8">
            {terms.map((term, index) => (
                <Term key={index} term={term}/>
            ))}
        </div>
    )
}