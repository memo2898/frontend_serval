// ============================================
// uiX - Core Types
// ============================================

// Validation types
export type ValidationType =
  | "required"
  | "email"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "pattern"
  | "url"
  | "phone";

export interface ValidationRule {
  type: ValidationType;
  value?: string | number | RegExp;
  message?: string;
}

// Restriction types
export type RestrictionType =
  | "onlyNumbers"
  | "onlyLetters"
  | "onlyAlphanumeric"
  | "noSpaces"
  | "maxChars";

export interface RestrictionRule {
  type: RestrictionType;
  value?: number;
}

// Formatting types
export type FormattingType =
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "trim"
  | "phone"
  | "currency"
  | "cedula"
  | "creditCard";

export interface FormattingRule {
  type: FormattingType;
  format?: string;
}

// Combined rules for inputs
export interface InputRules {
  validations?: ValidationRule[];
  restrictions?: RestrictionRule[];
  formatting?: FormattingRule[];
}

// Validation event trigger
export type ValidateOn = "change" | "blur" | "submit";

// Field validation result
export interface FieldValidationResult {
  name: string;
  value: unknown;
  isValid: boolean;
  errors: string[];
}

// Form submit result
export interface FormSubmitResult {
  general_validation: boolean;
  body: Record<string, unknown>;
  validations_results: FieldValidationResult[];
}

// Field registration (used internally between FormX and inputs)
export interface FieldRegistration {
  name: string;
  getValue: () => unknown;
  validate: () => FieldValidationResult;
  setError: (errors: string[]) => void;
  clearError: () => void;
}

// SelectX option type
export interface SelectXOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}
