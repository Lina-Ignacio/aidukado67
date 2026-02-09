import { useState, useEffect, useRef } from "react";
import { MdDownload } from "react-icons/md";

export default function FileViewer({ fileUrl, fileName, isVisible, setIsVisible }) {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const iframeRef = useRef(null);

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth;
      
      if (width < 375) return 0.85;   // Small phones
      if (width < 640) return 0.75;   // Mobile
      if (width < 768) return 0.65;   // Large phones
      if (width < 1024) return 0.8;   // Tablets
      return 1;                       // Desktop
    };

    setScale(calculateScale());
    
    const handleResize = () => {
      setScale(calculateScale());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Download function - FIXED VERSION
  const handleDownload = async () => {
    try {
      console.log('Download triggered with fileName prop:', fileName); // Debug
      
      // Use the passed fileName prop - THIS IS THE FIX
      let filename = fileName || 'document';
      
      // Clean filename: remove special characters
      filename = filename.replace(/[<>:"/\\|?*]/g, '_');
      
      // Determine file extension from URL (not from filename prop)
      const urlLower = fileUrl.toLowerCase();
      let extension = '';
      
      if (urlLower.includes('.docx')) {
        extension = '.docx';
      } else if (urlLower.includes('.doc')) {
        extension = '.doc';
      } else if (urlLower.includes('.pptx')) {
        extension = '.pptx';
      } else if (urlLower.includes('.ppt')) {
        extension = '.ppt';
      } else {
        // Try to extract extension from URL path
        const urlParts = fileUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1] || '';
        const extMatch = lastPart.match(/\.(docx?|pptx?)/i);
        if (extMatch) {
          extension = extMatch[0];
        }
      }
      
      console.log('Detected extension:', extension);
      
      // Add extension to filename if not already present
      if (extension) {
        // Remove any existing extension from filename
        const baseName = filename.replace(/\.[^/.]+$/, '');
        filename = baseName + extension;
      } else {
        // If no extension found, check if filename already has one
        const hasExtension = filename.match(/\.[^/.]+$/);
        if (!hasExtension) {
          // Add generic extension
          filename += '.file';
        }
      }
      
      console.log('Final filename for download:', filename);

      // Fetch the file
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  if (!fileUrl) return <p className="p-4 text-gray-600">No file to display</p>;

  const encodedUrl = encodeURIComponent(fileUrl);
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div className="relative w-full h-[calc(100vh)] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5C45E]"></div>
          <div className="absolute mt-24 text-gray-600">
            Scaling for your device ({Math.round(scale * 100)}%)
          </div>
        </div>
      )}

      {/* Container that scales the iframe */}
      <div 
        className="w-full h-full origin-top-left"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
        }}
      >
        <iframe
          ref={iframeRef}
          src={officeViewerUrl}
          title="Document Viewer"
          className="w-full h-full rounded-lg border border-gray-300"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {/* Controls Container */}
      <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row items-end gap-3 z-20">
        {/* Close Button - ADDED THIS */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsVisible(false)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
            title="Close Viewer"
          >
            <span className="hidden sm:inline">Close</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>
        
        {/* Download Button */}
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#E78B48] hover:bg-orange-400 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
            title="Download Document"
          >
            <MdDownload className="text-lg" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden"></span>
          </button>
        </div>
        
        {/* Scale Controls */}
        <div className="flex items-center gap-2 ">
          <div className="flex gap-1 bg-white rounded-full p-1">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="px-3 py-1 text-white bg-[#102E50] hover:bg-[#E78B48] rounded-full"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={() => setScale(1)}
              className="px-3 py-1 text-white bg-[#102E50] hover:bg-[#E78B48] rounded-full text-sm"
              title="Reset Zoom"
            >
              Reset
            </button>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="px-3 py-1 text-white bg-[#102E50] hover:bg-[#E78B48] rounded-full"
              title="Zoom In"
            >
              +
            </button>
          </div>
          <div className="bg-[#102E50] text-white text-sm px-3 py-1 rounded-full min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}