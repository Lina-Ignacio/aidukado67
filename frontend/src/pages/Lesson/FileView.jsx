import NativePdfViewer from "../../components/PdfViewer";
import FileViewer from "../../components/FileViewer";


export default function FileView({fileExtension, fileUrl, fileName, isVisible, setIsVisible}) {
    return (
        <div className="w-full h-auto inset-0">
            {["pdf"].includes(fileExtension) && <NativePdfViewer fileUrl={fileUrl} fileName={fileName} isVisible={isVisible} setIsVisible={setIsVisible}/>}
            {["doc", "docx", "ppt", "pptx"].includes(fileExtension) && <FileViewer fileUrl={fileUrl} fileName={fileName} isVisible={isVisible} setIsVisible={setIsVisible}/>}
        </div>
    )
}