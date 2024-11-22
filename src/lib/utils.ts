import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
