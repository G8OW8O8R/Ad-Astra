import { ImageResponse } from "next/og";
import { iconStarPath } from "@/lib/brand/icon";
import { colors } from "@/lib/brand/tokens";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ikona aplikacji (iOS zaokrągla rogi sam): gwiazda gold-soft na nocnym tle. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: colors.night,
      }}
    >
      <svg width={180} height={180} viewBox="0 0 180 180">
        <path d={iconStarPath(180)} fill={colors.goldSoft} />
      </svg>
    </div>,
    size,
  );
}
