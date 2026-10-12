import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getMarketplaceText } from '../data/marketplaceTranslations';
import './MarketplaceFeaturedBanner.css';

export default function MarketplaceFeaturedBanner() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const isVi = lang === 'vi';

  return (
    <section className="mfb-banner" onClick={() => navigate('/market')}>
      <div className="mfb-glow" />

      {/* Cột trái: Thông điệp & Phân loại */}
      <div className="mfb-left">
        <div className="mfb-badge">
          <span>{isVi ? '🛡️ SÀN THƯƠNG MẠI ĐIỆN TỬ & KÝ QUỸ ESCROW' : '🛡️ ELECTRONICS & ESCROW MARKETPLACE'}</span>
          <span className="mfb-badge-tag">{isVi ? 'PHÍ SÀN 2.5%' : 'FEE 2.5%'}</span>
        </div>

        <h2 className="mfb-title">
          {isVi ? (
            <>Chợ Thiết Bị Điện Tử &amp; Sàn Trung Gian <span>GitXplore</span></>
          ) : (
            <>All-Electronics &amp; Escrow Marketplace <span>GitXplore</span></>
          )}
        </h2>

        <p className="mfb-desc">
          {isVi
            ? 'Mô hình kết nối 3 bên chuẩn Shopee / Lazada: Mua bán TOÀN BỘ mọi thiết bị điện tử (điện thoại, máy tính, vi mạch, smarthome, âm thanh, TV, máy ảnh, flycam & key AI). Tiền giữ tại Két Sắt Escrow, kiểm tra 48h trước khi giải ngân!'
            : 'Shopee & Lazada 3-party e-commerce model: Trade ALL electronics (phones, PCs, circuits, smart home, audio, TVs, drones & AI tools). Funds held safely in Escrow Vault with 48h testing guarantee!'}
        </p>

        {/* Category tags */}
        <div className="mfb-categories" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => navigate('/market?cat=phones-tablets')}>
            📱 {getMarketplaceText(lang, 'cat_phones')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=computers-laptops')}>
            💻 {getMarketplaceText(lang, 'cat_computers')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=components-circuits')}>
            🔌 {getMarketplaceText(lang, 'cat_components')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=smart-home')}>
            🏠 {getMarketplaceText(lang, 'cat_smarthome')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=audio-music')}>
            🎧 {getMarketplaceText(lang, 'cat_audio')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=cameras-drones')}>
            📷 {getMarketplaceText(lang, 'cat_cameras')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=ai-software')}>
            🤖 {getMarketplaceText(lang, 'cat_ai')}
          </button>
          <button type="button" onClick={() => navigate('/market?cat=diy-tools')}>
            🛠️ {getMarketplaceText(lang, 'cat_tools')}
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
            <span>{isVi ? 'Khám phá Sàn Điện Tử' : 'Explore Marketplace'}</span>
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
            <span>{isVi ? 'Đăng bán thiết bị (Phí 2.5%)' : 'List Item (2.5% Fee)'}</span>
          </button>
        </div>
      </div>

      {/* Cột phải: Mô phỏng Két sắt ký quỹ & Logistics */}
      <div className="mfb-right" onClick={(e) => e.stopPropagation()}>
        <div className="mfb-vault">
          <div className="mfb-vault-header">
            <span className="mfb-vault-title">
              <span>🔐</span>
              <span>{isVi ? 'Két Sắt Ký Quỹ & Logistics GitXplore' : 'GitXplore Escrow & Logistics'}</span>
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px', color: '#10b981', fontWeight: 800 }}>
              ● {isVi ? 'CHUẨN TMĐT' : 'E-COMMERCE'}
            </span>
          </div>

          <div className="mfb-vault-steps">
            <div className="mfb-step-item">
              <span className="mfb-step-num">1</span>
              <span>
                <strong>{isVi ? 'Khóa kho & Ký quỹ:' : 'Inventory Lock & Escrow:'}</strong>{' '}
                {isVi ? 'Tiền nạp cọc vào Két sắt, hệ thống tự động khóa hàng trong 15 phút.' : 'Funds locked in escrow vault; inventory reserved for 15 minutes.'}
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">2</span>
              <span>
                <strong>{isVi ? 'Vận chuyển đa kênh:' : 'Multi-Channel Logistics:'}</strong>{' '}
                {isVi ? 'Giao qua Hỏa tốc 2H, GHN, Viettel Post hoặc kích hoạt số tức thì.' : 'Dispatched via 2H express, courier or instant digital license key.'}
              </span>
            </div>
            <div className="mfb-step-item">
              <span className="mfb-step-num">3</span>
              <span>
                <strong>{isVi ? 'Đối soát & Giải ngân:' : 'Settlement & Payout:'}</strong>{' '}
                {isVi ? 'Khách test 48h, sàn tự trừ 2.5% phí + 1.5% thuế và giải ngân ví.' : 'Buyer inspects 48h; platform deducts 2.5% fee + 1.5% tax and releases funds.'}
              </span>
            </div>
          </div>

          <div className="mfb-vault-footer">
            <span>🛡️ {isVi ? 'Voucher Freeship Xtra • Bảo vệ 100%' : 'Freeship Xtra • 100% Protection'}</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{isVi ? 'Phí sàn: 2.5%' : 'Fee: 2.5%'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
