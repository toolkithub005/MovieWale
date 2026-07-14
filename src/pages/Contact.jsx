import React, { useEffect } from "react";
import Seo from "@/components/Seo";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";
import { Mail } from "lucide-react";

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <Seo
        title={`Contact Us | ${SITE_NAME}`}
        description={SITE_DESCRIPTION}
        url={`${SITE_URL}/contact`}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Contact Us</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>
            We'd love to hear from you. If you have questions, feedback, or concerns about {SITE_NAME}, please reach out to us using the information below.
          </p>
          <div className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#5D5DFF]/10 p-3">
                <Mail className="h-5 w-5 text-[#5D5DFF]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#555]">Email</p>
                <a href="mailto:contact@moviewale.online" className="text-[#D4D4D4] hover:text-white transition-colors">
                  contact@moviewale.online
                </a>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white pt-4">DMCA & Copyright Notices</h2>
          <p>
            If you believe that content on this website infringes your copyright, please visit our <a href="/dmca" className="text-[#5D5DFF] hover:underline">DMCA page</a> for instructions on how to submit a takedown request.
          </p>
          <h2 className="text-xl font-bold text-white pt-4">Response Time</h2>
          <p>
            We aim to respond to all inquiries within 48 hours. For urgent copyright matters, please clearly mark your email subject line as "DMCA Takedown Request."
          </p>
        </div>
      </div>
    </div>
  );
}