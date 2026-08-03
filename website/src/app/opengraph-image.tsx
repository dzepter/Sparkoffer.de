import { ImageResponse } from "next/og";

/** Social-Sharing-Bild (Open Graph) – ohne externe Abhängigkeiten erzeugt. */

export const alt =
  "Handel Offensiv – Der Führungsführerschein für den Handel. Handel ist Mannschaftssport. Führung entscheidet das Spiel.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          backgroundColor: "#15171c",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Taktik-Halbkreis rechts */}
        <div
          style={{
            position: "absolute",
            right: "-160px",
            top: "115px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: "26px",
            letterSpacing: "6px",
            color: "#a8adb5",
            textTransform: "uppercase",
          }}
        >
          Aigner Offensiv präsentiert
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "24px",
            fontSize: "110px",
            fontWeight: 800,
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          Handel
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "110px",
            fontWeight: 800,
            lineHeight: 1.02,
            textTransform: "uppercase",
            color: "#ef6660",
          }}
        >
          Offensiv
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "32px",
            fontSize: "34px",
            color: "#e8e6e1",
          }}
        >
          Der Führungsführerschein für den Handel
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "16px",
            fontSize: "26px",
            color: "#a8adb5",
          }}
        >
          Handel ist Mannschaftssport. Führung entscheidet das Spiel.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "14px",
            backgroundColor: "#c1272d",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
