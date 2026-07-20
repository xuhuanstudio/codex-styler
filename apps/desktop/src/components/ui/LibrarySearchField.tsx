import { Search, X } from "lucide-react";
import { useRef } from "react";

export interface LibrarySearchFieldProps {
  value: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  resultCount: number;
  totalCount: number;
  onChange: (value: string) => void;
}

export function LibrarySearchField({
  value,
  label,
  placeholder,
  clearLabel,
  resultCount,
  totalCount,
  onChange,
}: LibrarySearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className="library-search-field" role="search">
      <Search size={14} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !value) return;
          event.preventDefault();
          clear();
        }}
      />
      <output aria-live="polite">
        {resultCount}/{totalCount}
      </output>
      {value && (
        <button type="button" onClick={clear} aria-label={clearLabel}>
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
