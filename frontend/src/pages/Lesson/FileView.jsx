import PdfViewer from "../../components/PdfViewer";
import FileViewer from "../../components/FileViewer";


export default function FileView({fileExtension, fileUrl}) {
    
    return (
        <>
            {["pdf"].includes(fileExtension) && <PdfViewer fileUrl={fileUrl}/>}
            {["doc", "docx", "ppt", "pptx"].includes(fileExtension) && <FileViewer fileUrl={fileUrl}/>}
        </>
    )
}