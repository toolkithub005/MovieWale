import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayout() {
  return (
    <div className="film-grain min-h-screen bg-[#050505]">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}