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
          <span>🛡️ SÀN THƯƠNG MẠI ĐIỆN TỬ &amp; KÝ QUỸ ESCROW</span>
          <span className="mfb-badge-tag">PHÍ SÀN 2.5%</span>
        </div>

        <h2 className="mfb-title">
          Chợ Thiết Bị Điện Tử &amp; Sàn Trung Gian <span>GitXplore</span>
        </h2>

        <p className="mfb-desc">
          Mô hình kết nối 3 bên chuẩn Shopee / Lazada: Mua bán <strong>TOÀN BỘ mọi thiết bị điện tử</strong> (từ
          điện thoại, máy tính, vi mạch bán dẫn, smarthome, đồ âm thanh, TV đến máy ảnh, flycam &amp; công cụ AI).
          Tiền giữ an toàn tại Két Sắt Escrow, kiểm tra 48h trước khi giải ngân!
        </p>

        {/* Category tags */}
        <div className="mfb-categories" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => navigate('/market?cat=phones-tablets')}>
            📱 Điện thoại &amp; Tablet
          </button>
          <button type="button" onClick={() => navigate('/market?cat=computers-laptops')}>
            💻 Laptop &amp; PC Gaming
          </button>
          <button type="button" onClick={() => navigate('/market?cat=components-circuits')}>
            🔌 Vi mạch &amp; Bán dẫn
          </button>
          <button type="button" onClick={() => navigate('/market?cat=smart-home')}>
            🏠 Smarthome &amp; IoT
          </button>
          <button type="button" onClick={() => navigate('/market?cat=audio-music')}>
            🎧 Âm thanh &amp; Nhạc cụ
          </button>
          <button type="button" onClick={() => navigate('/market?cat=cameras-drones')}>
            📷 Flycam &amp; Máy ảnh
          </button>
          <button type="button" onClick={() => navigate('/market?cat=ai-software')}>
            🤖 Bản quyền AI &amp; Code
          </button>
          <button type="button" onClick={() => navigate('/market?cat=diy-tools')}>
            🛠️ Máy hàn &amp; Thiết bị đo
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
            <span>Khám phá Sàn Điện Tử</span>
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
            <span>Đăng bán thiết bị (Phí 2.5%)</span>
          </button>
        </div>
      </div>

      {/* Cột phải: Mô phỏng Két sắt ký quỹ & Logistics */}
      <div className="mfb-right" onClick={(e) => e.stopPropagation()}>
        <div className="mfb-vault">
          <div className="mfb-vault-header">
            <span className="mfb-vault-title">
              <span>🔐</span>
              <span>Két Sắt Ký Quỹ &amp; Logistics GitXplore</span>
            </span>
            <span className="mp-vault-status" style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px', color: '#10b981', fontWeight: 800 }}>
              ● CHUẨN TMĐT
            </span>
          </div>

          <div className="mfb-vault-steps">
            <div className="mfb-step-item">
              <span className="mfb-step-num">1</span>
              <span>
                <strong>Khóa kho &amp; Ký quỹ:</strong> Người mua nạp cọc vào Két sắt, hệ thống tự động khóa hàng trong 15 phút.
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">2</span>
              <span>
                <strong>Vận chuyển đa kênh:</strong> Người bán giao hàng qua Hỏa tốc 2H, GHN, Viettel Post hoặc gửi mã số online.
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">3</span>
              <span>
                <strong>Đối soát &amp; Giải ngân:</strong> Khách kiểm tra 48h, sàn tự động trích <strong>2.5% phí dịch vụ</strong> và chuyển tiền cho shop.
              </span>
            </div>
          </div>

          <div className="mfb-vault-footer">
            <span>🛡️ Voucher Freeship Xtra • Bảo vệ 100%</span>
            <span className="mfb-vault-fee" style={{ color: '#38bdf8', fontWeight: 700 }}>Phí sàn: 2.5%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
