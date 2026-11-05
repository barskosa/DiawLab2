export function contrastRatio(foreground, background) {
  function luminance(color) {
    if (typeof color !== "string") return null;
    let hex = color.trim().replace(/^#/, "");
    if (/^[\da-f]{3}$/i.test(hex))
      hex = [...hex].map((value) => value + value).join("");
    if (!/^[\da-f]{6}$/i.test(hex)) return null;
    const channels = [0, 2, 4].map((index) => {
      const value = parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return null;
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
