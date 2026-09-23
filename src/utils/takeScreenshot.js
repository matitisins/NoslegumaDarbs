/*
 * Nodrošina salīdzināšanas sadaļas ekrānuzņēmuma izveidi.
 * Pārveido norādīto HTML elementu PNG attēlā un automātiski lejupielādē
 * failu ar abu salīdzināto spēlētāju vārdiem.
 */

import html2canvas from "html2canvas";

const cleanName = name =>
  String(name || "player")
    .replace(
      /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
      "-"
    );

export default async function takeScreenshot(
  element,
  player1,
  player2
) {
  if (!element) return;

  try {
    const canvas = await html2canvas(
      element,
      {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#f1f5f9",
        logging: false,
      }
    );

    const link =
      document.createElement("a");

    link.href =
      canvas.toDataURL("image/png");

    link.download =
      `flow-comparison-${cleanName(
        player1?.name
      )}-vs-${cleanName(
        player2?.name
      )}.png`;

    link.click();
  } catch (error) {
    console.error(
      "Kļūda veidojot ekrānuzņēmumu:",
      error
    );
  }
}