import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProductReviewSection({ productId, lang }) {
  const { user } = useAuth();
  const isVi = lang === 'vi';
  const storageKey = `gx_reviews_${productId}`;

  const defaultReviews = [
    {
      id: 1,
      userName: 'Trần Hoàng Long',
      rating: 5,
      date: '2026-09-28',
      comment: isVi
        ? 'Sản phẩm giao nhanh, đóng gói cẩn thận. Test đúng như mô tả, tiền giữ Escrow 48h rất an tâm!'
        : 'Fast delivery, well packaged. Works as described, 48h Escrow gave full peace of mind!',
    },
    {
      id: 2,
      userName: 'Nguyễn Minh Quân',
      rating: 5,
      date: '2026-10-02',
      comment: isVi
        ? 'Hàng chính hãng fullbox, shop tư vấn nhiệt tình. Sẽ tiếp tục ủng hộ sàn GitXplore!'
        : 'Genuine product fullbox, seller was super responsive. Highly recommend this marketplace!',
    },
  ];

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultReviews;
  });

  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reviews));
    } catch {}
  }, [reviews, storageKey]);

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, reviews.length)
  ).toFixed(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newRev = {
      id: Date.now(),
      userName: user?.name || user?.username || (isVi ? 'Người mua đã xác thực' : 'Verified Buyer'),
      rating,
      date: new Date().toISOString().split('T')[0],
      comment: commentText.trim(),
    };

    setReviews([newRev, ...reviews]);
    setCommentText('');
    setShowForm(false);
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
            ⭐ {isVi ? 'Đánh Giá & Nhận Xét Từ Người Mua' : 'Buyer Ratings & Reviews'}
          </h4>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            <strong style={{ color: '#fbbf24', fontSize: '14px' }}>{avgRating} / 5</strong> ({reviews.length} {isVi ? 'lượt đánh giá' : 'reviews'})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fef08a',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {showForm ? (isVi ? 'Đóng' : 'Close') : (isVi ? '✍️ Viết đánh giá' : '✍️ Write Review')}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(14, 19, 31, 0.9)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{isVi ? 'Chọn số sao:' : 'Select rating:'}</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: star <= rating ? '#fbbf24' : '#475569',
                  padding: '2px',
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            rows="3"
            required
            placeholder={isVi ? 'Chia sẻ trải nghiệm của bạn về chất lượng máy, đóng gói và phục vụ...' : 'Share your experience about the item quality and seller...'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(7, 9, 14, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '10px',
              color: '#ffffff',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
              marginBottom: '10px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '8px',
                color: '#0a0a0c',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isVi ? 'Gửi đánh giá' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#ffffff' }}>{r.userName}</strong>
                <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                  ✓ {isVi ? 'Đã mua hàng' : 'Verified Purchase'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{r.date}</span>
            </div>
            <div style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '4px' }}>
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.45' }}>
              {r.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
