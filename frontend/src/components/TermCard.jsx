import { useNavigate } from "react-router-dom"
import useClassStore from "../store/useClassStore"
import { getTermName } from "../utils/getTermName";
import useTermStore from "../store/useTermStore";

export default function TermCard({term}) {

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
            className="w-3/5 md:w-1/2 2xl:w-1/4 h-[250px] sm:h-[300px] md:h-[350px] xl:h-[300px] 2xl:h-[400px] rounded-xl shadow-xl 
                flex flex-col justify-center items-center bg-[#102E50] flex hover:scale-95 transition-transform duration-300
                relative overflow-hidden"

            onClick={handleClick}
        >
            <img 
                src={`../public/${termName}Icon.png`}
                className="w-[200px] h-[100px] sm:w-[450px] sm:h-[200px] lg:w-[300px] lg:h-[200px]"
            />
            <h2 className="font-bold text-xl sm:text-2xl xl:text-3xl">{termName}</h2>
            <div className="w-[30%] h-[5%] absolute bg-white rounded-tr-full bottom-[8%] left-0"></div>
            <div className="w-[40%] h-[5%] absolute bg-[#E78B48] rounded-tr-full bottom-[4%] left-0"></div>
            <div className="w-[50%] h-[5%] absolute bg-[#BE3D2A] rounded-tr-full bottom-0 left-0"></div>
            <div className="w-6 h-6 lg:w-8 lg:h-8 absolute bg-white -top-4 right-4 shadow-xl 
                    -rotate-45"
            >
            </div>
        </div>
    )
} 