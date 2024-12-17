import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDuration(ms: number): string {
  return `${ms.toFixed(0)}ms`
}