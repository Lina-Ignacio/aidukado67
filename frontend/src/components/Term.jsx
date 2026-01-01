import { useNavigate } from "react-router-dom"
import useClassStore from "../store/useClassStore"
import { getTermName } from "../utils/getTermName";
import useTermStore from "../store/useTermStore";

export default function Term({term}) {

    const classId = useClassStore((state) => state.classId);
    const storeTerm = useTermStore((state) => state.storeTerm)
    
    const navigate = useNavigate();
    const handleClick = () => {
        storeTerm(term);
        navigate(`/selectedClass/${classId}/${term}`);
    }

    
    let termName = getTermName(term)

    return (
        <div 
            className="w-3/5 md:w-1/2 2xl:w-1/4 h-[250px] sm:h-[300px] md:h-[400px] xl:h-[450px] rounded-xl shadow-xl 
                flex flex-col justify-center items-center bg-[#102E50] flex hover:scale-95 transition-transform duration-300"
            onClick={handleClick}
        >
            <img 
                src={`../public/${termName}Icon.png`}
                className="w-[200px] h-[100px] sm:w-[450px] sm:h-[200px] lg:w-[300px] lg:h-[200px]"
            />
            <h2 className="font-bold text-xl sm:text-2xl xl:text-3xl">{termName}</h2>
        </div>
    )
} 