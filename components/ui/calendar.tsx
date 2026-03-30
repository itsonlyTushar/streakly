"use client";

import * as React from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore,
  startOfToday
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const today = startOfToday();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <span className="text-lg font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EEE";
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs font-bold text-muted-foreground uppercase py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isDisabled = isBefore(day, today) && !isSameDay(day, today);
        const isSelected = selected && isSameDay(day, selected);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            className={cn(
              "h-10 w-full rounded-xl flex items-center justify-center text-sm font-medium transition-all relative overflow-hidden group",
              !isCurrentMonth && "text-muted-foreground/30",
              isDisabled && "opacity-20 cursor-not-allowed",
              isSelected && "bg-primary text-primary-foreground shadow-lg scale-100",
              !isSelected && !isDisabled && "hover:bg-secondary"
            )}
            onClick={() => onSelect(cloneDay)}
          >

            <span>{formattedDate}</span>
            {isSameDay(day, today) && !isSelected && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className={cn("p-3 bg-card", className)}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="flex items-center justify-between mt-2 px-1 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => onSelect(undefined as any)}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onSelect(today)}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}


