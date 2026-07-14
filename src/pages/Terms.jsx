import React, { useEffect } from "react";
import Seo from "@/components/Seo";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <Seo
        title={`Terms & Conditions | ${SITE_NAME}`}
        description={SITE_DESCRIPTION}
        url={`${SITE_URL}/terms`}
        noindex={true}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Terms & Conditions</h1>
        <p className="mt-2 text-xs text-[#555]">Last updated: July 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>By accessing and using {SITE_NAME}, you agree to comply with and be bound by the following terms and conditions.</p>
          <h2 className="text-xl font-bold text-white pt-4">Use of the Website</h2>
          <p>{SITE_NAME} provides movie information, trailers, and related content for informational and entertainment purposes. You agree to use this website lawfully and not engage in any activity that could harm the website or its users.</p>
          <h2 className="text-xl font-bold text-white pt-4">Content Accuracy</h2>
          <p>We strive to provide accurate and up-to-date movie information. However, we do not guarantee the accuracy, completeness, or timeliness of any content on this website. Movie data is sourced from third-party providers including TMDB.</p>
          <h2 className="text-xl font-bold text-white pt-4">External Links</h2>
          <p>Our website may contain links to external websites. We are not responsible for the content, privacy practices, or availability of these third-party sites.</p>
          <h2 className="text-xl font-bold text-white pt-4">Intellectual Property</h2>
          <p>All content on {SITE_NAME}, unless otherwise noted, is the property of {SITE_NAME} or its content suppliers. Movie posters, images, and metadata are the property of their respective owners and are used for informational purposes.</p>
          <h2 className="text-xl font-bold text-white pt-4">Limitation of Liability</h2>
          <p>{SITE_NAME} shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this website.</p>
          <h2 className="text-xl font-bold text-white pt-4">Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the website constitutes acceptance of the updated terms.</p>
        </div>
      </div>
    </div>
  );
}