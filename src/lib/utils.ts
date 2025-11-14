import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FaultType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const faultTypeTranslations: Record<FaultType, string> = {
  electricity: "Elektra",
  plumbing: "Santechnika",
  heating: "Šildymas",
  general: "Bendri gedimai",
};
