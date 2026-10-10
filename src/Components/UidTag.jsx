/** Huy hiệu ID nhỏ đặt cạnh tên người dùng: Hoa Hoang #123456 */
export default function UidTag({ id, style }) {
  if (!id) return null;
  return (
    <span
      title={`Account ID ${id}`}
      style={{
        marginLeft: '6px',
        padding: '0 6px',
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.4px',
        color: '#fbbf24',
        background: 'rgba(251,191,36,.12)',
        border: '1px solid rgba(251,191,36,.35)',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
        verticalAlign: '1px',
        ...style,
      }}
    >
      #{id}
    </span>
  );
}
