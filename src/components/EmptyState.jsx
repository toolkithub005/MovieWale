import React from "react";
import { Film } from "lucide-react";

export default function EmptyState({ title = "No movies found", message = "Try adjusting your search or browse our genres." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-[#0F0F0F] p-6">
        <Film className="h-10 w-10 text-[#333]" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[#888]">{message}</p>
    </div>
  );
}