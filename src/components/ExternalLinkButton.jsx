import React, { useState } from "react";
import { ExternalLink, AlertTriangle, ShieldAlert } from "lucide-react";

export default function ExternalLinkButton({ url, label = "Movie Link" }) {
  const [showNotice, setShowNotice] = useState(false);

  if (!url) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#555]">Watch Options</h2>

      <button
        onClick={() => setShowNotice(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#5D5DFF] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4A4ACC]"
      >
        <ExternalLink className="h-4 w-4" />
        {label}
      </button>

      {showNotice && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowNotice(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#1a1a1a] bg-[#0F0F0F] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/10">
                <ShieldAlert className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white">External Link Notice</h3>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-[#D4D4D4]">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                You are leaving <span className="font-semibold text-white">MovieWale</span> and opening an external website.
              </p>
              <p className="text-[#888]">
                MovieWale is not responsible for third-party website content. The external link is provided for convenience only and does not imply any endorsement or ownership.
              </p>
              <div className="rounded-lg border border-[#1a1a1a] bg-[#050505] p-3">
                <p className="text-xs text-[#555]">Destination URL:</p>
                <p className="mt-1 break-all text-xs text-[#5D5DFF]">{url}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowNotice(false)}
                className="flex-1 rounded-lg border border-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-[#D4D4D4] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                Cancel
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                onClick={() => setShowNotice(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#5D5DFF] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#4A4ACC]"
              >
                <ExternalLink className="h-4 w-4" />
                Continue
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}