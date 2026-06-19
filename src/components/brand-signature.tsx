import Image from "next/image";

const brandAsset = "/brand/logo-escola-labc-inovacao-web.png";

const brandAlt =
  "Escola LaBC de Inovação - do conhecimento à ação, do presente ao futuro";

export function BrandLogo({
  className,
  priority = false,
  sizes = "104px"
}: {
  className: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      alt={brandAlt}
      className={className}
      height={720}
      priority={priority}
      sizes={sizes}
      src={brandAsset}
      width={720}
    />
  );
}

export function PublicBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "public-brand compact" : "public-brand"}>
      <BrandLogo className="public-brand-logo" />
      <div>
        <strong>Escola LaBC de Inovação</strong>
        <span>Do conhecimento à ação. Do presente ao futuro.</span>
      </div>
    </div>
  );
}
