// ============================================
// uiX - Validation Utilities
// ============================================

import type { ValidationRule, FieldValidationResult } from "../types";

const DEFAULT_MESSAGES: Record<string, string> = {
  required: "Este campo es obligatorio",
  email: "Ingrese un email válido",
  minLength: "Mínimo {value} caracteres",
  maxLength: "Máximo {value} caracteres",
  min: "El valor mínimo es {value}",
  max: "El valor máximo es {value}",
  pattern: "Formato inválido",
  url: "Ingrese una URL válida",
  phone: "Ingrese un teléfono válido",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const PHONE_REGEX = /^[\d\s\-().+]{7,20}$/;

function getDefaultMessage(type: string, value?: string | number): string {
  const template = DEFAULT_MESSAGES[type] ?? "Validación fallida";
  return template.replace("{value}", String(value ?? ""));
}

function validateRule(
  value: unknown,
  rule: ValidationRule
): { isValid: boolean; error?: string } {
  const stringValue = String(value ?? "");
  const message =
    rule.message ?? getDefaultMessage(rule.type, rule.value as string | number);

  switch (rule.type) {
    case "required":
      if (value === undefined || value === null || stringValue.trim() === "") {
        return { isValid: false, error: message };
      }
      break;

    case "email":
      if (stringValue && !EMAIL_REGEX.test(stringValue)) {
        return { isValid: false, error: message };
      }
      break;

    case "minLength":
      if (stringValue && stringValue.length < (rule.value as number)) {
        return { isValid: false, error: message };
      }
      break;

    case "maxLength":
      if (stringValue && stringValue.length > (rule.value as number)) {
        return { isValid: false, error: message };
      }
      break;

    case "min": {
      const numMin = parseFloat(stringValue);
      if (!isNaN(numMin) && numMin < (rule.value as number)) {
        return { isValid: false, error: message };
      }
      break;
    }

    case "max": {
      const numMax = parseFloat(stringValue);
      if (!isNaN(numMax) && numMax > (rule.value as number)) {
        return { isValid: false, error: message };
      }
      break;
    }

    case "pattern": {
      const regex =
        rule.value instanceof RegExp
          ? rule.value
          : new RegExp(rule.value as string);
      if (stringValue && !regex.test(stringValue)) {
        return { isValid: false, error: message };
      }
      break;
    }

    case "url":
      if (stringValue && !URL_REGEX.test(stringValue)) {
        return { isValid: false, error: message };
      }
      break;

    case "phone":
      if (stringValue && !PHONE_REGEX.test(stringValue)) {
        return { isValid: false, error: message };
      }
      break;
  }

  return { isValid: true };
}

export function validateField(
  name: string,
  value: unknown,
  rules: ValidationRule[]
): FieldValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const result = validateRule(value, rule);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }

  return { name, value, isValid: errors.length === 0, errors };
}

export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}
