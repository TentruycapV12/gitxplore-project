import { useState, useEffect, useMemo, useRef } from 'react';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import {
  MARKET_CATEGORIES,
  PRODUCT_CONDITIONS,
  INITIAL_MARKET_PRODUCTS,
} from '../data/marketplaceData.js';
import './MarketplacePage.css';

const STORAGE_PRODUCTS_KEY = 'gx_marketplace_products_v1';
const STORAGE_ORDERS_KEY = 'gx_marketplace_orders_v1';

// Format tiền tệ Việt Nam
const formatVND = (num) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { openModal } = useUI();

  // Load sản phẩm từ localStorage hoặc dữ liệu mẫu
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MARKET_PRODUCTS;
  });

  // Lưu sản phẩm vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  // Danh sách đơn hàng ký quỹ
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  // Bộ lọc
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedCond, setSelectedCond] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc'
  const [showGuide, setShowGuide] = useState(true);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null); // Chi tiết sản phẩm
  const [checkoutProduct, setCheckoutProduct] = useState(null); // Ký quỹ mua hàng
  const [showPostModal, setShowPostModal] = useState(false); // Đăng bán sản phẩm
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false); // Quản lý đơn hàng

  // Máy tính biểu phí tương tác
  const [calcAmount, setCalcAmount] = useState(2000000);
  const calcFee = Math.round(calcAmount * 0.025);
  const calcReceive = calcAmount - calcFee;

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCat !== 'all' && p.category !== selectedCat) return false;
      if (selectedCond !== 'all' && p.condition !== selectedCond) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchSeller = p.seller?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSeller) return false;
      }
      return true;
    }).sort((a, b) => {
      // Ưu tiên tin VIP đẩy top
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [products, selectedCat, selectedCond, searchQuery, sortBy]);

  // Xử lý tạo đơn hàng Escrow
  const handleCreateEscrowOrder = (orderData) => {
    const newOrder = {
      id: `GX-ESC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: 'escrow_holding', // 'escrow_holding' | 'shipping' | 'completed' | 'disputed'
      statusLabel: 'Tiền đang giữ an toàn tại Két Sắt Escrow',
      ...orderData,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCheckoutProduct(null);
    setSelectedProduct(null);
    setShowMyOrdersModal(true);
  };

  // Xử lý người mua bấm xác nhận hoàn tất & giải ngân
  const handleConfirmOrderReceived = (orderId) => {
    if (window.confirm('Bạn xác nhận đã nhận đúng sản phẩm và đồng ý giải ngân tiền cho người bán?')) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'completed', statusLabel: 'Giao dịch hoàn tất • Đã giải ngân' }
            : o
        )
      );
    }
  };

  // Xử lý đăng sản phẩm mới
  const handleAddNewProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    setShowPostModal(false);
  };

  return (
    <div className="mp-page">
      <TopNav />

      {/* ===== 1. HERO BANNER ===== */}
      <section className="mp-hero">
        <div className="mp-hero-badge">
          <span>🛡️</span>
          <span>Môi Trường Mua Bán Trung Gian An Toàn 100%</span>
        </div>

        <h1 className="mp-hero-title">
          CHỢ CÔNG NGHỆ, VI MẠCH &amp; <span>TÀI NGUYÊN SỐ</span>
        </h1>

        <p className="mp-hero-subtitle">
          Sàn giao dịch trung gian chuyên biệt cho Lập trình viên &amp; Kỹ sư: Mua bán máy tính, linh kiện điện tử,
          piano điện, tivi màn hình và key bản quyền AI với cơ chế <strong>Ký Quỹ Escrow Bảo Vệ Tuyệt Đối</strong>.
        </p>

        {/* Live Platform Highlights */}
        <div className="mp-stats-bar">
          <div className="mp-stat-card">
            <div className="mp-stat-icon">🛡️</div>
            <div className="mp-stat-info">
              <strong>Bảo Vệ Escrow 100%</strong>
              <span>Không sợ lừa đảo, nhận hàng mới giải ngân</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⚡</div>
            <div className="mp-stat-info">
              <strong>Phí Sàn Chỉ 2.5%</strong>
              <span>Biểu phí trung gian minh bạch, rẻ nhất thị trường</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⏱️</div>
            <div className="mp-stat-info">
              <strong>Hoàn Tiền Trong 48H</strong>
              <span>Đổi trả lập tức nếu hàng lỗi hoặc sai mô tả</span>
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="mp-hero-actions">
          <button
            type="button"
            className="mp-btn-primary"
            onClick={() => {
              if (!user) {
                openModal('signin');
              } else {
                setShowPostModal(true);
              }
            }}
          >
            <span>🛍️</span>
            <span>Đăng Bán Sản Phẩm Ngay</span>
          </button>
          <button
            type="button"
            className="mp-btn-secondary"
            onClick={() => setShowGuide((prev) => !prev)}
          >
            <span>📖</span>
            <span>{showGuide ? 'Ẩn Hướng Dẫn Trung Gian' : 'Xem Quy Trình Giao Dịch An Toàn'}</span>
          </button>
          <button
            type="button"
            className="mp-btn-secondary"
            onClick={() => setShowMyOrdersModal(true)}
          >
            <span>📋</span>
            <span>Quản Lý Đơn Hàng ({orders.length})</span>
          </button>
        </div>
      </section>

      {/* ===== 2. INTERACTIVE ESCROW GUIDE & FEE CALCULATOR ===== */}
      {showGuide && (
        <section className="mp-guide-section">
          <div className="mp-guide-box">
            <div className="mp-guide-header">
              <h3>
                <span>🛡️</span>
                <span>Quy Trình Mua Bán Trung Gian GitXplore Hoạt Động Thế Nào?</span>
              </h3>
              <span className="mp-guide-badge">Phí dịch vụ bảo hộ: 2.5%</span>
            </div>

            <div className="mp-steps-grid">
              <div className="mp-step-item">
                <div className="mp-step-num">1</div>
                <h4>Ký Quỹ Tạm Giữ (Escrow Deposit)</h4>
                <p>
                  Người mua bấm đặt hàng và chuyển tiền vào tài khoản Két sắt an toàn của GitXplore.
                  Người bán nhận thông báo <em>"Tiền đã được giữ an toàn, hãy gửi hàng đi"</em>.
                </p>
              </div>

              <div className="mp-step-item">
                <div className="mp-step-num">2</div>
                <h4>Giao Nhận &amp; Bàn Giao Thiết Bị</h4>
                <p>
                  Người bán chuyển phần cứng/linh kiện qua bưu điện hoặc bàn giao key bản quyền phần mềm qua email.
                  Mã vận đơn và bằng chứng giao dịch được lưu lại trên sàn.
                </p>
              </div>

              <div className="mp-step-item">
                <div className="mp-step-num">3</div>
                <h4>Kiểm Tra &amp; Giải Ngân</h4>
                <p>
                  Người mua nhận hàng và có <strong>48 giờ kiểm tra</strong>. Khi người mua bấm
                  <em> "Xác nhận hài lòng"</em>, sàn khấu trừ <strong>2.5% phí dịch vụ</strong> và giải ngân tiền cho người bán.
                </p>
              </div>
            </div>

            {/* Interactive Fee Calculator */}
            <div className="mp-calc-card">
              <div className="mp-calc-left">
                <h5>🧮 Máy Tính Phí Dịch Vụ Sàn Minh Bạch</h5>
                <p>Nhập thử giá trị món đồ bạn muốn mua hoặc đăng bán để xem phí trung gian chính xác:</p>
              </div>
              <div className="mp-calc-input-wrap">
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  className="mp-calc-input"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                />
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>VNĐ</span>
              </div>
              <div className="mp-calc-results">
                <div className="mp-calc-res-item">
                  <span>Phí sàn GitXplore (2.5%):</span>
                  <strong style={{ color: '#f59e0b' }}>{formatVND(calcFee)}</strong>
                </div>
                <div className="mp-calc-res-item">
                  <span>Người bán thực nhận:</span>
                  <strong>{formatVND(calcReceive)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. CONTROLS: SEARCH & CATEGORY PILLS ===== */}
      <section className="mp-controls">
        <div className="mp-search-row">
          <div className="mp-search-box">
            <span className="mp-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm máy tính, kit ESP32, card đồ họa, piano điện, tool AI, tivi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="mp-filter-select"
            value={selectedCond}
            onChange={(e) => setSelectedCond(e.target.value)}
          >
            <option value="all">Mọi tình trạng hàng</option>
            <option value="brand_new">Mới 100% (Fullbox)</option>
            <option value="like_new">Like New 99%</option>
            <option value="used">Đã qua sử dụng</option>
            <option value="digital_license">Key kích hoạt số</option>
          </select>

          <select
            className="mp-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Mới đăng nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="mp-cat-pills">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`mp-cat-pill ${selectedCat === cat.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== 4. PRODUCTS GRID ===== */}
      <main className="mp-grid-container">
        {filteredProducts.length === 0 ? (
          <div className="mp-empty-state">
            <div className="mp-empty-icon">📦</div>
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p>Hãy thử tìm bằng từ khóa khác hoặc bấm Đăng bán sản phẩm đầu tiên của bạn!</p>
            <button
              type="button"
              className="mp-btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSelectedCat('all');
                setSelectedCond('all');
                setSearchQuery('');
              }}
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="mp-products-grid">
            {filteredProducts.map((p) => {
              const condInfo = PRODUCT_CONDITIONS[p.condition] || { label: p.condition, color: '#94a3b8' };
              const estFee = Math.round(p.price * 0.025);

              return (
                <article key={p.id} className="mp-card">
                  <div className="mp-card-thumb-wrap" onClick={() => setSelectedProduct(p)}>
                    <img src={p.images[0]} alt={p.title} className="mp-card-img" loading="lazy" />
                    <div className="mp-card-badges">
                      <span className="mp-badge-cond" style={{ color: condInfo.color, borderColor: condInfo.color }}>
                        {condInfo.label}
                      </span>
                      {p.isFeatured && <span className="mp-badge-vip">⭐ Tin VIP</span>}
                    </div>
                    {p.escrowSupported && (
                      <span className="mp-badge-escrow">
                        <span>🛡️</span> Escrow Safe
                      </span>
                    )}
                  </div>

                  <div className="mp-card-body">
                    <span className="mp-card-cat">{p.categoryName}</span>
                    <h3 className="mp-card-title" onClick={() => setSelectedProduct(p)} title={p.title}>
                      {p.title}
                    </h3>

                    <div className="mp-card-price-row">
                      <span className="mp-card-price">{formatVND(p.price)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="mp-card-orig-price">{formatVND(p.originalPrice)}</span>
                      )}
                    </div>

                    <div className="mp-card-seller-row">
                      <img src={p.seller.avatar} alt={p.seller.name} className="mp-card-seller-avt" />
                      <span className="mp-card-seller-name" title={p.seller.name}>{p.seller.name}</span>
                      <span>⭐ {p.seller.rating}</span>
                    </div>

                    <div className="mp-card-footer">
                      <button
                        type="button"
                        className="mp-card-btn-buy"
                        onClick={() => setCheckoutProduct(p)}
                      >
                        <span>⚡</span>
                        <span>Mua Trung Gian</span>
                      </button>
                      <button
                        type="button"
                        className="mp-card-btn-view"
                        onClick={() => setSelectedProduct(p)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== 5. MODAL CHI TIẾT SẢN PHẨM ===== */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={(p) => {
            setSelectedProduct(null);
            setCheckoutProduct(p);
          }}
        />
      )}

      {/* ===== 6. MODAL CHECKOUT KÝ QUỸ ESCROW ===== */}
      {checkoutProduct && (
        <EscrowCheckoutModal
          product={checkoutProduct}
          user={user}
          onClose={() => setCheckoutProduct(null)}
          onSubmitOrder={handleCreateEscrowOrder}
          onOpenSignIn={() => openModal('signin')}
        />
      )}

      {/* ===== 7. MODAL ĐĂNG BÁN SẢN PHẨM ===== */}
      {showPostModal && (
        <PostListingModal
          user={user}
          onClose={() => setShowPostModal(false)}
          onPostSuccess={handleAddNewProduct}
        />
      )}

      {/* ===== 8. MODAL QUẢN LÝ ĐƠN HÀNG ESCROW ===== */}
      {showMyOrdersModal && (
        <MyOrdersModal
          orders={orders}
          onClose={() => setShowMyOrdersModal(false)}
          onConfirmReceived={handleConfirmOrderReceived}
        />
      )}

      <Footer />
    </div>
  );
}

// ==================== MODAL: CHI TIẾT SẢN PHẨM ====================
function ProductDetailModal({ product, onClose, onBuy }) {
  const [activeImg, setActiveImg] = useState(0);
  const condInfo = PRODUCT_CONDITIONS[product.condition] || { label: product.condition, color: '#10b981' };
  const serviceFee = Math.round(product.price * 0.025);

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <button className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="mp-modal-body" style={{ maxHeight: '82vh' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Gallery ảnh */}
            <div>
              <div style={{ width: '100%', height: '280px', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '10px' }}>
                <img
                  src={product.images[activeImg] || product.images[0]}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: activeImg === i ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                        padding: 0,
                        background: '#000',
                        cursor: 'pointer'
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin & Thanh toán */}
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="mp-badge-cond" style={{ color: condInfo.color, borderColor: condInfo.color }}>
                  {condInfo.label}
                </span>
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>
                  {product.categoryName}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px', color: '#fff', lineHeight: 1.3 }}>
                {product.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>
                  {formatVND(product.price)}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: '14px', color: '#64748b', textDecoration: 'line-through' }}>
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Box bảo hộ Escrow */}
              <div className="mp-fee-preview-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
                  <span>🛡️</span>
                  <span>Được bảo vệ bởi GitXplore Escrow</span>
                </div>
                <div>Phí dịch vụ trung gian bảo hộ: <strong>{formatVND(serviceFee)}</strong> (2.5%)</div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>
                  Tiền được giữ an toàn 100% trong két sắt trung gian. Người mua có 48h kiểm tra sản phẩm trước khi giải ngân.
                </div>
              </div>

              {/* Thông tin người bán */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 14px', margin: '16px 0', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <img src={product.seller.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13.5px', color: '#fff' }}>{product.seller.name}</strong>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>📍 {product.seller.location}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#cbd5e1' }}>
                  <span>⭐ Đánh giá: <strong>{product.seller.rating}/5.0</strong></span>
                  <span>📦 Đã giao dịch: <strong>{product.seller.completedOrders} đơn</strong></span>
                </div>
              </div>

              <button
                type="button"
                className="mp-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                onClick={() => onBuy(product)}
              >
                <span>⚡</span>
                <span>Đặt Mua Qua Trung Gian Escrow ({formatVND(product.price)})</span>
              </button>
            </div>
          </div>

          {/* Mô tả chi tiết & Thông số kỹ thuật */}
          <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fef08a', margin: '0 0 10px' }}>Mô Tả Sản Phẩm</h4>
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line', margin: '0 0 20px' }}>
              {product.description}
            </p>

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fef08a', margin: '0 0 10px' }}>Thông Số Kỹ Thuật</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block' }}>{key}</span>
                      <strong style={{ fontSize: '13px', color: '#fff' }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL: CHECKOUT KÝ QUỸ ESCROW ====================
function EscrowCheckoutModal({ product, user, onClose, onSubmitOrder, onOpenSignIn }) {
  const serviceFee = Math.round(product.price * 0.025);
  const totalAmount = product.price + serviceFee;

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [isPaidStep, setIsPaidStep] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng/email!');
      return;
    }

    onSubmitOrder({
      productTitle: product.title,
      productId: product.id,
      productImg: product.images[0],
      productPrice: product.price,
      serviceFee,
      totalAmount,
      buyerName: fullName,
      buyerPhone: phone,
      buyerAddress: address,
      buyerNote: note,
      sellerName: product.seller.name,
      sellerLocation: product.seller.location,
    });
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="mp-modal-header">
          <h3>
            <span>🛡️</span>
            <span>Đặt Mua Qua Trung Gian GitXplore Escrow</span>
          </h3>
          <p>Tiền của bạn được giữ an toàn trong két sắt trung gian cho đến khi bạn xác nhận nhận hàng.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mp-modal-body">
            {/* Tóm tắt chi phí minh bạch */}
            <div className="mp-checkout-breakdown">
              <div className="mp-breakdown-row">
                <span>Sản phẩm:</span>
                <strong style={{ color: '#fff' }}>{product.title}</strong>
              </div>
              <div className="mp-breakdown-row">
                <span>Giá bán niêm yết:</span>
                <span>{formatVND(product.price)}</span>
              </div>
              <div className="mp-breakdown-row">
                <span>Phí bảo hộ trung gian GitXplore (2.5%):</span>
                <span style={{ color: '#f59e0b' }}>+{formatVND(serviceFee)}</span>
              </div>
              <div className="mp-breakdown-row is-total">
                <span>Tổng nạp Ký Quỹ Escrow:</span>
                <span>{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Thông tin người mua */}
            <div className="mp-form-group">
              <label>Họ và tên người nhận *</label>
              <input
                type="text"
                className="mp-form-input"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="mp-form-group">
              <label>Số điện thoại liên hệ *</label>
              <input
                type="tel"
                className="mp-form-input"
                placeholder="Ví dụ: 0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="mp-form-group">
              <label>Địa chỉ nhận hàng (hoặc Email đối với key bản quyền số) *</label>
              <input
                type="text"
                className="mp-form-input"
                placeholder="Số nhà, đường, phường, quận/huyện, tỉnh/thành hoặc Email"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="mp-form-group">
              <label>Ghi chú cho sàn &amp; người bán (tùy chọn)</label>
              <textarea
                className="mp-form-textarea"
                rows="2"
                placeholder="Ví dụ: Giao giờ hành chính, đóng gói bọc xốp cẩn thận..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Tài khoản ký quỹ trung gian */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏦</span>
                <span>Thông Tin Chuyển Khoản Ký Quỹ Trung Gian GitXplore:</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                <div>• Ngân hàng: <strong>MB Bank (Ngân Hàng Quân Đội)</strong></div>
                <div>• Số tài khoản Escrow: <strong style={{ color: '#fef08a' }}>9999GITXPLORE</strong></div>
                <div>• Chủ tài khoản: <strong>GITXPLORE ESCROW SECURE VAULT</strong></div>
                <div>• Số tiền ký quỹ: <strong style={{ color: '#10b981' }}>{formatVND(totalAmount)}</strong></div>
                <div>• Nội dung chuyển khoản: <strong style={{ color: '#f59e0b' }}>GX-ESCROW-{Math.floor(1000 + Math.random() * 9000)}</strong></div>
              </div>
            </div>
          </div>

          <div className="mp-modal-footer">
            <button type="button" className="mp-btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="mp-btn-primary">
              <span>✅</span>
              <span>Xác Nhận Đặt Ký Quỹ Escrow</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MODAL: ĐĂNG BÁN SẢN PHẨM ====================
function PostListingModal({ user, onClose, onPostSuccess }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('components');
  const [condition, setCondition] = useState('like_new');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [location, setLocation] = useState('Hà Nội');

  // Preview phí
  const numPrice = Number(price) || 0;
  const serviceFee = Math.round(numPrice * 0.025);
  const receiveAmount = numPrice - serviceFee;

  // Xử lý upload ảnh từ máy
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !numPrice || !description.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề, giá bán và mô tả sản phẩm!');
      return;
    }

    // Parse specs dòng dạng "RAM: 16GB"
    const parsedSpecs = {};
    if (specsText.trim()) {
      specsText.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          parsedSpecs[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      });
    }

    const catObj = MARKET_CATEGORIES.find((c) => c.id === category) || {};

    const newProduct = {
      id: `prod-user-${Date.now()}`,
      title: title.trim(),
      category,
      categoryName: catObj.label || 'Khác',
      price: numPrice,
      originalPrice: Number(originalPrice) || null,
      condition,
      seller: {
        id: user?.id || 'me',
        name: user?.name || user?.identifier || 'Kỹ sư GitXplore',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5.0,
        completedOrders: 1,
        verified: true,
        location,
      },
      images: [
        imageUrl.trim() || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      ],
      description: description.trim(),
      specs: parsedSpecs,
      escrowSupported: true,
      serviceFeePercent: 2.5,
      isFeatured,
      createdAt: new Date().toISOString(),
      status: 'available',
    };

    onPostSuccess(newProduct);
    alert('Đăng bán sản phẩm thành công! Sản phẩm của bạn đã xuất hiện trên sàn.');
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="mp-modal-header">
          <h3>
            <span>🛍️</span>
            <span>Đăng Bán Sản Phẩm Trên Chợ Công Nghệ GitXplore</span>
          </h3>
          <p>Môi trường trung gian kết nối người mua và người bán, bảo vệ giao dịch không rủi ro.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mp-modal-body">
            <div className="mp-form-group">
              <label>Tên sản phẩm / Thiết bị *</label>
              <input
                type="text"
                className="mp-form-input"
                placeholder="Ví dụ: Laptop ThinkPad X1 Carbon Gen 10 / Kit Arduino Mega..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="mp-form-group">
                <label>Danh mục *</label>
                <select className="mp-form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {MARKET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-form-group">
                <label>Tình trạng hàng *</label>
                <select className="mp-form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="brand_new">Mới 100% (Fullbox)</option>
                  <option value="like_new">Like New 99%</option>
                  <option value="used">Đã qua sử dụng (90-95%)</option>
                  <option value="digital_license">Key kích hoạt số (Bản quyền)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="mp-form-group">
                <label>Giá bán mong muốn (VNĐ) *</label>
                <input
                  type="number"
                  step="10000"
                  className="mp-form-input"
                  placeholder="Ví dụ: 1500000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="mp-form-group">
                <label>Giá gốc tham khảo (tùy chọn)</label>
                <input
                  type="number"
                  step="10000"
                  className="mp-form-input"
                  placeholder="Ví dụ: 2000000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Tính phí sàn minh bạch */}
            {numPrice > 0 && (
              <div className="mp-fee-preview-box">
                <div>• Giá bạn bán: <strong>{formatVND(numPrice)}</strong></div>
                <div>• Phí dịch vụ sàn trung gian GitXplore (2.5%): <strong>{formatVND(serviceFee)}</strong></div>
                <div>• Số tiền bạn thực nhận khi hoàn tất đơn: <strong style={{ color: '#10b981' }}>{formatVND(receiveAmount)}</strong></div>
              </div>
            )}

            <div className="mp-form-group" style={{ marginTop: '14px' }}>
              <label>Hình ảnh sản phẩm (Tải file từ máy hoặc nhập URL)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="mp-form-input"
                  placeholder="Dán link ảnh trực tuyến..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <label
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    whiteSpace: 'nowrap',
                    color: '#fef08a'
                  }}
                >
                  📁 Chọn file ảnh
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
              {imageUrl && (
                <div style={{ marginTop: '8px', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f59e0b' }}>
                  <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className="mp-form-group">
              <label>Mô tả chi tiết sản phẩm *</label>
              <textarea
                className="mp-form-textarea"
                rows="3"
                placeholder="Mô tả nguồn gốc, tình trạng sử dụng, phụ kiện đi kèm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="mp-form-group">
              <label>Thông số kỹ thuật (Mỗi thông số 1 dòng dạng: Chip: i7, RAM: 16GB)</label>
              <textarea
                className="mp-form-textarea"
                rows="2"
                placeholder="RAM: 16GB&#10;Bảo hành: 6 tháng..."
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="mp-form-group">
                <label>Khu vực giao dịch</label>
                <input
                  type="text"
                  className="mp-form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hà Nội / TP.HCM / Toàn quốc..."
                />
              </div>

              <div className="mp-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <input
                  type="checkbox"
                  id="vip-check"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
                />
                <label htmlFor="vip-check" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>
                  ⭐ Đẩy bài lên Tin VIP Nổi Bật (Phí 15.000đ)
                </label>
              </div>
            </div>
          </div>

          <div className="mp-modal-footer">
            <button type="button" className="mp-btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="mp-btn-primary">
              <span>🚀</span>
              <span>Đăng Bán Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MODAL: QUẢN LÝ ĐƠN HÀNG ESCROW ====================
function MyOrdersModal({ orders, onClose, onConfirmReceived }) {
  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <button className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="mp-modal-header">
          <h3>
            <span>📋</span>
            <span>Đơn Hàng &amp; Giao Dịch Trung Gian Của Bạn</span>
          </h3>
          <p>Theo dõi quá trình Ký Quỹ Escrow và bấm giải ngân khi bạn đã nhận đủ hàng.</p>
        </div>

        <div className="mp-modal-body" style={{ maxHeight: '70vh' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
              <p>Bạn chưa có giao dịch ký quỹ nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const isHolding = order.status === 'escrow_holding';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef08a' }}>
                        Mã đơn: {order.id}
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isCompleted ? '#6ee7b7' : '#fef08a',
                          border: isCompleted ? '1px solid #10b981' : '1px solid #f59e0b',
                        }}
                      >
                        {order.statusLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {order.productImg && (
                        <img
                          src={order.productImg}
                          alt=""
                          style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#fff' }}>
                          {order.productTitle}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Người bán: <strong>{order.sellerName}</strong> ({order.sellerLocation})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                          {formatVND(order.totalAmount)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Đã gồm {formatVND(order.serviceFee)} phí sàn
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Giao đến: {order.buyerAddress}</span>
                      {isHolding && (
                        <button
                          type="button"
                          className="mp-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => onConfirmReceived(order.id)}
                        >
                          <span>✓</span>
                          <span>Đã Nhận Hàng • Giải Ngân</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
