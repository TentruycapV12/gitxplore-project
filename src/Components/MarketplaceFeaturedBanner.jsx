import { useNavigate } from 'react-router-dom';
import './MarketplaceFeaturedBanner.css';

export default function MarketplaceFeaturedBanner() {
  const navigate = useNavigate();

  return (
    <section className="mfb-banner" onClick={() => navigate('/market')}>
      <div className="mfb-glow" />

      {/* Cột trái: Thông điệp & Phân loại */}
      <div className="mfb-left">
        <div className="mfb-badge">
          <span>🛡️ SÀN TRUNG GIAN ESCROW</span>
          <span className="mfb-badge-tag">PHÍ SÀN 2.5%</span>
        </div>

        <h2 className="mfb-title">
          Chợ Công Nghệ & Sàn Trung Gian <span>GitXplore</span>
        </h2>

        <p className="mfb-desc">
          Môi trường kết nối kỹ sư mua bán thiết bị điện tử, vi mạch IoT, PC/Laptop,
          piano điện và các công cụ AI Coding (Cursor Pro, Windsurf). Tiền được giữ
          an toàn trong két sắt ký quỹ, bao kiểm tra 48h!
        </p>

        {/* Category tags */}
        <div className="mfb-categories" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => navigate('/market?cat=components')}>
            🔌 Vi mạch & Linh kiện IoT
          </button>
          <button type="button" onClick={() => navigate('/market?cat=computers')}>
            💻 PC, Laptop & Card màn hình
          </button>
          <button type="button" onClick={() => navigate('/market?cat=ai-tools')}>
            🤖 Bản quyền AI (Cursor, Claude)
          </button>
          <button type="button" onClick={() => navigate('/market?cat=instruments')}>
            🎹 Piano điện & Audio Gear
          </button>
          <button type="button" onClick={() => navigate('/market?cat=displays')}>
            📺 Tivi & Màn hình 4K
          </button>
        </div>

        {/* CTA buttons */}
        <div className="mfb-cta-row">
          <button
            type="button"
            className="mfb-cta-btn mfb-cta-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/market');
            }}
          >
            <span>Khám phá Chợ ngay</span>
            <span>➔</span>
          </button>
          <button
            type="button"
            className="mfb-cta-btn mfb-cta-secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/market?post=true');
            }}
          >
            <span>Đăng bán sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Cột phải: Mô phỏng Két sắt ký quỹ */}
      <div className="mfb-right" onClick={(e) => e.stopPropagation()}>
        <div className="mfb-vault">
          <div className="mfb-vault-header">
            <span className="mfb-vault-title">
              <span>🔐</span>
              <span>Két Sắt Ký Quỹ GitXplore</span>
            </span>
            <span className="mfb-vault-status">
              <span style={{ fontSize: '8px' }}>●</span>
              <span>BẢO VỆ 100%</span>
            </span>
          </div>

          <div className="mfb-vault-steps">
            <div className="mfb-step-item">
              <span className="mfb-step-num">1</span>
              <span>
                <strong>Người mua nạp cọc:</strong> Tiền được giữ an toàn tại két sắt sàn, người bán chuẩn bị hàng.
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">2</span>
              <span>
                <strong>Giao hàng & Test 48h:</strong> Người mua nhận hàng / key AI, kiểm tra đúng mô tả.
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">3</span>
              <span>
                <strong>Giải ngân minh bạch:</strong> Sàn chuyển tiền cho người bán sau khi trừ <strong>2.5% phí dịch vụ</strong>.
              </span>
            </div>
          </div>

          <div className="mfb-vault-footer">
            <span>🛡️ Hoàn tiền 100% nếu có tranh chấp</span>
            <span className="mfb-vault-fee">Phí chỉ 2.5%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
