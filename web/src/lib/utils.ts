import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIndustryColor(type: string | undefined) {
  switch (type) {
    case "BAR":
      return {
        primary: "bg-indigo-600",
        secondary: "bg-indigo-50",
        accent: "bg-violet-500",
        text: "text-indigo-600",
        border: "border-indigo-100",
        gradient: "from-indigo-600 via-violet-600 to-purple-600",
        gradientSoft: "from-indigo-50/50 via-violet-50/50 to-purple-50/50",
        glow: "shadow-indigo-500/20",
        ring: "ring-indigo-500/10"
      };
    case "RESTAURANT":
      return {
        primary: "bg-rose-600",
        secondary: "bg-rose-50",
        accent: "bg-orange-500",
        text: "text-rose-600",
        border: "border-rose-100",
        gradient: "from-rose-600 via-pink-600 to-orange-600",
        gradientSoft: "from-rose-50/50 via-pink-50/50 to-orange-50/50",
        glow: "shadow-rose-500/20",
        ring: "ring-rose-500/10"
      };
    case "PHARMACY":
      return {
        primary: "bg-emerald-600",
        secondary: "bg-emerald-50",
        accent: "bg-teal-500",
        text: "text-emerald-600",
        border: "border-emerald-100",
        gradient: "from-emerald-600 via-teal-600 to-cyan-600",
        gradientSoft: "from-emerald-50/50 via-teal-50/50 to-cyan-50/50",
        glow: "shadow-emerald-500/20",
        ring: "ring-emerald-500/10"
      };
    default:
      return {
        primary: "bg-blue-600",
        secondary: "bg-blue-50",
        accent: "bg-cyan-500",
        text: "text-blue-600",
        border: "border-blue-100",
        gradient: "from-blue-600 via-dodgerblue-600 to-cyan-600",
        gradientSoft: "from-blue-50/50 via-dodgerblue-50/50 to-cyan-50/50",
        glow: "shadow-blue-500/20",
        ring: "ring-blue-500/10"
      };
  }
}
