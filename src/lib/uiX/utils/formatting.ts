// ============================================
// uiX - Formatting Utilities
// ============================================

import type { FormattingRule } from "../types";

function formatPhone(value: string, format = "(###) ###-####"): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (const char of format) {
    if (digitIndex >= digits.length) break;
    if (char === "#") {
      result += digits[digitIndex++];
    } else {
      result += char;
    }
  }

  return result;
}

function formatCurrency(value: string, locale = "en-US"): string {
  const number = parseFloat(value.replace(/[^0-9.-]/g, ""));
  if (isNaN(number)) return value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(number);
}

function formatCedula(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
}

function formatCreditCard(value: string): string {
  const digits = value.replace(/\D/g, "");
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function applyFormattingRule(value: string, rule: FormattingRule): string {
  switch (rule.type) {
    case "uppercase":   return value.toUpperCase();
    case "lowercase":   return value.toLowerCase();
    case "capitalize":  return capitalize(value);
    case "trim":        return value.trim();
    case "phone":       return formatPhone(value, rule.format);
    case "currency":    return formatCurrency(value);
    case "cedula":      return formatCedula(value);
    case "creditCard":  return formatCreditCard(value);
    default:            return value;
  }
}

export function applyFormatting(value: string, formatting: FormattingRule[]): string {
  return formatting.reduce((acc, rule) => applyFormattingRule(acc, rule), value);
}

export function getRawValue(value: string, formatting: FormattingRule[]): string {
  let result = value;
  for (const rule of formatting) {
    switch (rule.type) {
      case "phone":
      case "cedula":
      case "creditCard":
        result = result.replace(/\D/g, "");
        break;
      case "currency":
        result = result.replace(/[^0-9.-]/g, "");
        break;
    }
  }
  return result;
}
