import React, { type ReactNode } from "react";

/** What the control inside a FormField needs to be labelled, styled and announced properly. */
export interface FieldControlProps {
  id: string;
  className: string;
  required: boolean | undefined;
  "aria-required": "true" | undefined;
  "aria-invalid": "true" | "false";
  "aria-describedby": string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  /** Render the input/select, spreading the given props onto it. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A label, the control, and its error message, wired together for accessibility:
 * the label points at the control, and the error is linked with aria-describedby
 * and announced when it appears (role="alert").
 */
const FormField = ({ id, label, required, error, children }: FormFieldProps) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-sm text-gray-600">
      {label}{" "}
      {required && (
        <span className="text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
    {children({
      id,
      className: `border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        error ? "border-red-500" : "border-borderColor"
      }`,
      required: required || undefined,
      "aria-required": required ? "true" : undefined,
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": error ? `${id}-error` : undefined,
    })}
    {error && (
      <p id={`${id}-error`} className="text-red-500 text-xs" role="alert">
        {error}
      </p>
    )}
  </div>
);

export default FormField;
