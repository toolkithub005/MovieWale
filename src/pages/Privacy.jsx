import React, { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

export default function Privacy() {
  useEffect(() => {
    document.title = `Privacy Policy | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-[#555]">Last updated: July 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>{SITE_NAME} ("we," "us," or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and protect your data when you visit our website.</p>
          <h2 className="text-xl font-bold text-white pt-4">Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-white">Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent, and referring URLs.</li>
            <li><strong className="text-white">Device Data:</strong> Browser type, operating system, screen resolution, and IP address.</li>
            <li><strong className="text-white">Cookies:</strong> Small data files stored on your device to improve your browsing experience.</li>
          </ul>
          <h2 className="text-xl font-bold text-white pt-4">How We Use Your Information</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>To improve the functionality and content of our website</li>
            <li>To analyze usage patterns and optimize performance</li>
            <li>To serve relevant advertisements, if applicable</li>
          </ul>
          <h2 className="text-xl font-bold text-white pt-4">Third-Party Services</h2>
          <p>We use third-party services such as The Movie Database (TMDB) for movie data. These services have their own privacy policies governing the use of your information.</p>
          <h2 className="text-xl font-bold text-white pt-4">Data Security</h2>
          <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
          <h2 className="text-xl font-bold text-white pt-4">Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting us at contact@moviewale.online.</p>
          <h2 className="text-xl font-bold text-white pt-4">Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last updated" date.</p>
        </div>
      </div>
    </div>
  );
}