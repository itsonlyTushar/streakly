"use client";

import { RevisionCalendar } from "@/components/srs/revision-calendar";
import { ConsolidatedList } from "@/components/consolidated-list";

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div className="space-y-2">
        
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Revision Calendar
          </h1>
          <p className="text-muted-foreground font-medium max-w-sm">
            Keep track of all upcoming SRS and DSA revisions.
          </p>
        </div>
      </header>

      {/* Revision Calendar Dashboard */}
      <RevisionCalendar />

      {/* Consolidated Top 5 — Tasks + SRS + DSA + Machine Coding */}
      <ConsolidatedList />
    </div>
  );
}
