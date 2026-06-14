/**
 * Hiển thị avatar: nếu là URL ảnh (avatar Google) → render <img>;
 * nếu là emoji → render text. Đặt trong 1 container có kích thước +
 * overflow-hidden + rounded để ảnh được bo tròn.
 */
export default function Avatar({
  value,
  className = "",
}: {
  value?: string | null;
  className?: string;
}) {
  const v = value && value.length > 0 ? value : "🙂";

  if (/^https?:\/\//.test(v)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={v}
        alt=""
        referrerPolicy="no-referrer"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return <span className={className}>{v}</span>;
}
