import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { AdAstraLogo, WORDMARK_ASPECT } from "@/components/brand/AdAstraLogo";
import { ALTUM_ASPECT, AltumMark } from "@/components/brand/AltumMark";
import { TAGLINE_EN, TAGLINE_PL } from "@/components/brand/paths.generated";
import { colors } from "@/lib/brand/tokens";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!hasLocale(lang)) return [];
  const dict = await getDictionary(lang);
  return [{ id: "og", alt: dict.meta.ogAlt, size, contentType }];
}

const LOGO_WIDTH = 760;
const TAGLINE_CAP = 15; // wysokość wersalika hasła w px
const ALTUM_HEIGHT = 58;

/** OG image 1200×630: tło ivory, AD ASTRA, hasło, ALTUM Development. Bez fontów — same ścieżki SVG. */
export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const tagline = lang === "pl" ? TAGLINE_PL : TAGLINE_EN;
  const scale = TAGLINE_CAP / tagline.capHeight;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: colors.ivory,
        position: "relative",
      }}
    >
      {/* rama 1 px w złocie, jak na panelach */}
      <div
        style={{
          position: "absolute",
          inset: 28,
          border: `1px solid ${colors.gold}`,
          display: "flex",
        }}
      />
      <AdAstraLogo
        title={null}
        color={colors.ink}
        width={LOGO_WIDTH}
        height={Math.round(LOGO_WIDTH / WORDMARK_ASPECT)}
      />
      <div style={{ width: 64, height: 1, background: colors.gold, marginTop: 36, display: "flex" }} />
      <svg
        width={Math.round(tagline.box.width * scale)}
        height={Math.round(tagline.box.height * scale)}
        viewBox={`${tagline.box.x} ${tagline.box.y} ${tagline.box.width} ${tagline.box.height}`}
        style={{ marginTop: 30 }}
      >
        <path d={tagline.d} fill={colors.inkSoft} />
      </svg>
      <div style={{ position: "absolute", bottom: 64, display: "flex" }}>
        <AltumMark
          title={null}
          color={colors.ink}
          height={ALTUM_HEIGHT}
          width={Math.round(ALTUM_HEIGHT * ALTUM_ASPECT)}
        />
      </div>
    </div>,
    size,
  );
}
