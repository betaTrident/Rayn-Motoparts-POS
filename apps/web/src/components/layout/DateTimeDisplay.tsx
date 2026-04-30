import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DateTimeDisplayProps {
  className?: string;
}

/**
 * DateTimeDisplay — A clean, industrial-styled real-time clock component.
 * Displays the current date and time in a professional format.
 */
const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({ className }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000 * 30); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  // Format parts: Wednesday, 27 Mar 2024 at 9:48 AM
  const formatDate = (date: Date) => {
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
    const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return `${dayName}, ${day} ${month} ${year} at ${time}`;
  };

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-3 px-4 py-2",
        "bg-[#f3f3f3]/70 border border-[rgba(84,96,103,0.18)] rounded-sm shadow-sm",
        "text-xs font-semibold text-[#546067] select-none",
        className
      )}
    >
      <span 
        className="material-symbols-outlined text-[#ff5722]" 
        style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
      >
        calendar_today
      </span>
      <span className="tracking-tight">
        {formatDate(now)}
      </span>
    </div>
  );
};

export default DateTimeDisplay;
