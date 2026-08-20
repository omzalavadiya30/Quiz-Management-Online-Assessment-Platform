"use client";

import StudentNavigation from "./StudentNavigation";
import { usePathname } from "next/navigation";

export default function StudentPageNavigation() {
  const pathname = usePathname();
  if (!pathname.startsWith("/student/") && pathname !== "/dashboard") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-md sm:bottom-6">
      <StudentNavigation />
    </div>
  );
}
