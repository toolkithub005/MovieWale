import React, { useEffect } from "react";
import Seo from "@/components/Seo";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

export default function DMCA() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <Seo
        title={`DMCA / Copyright | ${SITE_NAME}`}
        description={SITE_DESCRIPTION}
        url={`${SITE_URL}/dmca`}
        noindex={true}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "DMCA" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">DMCA / Copyright Notice</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>{SITE_NAME} respects the intellectual property rights of others and expects its users to do the same. We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).</p>
          <h2 className="text-xl font-bold text-white pt-4">Reporting Copyright Infringement</h2>
          <p>If you believe that content on this website infringes your copyright, please provide us with the following information:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>A description of the copyrighted work you claim has been infringed.</li>
            <li>The URL or location on our website where the allegedly infringing material is located.</li>
            <li>Your full name, mailing address, telephone number, and email address.</li>
            <li>A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf.</li>
            <li>Your physical or electronic signature.</li>
          </ol>
          <h2 className="text-xl font-bold text-white pt-4">Contact for DMCA Notices</h2>
          <p>Please send DMCA takedown requests to:</p>
          <div className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] p-4">
            <p className="text-[#D4D4D4]">Email: <a href="mailto:dmca@moviewale.online" className="text-[#5D5DFF] hover:underline">dmca@moviewale.online</a></p>
            <p className="mt-2 text-[#D4D4D4]">Subject line: DMCA Takedown Request</p>
          </div>
          <h2 className="text-xl font-bold text-white pt-4">Response Time</h2>
          <p>We will review and respond to valid DMCA notices within a reasonable timeframe. Content found to be infringing will be removed promptly.</p>
        </div>
      </div>
    </div>
  );
}