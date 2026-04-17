import { InputX } from "@/lib/uiX/components/InputX";
import { SelectX } from "@/lib/uiX/components/SelectX";
import type { Empresas } from "../empresas.types";
import { InputFileX } from "@/lib/uiX";

export function getEmpresasFields(
  initialData: Empresas | null,
  options: {
    tipoDocumentosOptions: Array<{ value: number; label: string }>;
  },
): HTMLElement[] {
  return [
    InputX({
      name: "nombre",
      label: "Nombre",
      placeholder: "Ingrese nombre",
      type: "text",
      defaultValue:
        initialData?.nombre != null ? String(initialData.nombre) : "",
      rules: {
        validations: [
          { type: "required", message: "Nombre es obligatorio" },
          { type: "maxLength", value: 255 },
        ],
      },
    }),
    SelectX({
      name: "tipo_documento_id",
      label: "Tipo Documento Id",
      placeholder: "Seleccionar...",
      options: options.tipoDocumentosOptions ?? [],
      defaultValue:
        initialData?.tipo_documento_id != null
          ? String(initialData.tipo_documento_id)
          : "",
      rules: {
        validations: [
          { type: "required", message: "Tipo Documento Id es obligatorio" },
        ],
      },
    }),
    InputX({
      name: "numero_documento",
      label: "Numero Documento",
      placeholder: "Ingrese numero documento",
      type: "text",
      defaultValue:
        initialData?.numero_documento != null
          ? String(initialData.numero_documento)
          : "",
      rules: {
        validations: [
          { type: "required", message: "Numero Documento es obligatorio" },
          { type: "maxLength", value: 255 },
        ],
      },
    }),
   InputFileX({
  name: "logo",
  label: "Logo",
  accept: "image/*",
  // Si solo necesitas una imagen:
  multiple: false,
  maxSize: 2 * 1024 * 1024, // 2MB opcional
}),
  ];
}
