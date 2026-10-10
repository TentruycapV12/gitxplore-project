// Tiện ích tìm kiếm dùng chung: bỏ dấu tiếng Việt, chấm điểm độ khớp, chịu lỗi gõ sai nhẹ.

const MARKS = /[\u0300-\u036f]/g;
const one = (x, fallback) => (x.length === 1 ? x : fallback);

/**
 * Bỏ dấu + hạ chữ thường nhưng GIỮ NGUYÊN độ dài chuỗi
 * (để tô sáng từ khóa đúng vị trí trong chuỗi gốc).
 */
export const fold = (s = '') =>
  String(s)
    .split('')
    .map((ch) => {
      const lower = one(ch.toLowerCase(), ch);
      if (lower === 'đ') return 'd';
      const base = lower.normalize('NFD').replace(MARKS, '');
      return base.length === 1 ? base : lower;
    })
    .join('');

/** Chuỗi chuẩn hóa để so khớp: "Việc làm - Đà Nẵng" -> "viec lam da nang". */
export const norm = (s = '') =>
  fold(String(s ?? '').normalize('NFC'))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Khoảng cách chỉnh sửa (Levenshtein) có chặn trên: true nếu <= max. */
function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

const typoLimit = (len) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

/**
 * Điểm khớp 0..100 giữa từ khóa đã chuẩn hóa (qn) và một đoạn text.
 *  100 trùng hẳn | 85 bắt đầu bằng | 70 chứa nguyên cụm | ~27-60 khớp từng từ | 0 không khớp.
 * Mọi từ trong từ khóa đều phải khớp. fuzzy=true cho phép gõ sai 1-2 ký tự (dùng cho tên).
 */
export function scoreText(qn, text, { fuzzy = true } = {}) {
  if (!qn || !text) return 0;
  const t = norm(text);
  if (!t) return 0;
  if (t === qn) return 100;
  if (t.startsWith(qn)) return 85;
  if (qn.length >= 3 && t.includes(qn)) return 70;

  const words = t.split(' ');
  const toks = qn.split(' ');
  let total = 0;
  for (const tok of toks) {
    let best = 0;
    for (const w of words) {
      if (w === tok) best = Math.max(best, 40);
      else if (w.startsWith(tok)) best = Math.max(best, 32);
      else if (tok.length >= 3 && w.includes(tok)) best = Math.max(best, 22);
      else if (fuzzy) {
        const lim = typoLimit(tok.length);
        if (lim && w.length >= 3 && within(tok, w, lim)) best = Math.max(best, 18);
      }
    }
    if (!best) return 0;
    total += best;
  }
  return Math.min(65, Math.round((total / toks.length) * 1.5));
}
