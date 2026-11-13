"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <p className="py-10 text-center text-sm text-gray-500">
      Loading course material...
    </p>
  ),
});

function Fallback({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="rounded-xl border border-[#E5DED2] bg-[#F8F5EF] p-6 text-center">
      <p className="text-sm text-gray-700">
        This browser cannot show the course material inside the page.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white"
      >
        Open the PDF
      </a>
      <p className="mt-3 text-xs text-gray-500">
        Updating your browser, or using Chrome, may also resolve this issue.
      </p>
    </div>
  );
}

class PdfBoundary extends Component<
  { fileUrl: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <Fallback fileUrl={this.props.fileUrl} />
    ) : (
      this.props.children
    );
  }
}

export default function PdfViewerSafe({ fileUrl }: { fileUrl: string }) {
  return (
    <PdfBoundary fileUrl={fileUrl}>
      <PdfViewer fileUrl={fileUrl} />
    </PdfBoundary>
  );
}
