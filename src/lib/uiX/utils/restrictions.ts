// ============================================
// uiX - Restriction Utilities
// ============================================

import type { RestrictionRule } from "../types";

const CONTROL_KEYS = [
  "Backspace", "Delete", "Tab", "Escape", "Enter",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
];

export function shouldBlockKey(
  key: string,
  currentValue: string,
  restrictions: RestrictionRule[]
): boolean {
  if (CONTROL_KEYS.includes(key)) return false;

  for (const restriction of restrictions) {
    switch (restriction.type) {
      case "onlyNumbers":
        if (!/^\d$/.test(key)) return true;
        break;
      case "onlyLetters":
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]$/.test(key)) return true;
        break;
      case "onlyAlphanumeric":
        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]$/.test(key)) return true;
        break;
      case "noSpaces":
        if (key === " ") return true;
        break;
      case "maxChars":
        if (restriction.value && currentValue.length >= restriction.value)
          return true;
        break;
    }
  }

  return false;
}

export function applyRestrictionsToValue(
  value: string,
  restrictions: RestrictionRule[]
): string {
  let result = value;

  for (const restriction of restrictions) {
    switch (restriction.type) {
      case "onlyNumbers":
        result = result.replace(/[^\d]/g, "");
        break;
      case "onlyLetters":
        result = result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, "");
        break;
      case "onlyAlphanumeric":
        result = result.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g, "");
        break;
      case "noSpaces":
        result = result.replace(/\s/g, "");
        break;
      case "maxChars":
        if (restriction.value) result = result.slice(0, restriction.value);
        break;
    }
  }

  return result;
}
