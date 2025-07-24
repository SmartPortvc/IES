import React, { ReactNode } from "react";

interface FormFieldProps {
  id?: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = "text",
  required = false,
  error,
  helpText,
  icon,
  value,
  onChange,
  children,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className={`relative ${icon ? "has-icon" : ""}`}>
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {children || (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              icon ? "pl-10" : ""
            }`}
          />
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;
