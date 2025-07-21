import React, { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  children: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  helpText,
  icon,
  children
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className={`relative ${icon ? 'has-icon' : ''}`}>
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {children}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;