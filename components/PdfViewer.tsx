
"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfViewerProps = {
  fileUrl: string;
};

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-gray-100">
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <span className="text-sm font-medium">Course material</span>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
            disabled={zoom <= 0.6} className="rounded border px-3 py-1">
            −
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            disabled={zoom >= 2} className="rounded border px-3 py-1">
            +
          </button>
          <button onClick={() => setZoom(1)} className="rounded border px-2 py-1 text-sm">
            Reset
          </button>
        </div>
      </div>

      <div ref={containerRef} className="h-[70vh] overflow-auto p-4">
        {error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setError("");
            }}
            onLoadError={() => setError("Unable to load this PDF. Please refresh and try again.")}
            loading={<p className="py-10 text-center">Loading course material...</p>}
          >
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: numPages }, (_, index) => (
                <div key={index} className="bg-white shadow-md">
                  <Page
                    pageNumber={index + 1}
                    width={Math.max(280, containerWidth - 32) * zoom}
                    renderAnnotationLayer={false}
                    renderTextLayer={true}
                  />
                </div>
              ))}
            </div>
          </Document>
        )}
      </div>

      {numPages > 0 && (
        <div className="border-t bg-white px-4 py-2 text-center text-xs text-gray-500">
          {numPages} pages · Scroll inside the viewer to read
        </div>
      )}
    </div>
  );
}
