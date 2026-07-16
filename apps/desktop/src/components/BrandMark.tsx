export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true">
      <img
        className="brand-mark__image brand-mark__image--light"
        src="/brand/codex-styler-logo-light.png"
        alt=""
      />
      <img
        className="brand-mark__image brand-mark__image--dark"
        src="/brand/codex-styler-logo-dark.png"
        alt=""
      />
    </span>
  );
}
