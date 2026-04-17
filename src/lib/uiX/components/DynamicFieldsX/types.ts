/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================
// uiX - DynamicFieldsX Types
// ============================================

import { type InputRules, type SelectXOption } from "../../types";

export type FieldComponent =
  | "Input"
  | "Select"
  | "Checkbox"
  | "Date"
  | "Textarea"
  | "File";

export type InputType = "text" | "number" | "email" | "password";

export type ContractType = "define" | "follow" | "extend" | "none";

// FieldDefinition: schema entry (used in define / follow / extend)
export interface FieldDefinition {
  id: string;
  component: FieldComponent;
  name: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type?: InputType;
  rules?: InputRules;
  // options: SelectXOption[] = inline list, string = reference key for optionsResolvers
  options?: SelectXOption[] | string;
  allowFreeText?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

// SimpleField: used in extend (extras) and none contracts
export interface SimpleField {
  id: string;
  name: string;
  label: string;
  input_type: "text" | "number" | "checkbox";
  value: any;
}

// Generates a unique ID for fields
export function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Converts a label string to a snake_case identifier
export function labelToName(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Re-export for consumers
export type { InputRules, SelectXOption };
