
import { useNavigate} from "react-router-dom"
import { MdMenuBook, MdAssignment, MdTaskAlt, MdWorkOutline } from "react-icons/md";

export default function LessonCard ({materialName, materialId, creationDate, materialType, classId}) {

    
    const date = new Date(creationDate);

    const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",  
    day: "numeric", 
    
    });


    const navigate = useNavigate();
    
    const handleClick = () => {
        // navigate(`/selectedLesson/${materialId}/${materialType}/${classId}`)
        navigate(`/selectedLesson/${materialId}/${materialType}`)
    }

    const iconStyle = "text-white text-lg"
    const returnIcon = (type) => {
        switch (type) {
            case "lesson":
                return <MdMenuBook size={30} className={iconStyle}/>;
            case "assignment":
                return <MdAssignment size={24} className={iconStyle}/>;
            case "activity":
                return <MdTaskAlt size={24} className={iconStyle}/>;
            case "project":
                return <MdWorkOutline size={24} className={iconStyle}/>;
            default:
                return <MdMenuBook size={24} className={iconStyle}/>; 
        }
    };
    
    const returnColor = (type) => {
        switch (type) {
            case "lesson":
                return "206A5D";
            case "assignment":
                return "F5C45E";
            case "activity":
                return "102E50";
            case "project":
                return "E78B48";
            default:
                return "206A5D"; 
        }
    }

    const iconColor = returnColor(materialType);

    return (
        <div 
            className="flex flex-col w-full h-auto lg:w-[45%] xl:w-[31%] p-5 gap-2
                    rounded-md cursor-pointer shadow-sm hover:shadow-md
                    transition-all duration-300 ease-in-out
                    hover:scale-[1.01] relative
                    relative overflow-hidden material-background
                    rounded-tr-xl rounded-bl-xl"
            onClick={handleClick}
        >
            <div 
                className="absolute h-[3%] w-full bg-[#102E50]/20 bottom-0 left-0
                    rounded-tr-xl rounded-bl-xl"
            >
            </div>
            <h2 className="text-md font-bold text-gray-800">{materialName}</h2>
            
            <p className="w-4/5 text-sm font-semibold text-gray-800">{formattedDate}</p>
            <div className={`flex justify-center items-center bg-[#${iconColor}] w-11 h-11 
                absolute bottom-2 right-5 rounded-full p-3`}>
                {returnIcon(materialType)}
            </div>
            
            
      </div>
            
    )
}