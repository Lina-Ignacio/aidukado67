import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { MdArrowBack, MdDownload } from "react-icons/md";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfViewer({ fileUrl, fileName, isVisible, setIsVisible }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTimeoutRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerDimensions({
          width: clientWidth,
          height: clientHeight
        });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!fileUrl) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        console.log("Loading PDF from:", fileUrl);

        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
          rangeChunkSize: 65536,
        });

        const loadedPdf = await loadingTask.promise;

        if (!cancelled) {
          console.log("PDF loaded successfully, pages:", loadedPdf.numPages);
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setPageNum(1);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("PDF loading error details:", err);
        if (!cancelled) {
          try {
            console.log("Trying fallback loading method...");
            
            const response = await fetch(fileUrl, {
              mode: 'cors',
              credentials: 'omit',
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const pdfBlob = await response.blob();
            const blobUrl = URL.createObjectURL(pdfBlob);
            
            const loadingTask = pdfjsLib.getDocument(blobUrl);
            const loadedPdf = await loadingTask.promise;
            
            if (!cancelled) {
              setPdf(loadedPdf);
              setNumPages(loadedPdf.numPages);
              setPageNum(1);
              setIsLoading(false);
              
              return () => URL.revokeObjectURL(blobUrl);
            }
          } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
            setError(`Failed to load PDF. Please check: 
              1. The file exists and is accessible
              2. CORS is enabled on the server
              3. The file is a valid PDF
              Error: ${fallbackErr.message}`);
            setIsLoading(false);
          }
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Download PDF function
  // Download PDF function
  const handleDownload = async () => {
    try {
      // Use the passed fileName prop or extract from URL as fallback
      let filename = fileName;
      
      if (!filename || filename.trim() === '') {
        // Fallback: extract from URL
        const url = new URL(fileUrl);
        filename = url.pathname.split('/').pop() || 'document.pdf';
        filename = filename.split('?')[0];
        filename = decodeURIComponent(filename);
      }
      
      // Clean filename: remove special characters and ensure .pdf extension
      filename = filename.replace(/[^a-zA-Z0-9_\-. ]/g, '_'); // Replace invalid chars with underscore
      
      // Ensure it has .pdf extension
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename}.pdf`;
      }

      console.log('Downloading file:', filename);

      // Fetch the PDF file
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
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
      alert(`Failed to download PDF: ${error.message}`);
    }
  };

  // Responsive render function
  const renderPage = useCallback(async () => {
    if (!pdf || pageNum < 1 || pageNum > numPages || !containerRef.current || !canvasRef.current) {
      return;
    }

    try {
      const page = await pdf.getPage(pageNum);
      const container = containerRef.current;
      const canvas = canvasRef.current;

      // Get container dimensions with padding
      const padding = 32; // Total padding (16px on each side)
      const maxWidth = Math.max(container.clientWidth - padding, 300); // Minimum 300px
      const maxHeight = Math.max(container.clientHeight - padding, 400); // Minimum 400px

      // Get PDF page dimensions at scale 1
      const viewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit width while maintaining aspect ratio
      let fitScale = (maxWidth / viewport.width) * scale;
      
      // Also check height constraint
      const scaledHeight = viewport.height * fitScale;
      if (scaledHeight > maxHeight) {
        fitScale = (maxHeight / viewport.height) * scale;
      }

      // Ensure minimum scale for readability
      const minScale = 0.5;
      const maxScale = 3;
      fitScale = Math.max(minScale, Math.min(fitScale, maxScale));

      // Create scaled viewport
      const scaledViewport = page.getViewport({ scale: fitScale });

      // Handle high DPI displays
      const dpi = window.devicePixelRatio || 1;
      canvas.width = Math.floor(scaledViewport.width * dpi);
      canvas.height = Math.floor(scaledViewport.height * dpi);

      // Set CSS dimensions (different from canvas pixel dimensions)
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';

      // Get context and render
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale for high DPI
      ctx.scale(dpi, dpi);

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;

    } catch (err) {
      console.error("Render error:", err);
    }
  }, [pdf, pageNum, scale, numPages]);

  // Render current page with debounce
  useEffect(() => {
    if (!pdf || !containerRef.current) return;

    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce render to prevent excessive re-renders
    renderTimeoutRef.current = setTimeout(() => {
      renderPage();
    }, 50);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [pdf, pageNum, scale, numPages, containerDimensions, renderPage]);

  // Navigation functions
  const goToPreviousPage = () => pageNum > 1 && setPageNum(p => p - 1);
  const goToNextPage = () => pageNum < numPages && setPageNum(p => p + 1);
  const zoomIn = () => setScale(s => Math.min(3, s + 0.1));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.1));
  const resetZoom = () => setScale(1);
  const fitToWidth = () => setScale(1); // Reset to fit width

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNum, numPages]);

  // Render states
  if (!fileUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-[#102E50] rounded-2xl">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">📄</div>
          <div className="text-lg">Select a PDF to view</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#102E50] rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <div className="text-white text-lg">Loading PDF...</div>
        <div className="text-white/60 text-sm mt-2">This may take a few moments</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#102E50] rounded-2xl p-6">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <div className="text-white text-xl font-semibold mb-2">Unable to Load PDF</div>
        <div className="text-white/80 text-center mb-6 max-w-md">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full border border-white/20 bg-[#102E50] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-black/30 text-white">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              {isVisible && (
                <div className="self-center"> 
                  <button
                    onClick={() => setIsVisible(false)}
                    className="flex items-center justify-center gap-2 text-black bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
                  >
                    <MdArrowBack className="group-hover:-translate-x-1 transition-transform duration-300 ease-out" />
                    <span>Back</span>
                  </button>
                </div>
              )}
              <button
                onClick={zoomOut}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Zoom Out"
              >
                <span className="text-lg">−</span>
              </button>

              <button
                onClick={fitToWidth}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Fit to Width"
              >
                <span className="text-sm">Fit</span>
              </button>

              <button
                onClick={zoomIn}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Zoom In"
              >
                <span className="text-lg">+</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-[#E78B48] hover:bg-orange-400 transition-colors flex items-center gap-2"
                title="Download PDF"
              >
                <MdDownload className="text-lg" />
                <span className="hidden sm:inline text-lg">Download</span>
              </button>
            </div>

          </div>
          
          <div className="text-sm text-white/80 sm:hidden">
            {Math.round(scale * 100)}%
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <button
            onClick={goToPreviousPage}
            disabled={pageNum <= 1}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            ←
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNum}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) setPageNum(val);
              }}
              className="w-16 px-2 py-1.5 rounded bg-white/10 border border-white/20 text-center text-white focus:outline-none focus:border-white/40"
            />
            <span className="text-white/80 hidden sm:inline">/ {numPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNum >= numPages}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            →
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="text-sm text-white/80">
            Page {pageNum} of {numPages}
          </div>
          <div className="text-sm bg-white/10 px-3 py-1 rounded">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-gray-900"
      >
        <div className="flex justify-center items-start min-h-full">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden px-4 py-2 bg-black/20 text-white/80 text-sm text-center border-t border-white/10">
        <div className="flex justify-between items-center">
          <span>Page {pageNum} of {numPages}</span>
          <button
            onClick={handleDownload}
            className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1 text-xs"
            title="Download PDF"
          >
            <MdDownload />
            <span>Download</span>
          </button>
        </div>
        <div className="text-xs mt-1 text-white/60">
          Use pinch to zoom, swipe to navigate
        </div>
      </div>
    </div>
  );
}