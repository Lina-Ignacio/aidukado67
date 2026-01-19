import NativePdfViewer from "../../components/PdfViewer";
import FileViewer from "../../components/FileViewer";


export default function FileView({fileExtension, fileUrl, isVisible, setIsVisible}) {
    return (
        <div className="w-full h-auto bg-gray-50 absolute inset-0">
            {["pdf"].includes(fileExtension) && <NativePdfViewer fileUrl={fileUrl} isVisible={isVisible} setIsVisible={setIsVisible}/>}
            {["doc", "docx", "ppt", "pptx"].includes(fileExtension) && <FileViewer fileUrl={fileUrl}/>}
        </div>
    )
}