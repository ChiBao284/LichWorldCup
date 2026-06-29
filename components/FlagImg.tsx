/**
 * Render cờ quốc gia dạng ảnh từ flagcdn.com thay vì emoji —
 * tránh lỗi trên Windows/Chrome không render flag emoji đúng cách.
 */

function flagEmojiToISO(emoji: string): string | null {
  if (!emoji) return null;
  const chars = [...emoji];
  if (chars.length !== 2) return null;
  const cp0 = chars[0].codePointAt(0);
  const cp1 = chars[1].codePointAt(0);
  if (!cp0 || !cp1) return null;
  // Regional Indicator: U+1F1E6–U+1F1FF → A–Z
  if (cp0 < 0x1f1e6 || cp0 > 0x1f1ff) return null;
  if (cp1 < 0x1f1e6 || cp1 > 0x1f1ff) return null;
  return String.fromCharCode(cp0 - 0x1f1a5, cp1 - 0x1f1a5).toLowerCase();
}

export default function FlagImg({
  emoji,
  className = "",
  style,
}: {
  emoji: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const code = flagEmojiToISO(emoji);
  if (!code) return <span className={`inline-block shrink-0 rounded-sm bg-white/10 ${className}`} style={style} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
      alt={code.toUpperCase()}
      className={className}
      style={style}
    />
  );
}
