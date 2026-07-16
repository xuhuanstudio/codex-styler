export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true">
      <span className="brand-mark__field" />
      <span className="brand-mark__line brand-mark__line--a" />
      <span className="brand-mark__line brand-mark__line--b" />
      <span className="brand-mark__dot" />
    </span>
  );
}

