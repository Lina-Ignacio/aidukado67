import { useState, useEffect, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Using a stable CDN for worker to avoid local path issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const containerRef = useRef(null);

  // Measure container size dynamically
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Subtract padding (p-3 = 24px total) to prevent overflow
        setContainerWidth(entries[0].contentRect.width - 24);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const file = useMemo(() => ({
    url: fileUrl,
  }), [fileUrl]);

  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  }

  function onDocumentLoadError(err) {
    setError(err.message);
    setLoading(false);
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const nextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const prevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));

  return (
    <div className="w-full h-full flex flex-col items-center gap-3 bg-[#102E50] p-4">
      {/* Controls */}
      <div className="flex gap-5 items-center bg-white/10 p-2 rounded-lg backdrop-blur-md">
        <button onClick={zoomOut} className="text-white hover:text-[#F5C45E] transition-colors">
          <span className="text-2xl font-bold">−</span>
        </button>
        <span className="text-white font-medium min-w-[100px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} className="text-white hover:text-[#F5C45E] transition-colors">
          <span className="text-2xl font-bold">+</span>
        </button>
      </div>

      {/* PDF Viewport */}
      <div 
        ref={containerRef}
        className="w-full flex-1 border border-white/20 rounded-xl bg-gray-200 overflow-auto flex justify-center shadow-inner"
      >
        {loading && <p className="mt-10 animate-pulse text-gray-500">Opening document...</p>}
        
        {error ? (
          <div className="text-center p-10">
            <p className="text-red-500 font-bold">Failed to load PDF</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-blue-600 underline">Retry</button>
          </div>
        ) : (
          <Document 
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={options}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              // The 'width' prop makes it responsive to the container
              width={containerWidth > 0 ? containerWidth : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl my-4"
            />
          </Document>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex gap-4 items-center bg-white rounded-full px-4 py-2 shadow-lg">
        <button
          onClick={prevPage}
          disabled={pageNumber <= 1}
          className="px-4 py-1 font-bold text-[#102E50] disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm font-semibold border-x px-4">
          {pageNumber} / {numPages || "--"}
        </span>
        <button
          onClick={nextPage}
          disabled={pageNumber >= numPages}
          className="px-4 py-1 font-bold text-[#102E50] disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}