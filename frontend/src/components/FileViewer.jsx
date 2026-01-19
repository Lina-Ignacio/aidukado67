import { useState, useEffect, useRef } from "react";

export default function FileViewer({ fileUrl }) {
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

  if (!fileUrl) return <p className="p-4 text-gray-600">No file to display</p>;

  const encodedUrl = encodeURIComponent(fileUrl);
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
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
      
      {/* Scale controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
        <div className="flex gap-1 bg-black/70 rounded-full p-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-3 py-1 text-white hover:bg-black/50 rounded-full"
          >
            −
          </button>
          <button
            onClick={() => setScale(1)}
            className="px-3 py-1 text-white hover:bg-black/50 rounded-full text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            className="px-3 py-1 text-white hover:bg-black/50 rounded-full"
          >
            +
          </button>
        </div>
        <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}