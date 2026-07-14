import React, { useEffect } from "react";
import Seo from "@/components/Seo";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <Seo
        title={`About | ${SITE_NAME}`}
        description={SITE_DESCRIPTION}
        url={`${SITE_URL}/about`}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">About {SITE_NAME}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
          <p>
            {SITE_NAME} is your go-to destination for discovering movies, watching trailers, exploring cast and crew details, and finding where to watch your favorite films. We curate movie information from trusted sources to bring you a comprehensive, easy-to-navigate movie discovery experience.
          </p>
          <p>
            Our mission is to help movie enthusiasts find their next great watch. Whether you're looking for the latest blockbusters, timeless classics, or hidden indie gems, {SITE_NAME} has you covered with detailed movie information, ratings, trailers, and more.
          </p>
          <h2 className="text-xl font-bold text-white pt-4">What We Offer</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#D4D4D4]">
            <li>Comprehensive movie database with detailed information</li>
            <li>Movie trailers and video content</li>
            <li>Ratings and reviews from trusted sources</li>
            <li>Genre-based browsing and discovery</li>
            <li>Powerful search to find any movie quickly</li>
            <li>Cast, crew, and production details</li>
          </ul>
          <h2 className="text-xl font-bold text-white pt-4">Data Attribution</h2>
          <p>
            Movie data on {SITE_NAME} is sourced from The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB. All movie posters, backdrops, and metadata are the property of their respective owners.
          </p>
        </div>
      </div>
    </div>
  );
}