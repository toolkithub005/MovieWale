import React from "react";

export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#5D5DFF]" />
      <p className="mt-4 text-sm text-[#555]">{text}</p>
    </div>
  );
}