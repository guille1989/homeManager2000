type BrandLogoProps = {
  dark?: boolean;
  compact?: boolean;
};

export const BrandLogo = ({ dark = false, compact = false }: BrandLogoProps) => (
  <div className="flex items-center gap-3">
    {compact ? (
      <img
        src="/img/InnoApp - Isotipo 1080x1080.png"
        alt="InnoApp"
        className="h-15 w-15 object-contain"
      />
    ) : dark ? (
      <img
        src="/img/InnoApp - Logotipo - vector.svg"
        alt="InnoApp — Simple and Efficient"
        className="h-25 object-contain"
        style={{ filter: "none" }}
      />
    ) : (
      <>
        <img
          src="/img/InnoApp - Isotipo 1080x1080.png"
          alt=""
          aria-hidden="true"
          className="h-15 w-15 object-contain"
        />
        <div className="leading-tight">
          <span className="block text-xl font-extrabold text-ink">InnoApp</span>
          <span className="block text-xs font-medium text-brand">Simple and Efficient</span>
        </div>
      </>
    )}
  </div>
);
