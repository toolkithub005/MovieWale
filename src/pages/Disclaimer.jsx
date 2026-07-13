import React, { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

export default function Disclaimer() {
  useEffect(() => {
    document.title = `Disclaimer | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Disclaimer" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Disclaimer</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>The information provided on {SITE_NAME} is for general informational and entertainment purposes only. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of any information on this website.</p>
          <h2 className="text-xl font-bold text-white pt-4">Movie Information</h2>
          <p>Movie data, including ratings, release dates, cast information, and synopses, is sourced from The Movie Database (TMDB) and other publicly available sources. We do not claim ownership of this data and present it for informational purposes only.</p>
          <h2 className="text-xl font-bold text-white pt-4">External Links</h2>
          <p>Through this website, you may be directed to other websites that are not under our control. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorsement of the views expressed within them.</p>
          <p>All external links on {SITE_NAME} are clearly labeled as "Movie Link" and accompanied by a notice informing you that you are leaving {SITE_NAME}. External links open in a new browser tab with the security attributes <code className="rounded bg-[#0F0F0F] px-1.5 py-0.5 text-xs">rel="noopener noreferrer nofollow sponsored"</code> applied. {SITE_NAME} is not responsible for third-party website content.</p>
          <h2 className="text-xl font-bold text-white pt-4">No Streaming or Downloads</h2>
          <p>{SITE_NAME} does not host, stream, or distribute any copyrighted movie content. We provide information about movies and may link to official sources where movies can be legally viewed.</p>
          <h2 className="text-xl font-bold text-white pt-4">Limitation</h2>
          <p>Any reliance you place on information from this website is strictly at your own risk. We will not be liable for any loss or damage arising from the use of this website.</p>
        </div>
      </div>
    </div>
  );
}