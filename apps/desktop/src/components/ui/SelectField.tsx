import { ChevronDown } from "lucide-react";
import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}

export function SelectField({
  label,
  hint,
  children,
  compact = false,
  id,
  className,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <label
      className={
        "ui-select-field" +
        (compact ? " ui-select-field--compact" : "") +
        (className ? ` ${className}` : "")
      }
      htmlFor={controlId}
    >
      {label && <span className="ui-select-field__label">{label}</span>}
      <span className="ui-select">
        <select id={controlId} {...props}>
          {children}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </span>
      {hint && <small className="ui-select-field__hint">{hint}</small>}
    </label>
  );
}
