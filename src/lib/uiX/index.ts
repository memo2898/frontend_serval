// ============================================
// uiX Vanilla - Main Index
// ============================================

// Types
export type {
  ValidationType,
  ValidationRule,
  RestrictionType,
  RestrictionRule,
  FormattingType,
  FormattingRule,
  InputRules,
  ValidateOn,
  FieldValidationResult,
  FormSubmitResult,
  FieldRegistration,
  SelectXOption,
} from "./types";

// Components
export { FormX, FormXElement, type FormXConfig }         from "./components/FormX";
export { InputX, InputXElement, type InputXConfig }      from "./components/InputX";
export { SelectX, SelectXElement, type SelectXConfig }   from "./components/SelectX";
export { ModalX, ModalXInstance, type ModalXConfig, type ModalSize } from "./components/ModalX";
export { toastx, type ToastType, type ToastPosition, type ToastOptions } from "./components/ToastX";
export { InputFileX, InputFileXElement, type InputFileXConfig } from "./components/InputFileX";
export {
  DynamicFieldsX, DynamicFieldsXElement, type DynamicFieldsXConfig,
  type FieldDefinition, type SimpleField, type FieldComponent, type InputType, type ContractType,
} from "./components/DynamicFieldsX";

// Utils (for advanced usage)
export {
  validateField,
  isEmpty,
  shouldBlockKey,
  applyRestrictionsToValue,
  applyFormatting,
  getRawValue,
  normalizeText,
  normalizedIncludes,
  normalizedStartsWith,
} from "./utils";
