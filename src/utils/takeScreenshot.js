import html2canvas from "html2canvas";

export default async function takeScreenshot(
  element,
  player1,
  player2
) {
  if (!element) return;

  try {
    const canvas =
      await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#f1f5f9",
        logging: false,
      });

    const cleanName = name =>
      (name || "player").replace(
        /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
        "-"
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
  } catch (err) {
    console.error(
      "Kļūda veidojot ekrānuzņēmumu:",
      err
    );
  }
}