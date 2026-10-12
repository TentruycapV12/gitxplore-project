import { useState, useEffect, useMemo, useRef } from 'react';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import {
  MARKET_CATEGORIES,
  PRODUCT_CONDITIONS,
  SHIPPING_CARRIERS,
  PLATFORM_VOUCHERS,
  INITIAL_MARKET_PRODUCTS,
} from '../data/marketplaceData.js';
import './MarketplacePage.css';

const STORAGE_PRODUCTS_KEY = 'gx_marketplace_products_v2';
const STORAGE_ORDERS_KEY = 'gx_marketplace_orders_v2';
const STORAGE_VOUCHERS_KEY = 'gx_marketplace_saved_vouchers_v2';

// Format tiền tệ Việt Nam
const formatVND = (num) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { openModal } = useUI();

  // 1. Quản lý danh sách sản phẩm
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MARKET_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  // 2. Quản lý danh sách đơn hàng ký quỹ
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

  // 3. Quản lý Voucher đã lưu
  const [savedVoucherCodes, setSavedVoucherCodes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VOUCHERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['FREESHIP', 'TECH50K'];
  });

  const toggleSaveVoucher = (code) => {
    setSavedVoucherCodes((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      try {
        localStorage.setItem(STORAGE_VOUCHERS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 4. Đồng hồ đếm ngược Flash Sale (Mô hình Shopee)
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: 4, minutes: 27, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 5. Bộ lọc & Tìm kiếm
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedCond, setSelectedCond] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'popular'
  const [showGuide, setShowGuide] = useState(true);

  // 6. Modals & Dialogs
  const [selectedProduct, setSelectedProduct] = useState(null); // Chi tiết sản phẩm
  const [checkoutProduct, setCheckoutProduct] = useState(null); // Đặt mua & Ký quỹ
  const [showPostModal, setShowPostModal] = useState(false); // Đăng bán sản phẩm
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false); // Quản lý đơn hàng & Ví sàn
  const [ordersModalTab, setOrdersModalTab] = useState('buyer'); // 'buyer' | 'seller'

  // Kiểm tra query parameter mở form đăng bán
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('post') === 'true') {
      setShowPostModal(true);
    }
  }, []);

  // 7. Máy tính biểu phí tương tác (Live Fee Calculator)
  const [calcAmount, setCalcAmount] = useState(2500000);
  const calcFee = Math.round(calcAmount * 0.025);
  const calcReceive = calcAmount - calcFee;

  // 8. Lọc và sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCat !== 'all' && p.category !== selectedCat) return false;
        if (selectedCond !== 'all' && p.condition !== selectedCond) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchSeller = p.seller?.name?.toLowerCase().includes(q);
          const matchCat = p.categoryName?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchSeller && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Ưu tiên tin VIP đẩy top
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'popular') return (b.soldCount || 0) - (a.soldCount || 0);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [products, selectedCat, selectedCond, searchQuery, sortBy]);

  // Flash Sale products
  const flashSaleProducts = useMemo(() => {
    return products.filter((p) => p.isFlashSale);
  }, [products]);

  // 9. Xử lý tạo đơn hàng Escrow
  const handleCreateEscrowOrder = (orderData) => {
    const newOrder = {
      id: `GX-ESC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: 'holding_escrow', // 'holding_escrow' | 'shipping' | 'inspection_48h' | 'completed' | 'disputed'
      statusLabel: 'Tiền đang giữ an toàn tại Két Sắt Escrow (Chờ người bán giao hàng)',
      buyerName: user?.username || 'Khách Hàng GitXplore',
      ...orderData,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCheckoutProduct(null);
    setSelectedProduct(null);
    setOrdersModalTab('buyer');
    setShowMyOrdersModal(true);
  };

  // 10. Xử lý người mua bấm xác nhận hoàn tất & giải ngân
  const handleConfirmOrderReceived = (orderId) => {
    if (window.confirm('Bạn xác nhận đã nhận đúng sản phẩm, kiểm tra hoàn tất và đồng ý giải ngân tiền cho Người Bán?')) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'completed', statusLabel: 'Đã hoàn tất • Đã giải ngân cho Người bán' }
            : o
        )
      );
    }
  };

  // 11. Xử lý thêm sản phẩm mới
  const handleAddNewProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    setShowPostModal(false);
  };

  // Thống kê ví người bán
  const sellerRevenue = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalGross = completedOrders.reduce((sum, o) => sum + (o.productPrice || 0), 0);
    const totalFee = Math.round(totalGross * 0.025);
    const netRevenue = totalGross - totalFee;
    return { totalGross, totalFee, netRevenue, orderCount: completedOrders.length };
  }, [orders]);

  return (
    <div className="mp-page">
      <TopNav />

      {/* ===== 1. HERO SECTION ===== */}
      <section className="mp-hero">
        <div className="mp-hero-badge">
          <span>🛡️</span>
          <span>SÀN THƯƠNG MẠI ĐIỆN TỬ THIẾT BỊ ĐIỆN TỬ &amp; KÝ QUỸ TRUNG GIAN</span>
        </div>

        <h1 className="mp-hero-title">
          CHỢ THIẾT BỊ ĐIỆN TỬ, CÔNG NGHỆ &amp; <span>KÉT SẮT TRUNG GIAN</span>
        </h1>

        <p className="mp-hero-subtitle">
          Mô hình kết nối 3 bên chuẩn Shopee / Lazada: Mua bán <strong>mọi thiết bị điện tử</strong> (từ điện thoại,
          PC, vi mạch bán dẫn, smarthome, đồ âm thanh, TV đến tài nguyên số &amp; key AI) với cơ chế{' '}
          <strong>Ký Quỹ Escrow Bảo Vệ 100%</strong> và biểu phí sàn minh bạch chỉ 2.5%!
        </p>

        {/* Live Platform Highlights */}
        <div className="mp-stats-bar">
          <div className="mp-stat-card">
            <div className="mp-stat-icon">🛡️</div>
            <div className="mp-stat-info">
              <strong>Bảo Vệ Escrow 100%</strong>
              <span>Tiền giữ tại két sàn, nhận hàng mới giải ngân</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⚡</div>
            <div className="mp-stat-info">
              <strong>Phí Sàn Chỉ 2.5%</strong>
              <span>Thu phí trung gian khi giao dịch thành công</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⏱️</div>
            <div className="mp-stat-info">
              <strong>Dùng Thử &amp; Test 48H</strong>
              <span>Đổi trả / Hoàn tiền nếu hàng lỗi hoặc sai mô tả</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">🚚</div>
            <div className="mp-stat-info">
              <strong>Vận Chuyển Đa Kênh</strong>
              <span>Hỏa tốc 2H, GHN, Viettel Post, Bàn giao Online</span>
            </div>
          </div>
        </div>

        {/* Hero Actions */}
        <div className="mp-hero-actions">
          <button
            type="button"
            className="mp-btn-post"
            onClick={() => {
              if (!user) {
                openModal('signin');
              } else {
                setShowPostModal(true);
              }
            }}
          >
            <span>➕ Đăng Bán Sản Phẩm Điện Tử</span>
          </button>

          <button
            type="button"
            className="mp-btn-orders"
            onClick={() => setShowMyOrdersModal(true)}
          >
            <span>📦 Két Sắt &amp; Đơn Hàng ({orders.length})</span>
          </button>

          <button
            type="button"
            className="mp-btn-guide-toggle"
            onClick={() => setShowGuide((prev) => !prev)}
          >
            {showGuide ? 'Ẩn Hướng Dẫn & Máy Tính Phí ▲' : 'Xem Quy Trình Vận Hành & Biểu Phí ▼'}
          </button>
        </div>
      </section>

      {/* ===== 2. ESCROW GUIDE & LIVE FEE CALCULATOR ===== */}
      {showGuide && (
        <section className="mp-guide-section">
          <div className="mp-guide-box">
            {/* Cột trái: 3 bước vận hành TMĐT */}
            <div className="mp-guide-steps">
              <div className="mp-guide-step">
                <span className="mp-step-badge">1</span>
                <div className="mp-step-text">
                  <h4>Người Mua Đặt Hàng &amp; Nạp Cọc Ký Quỹ</h4>
                  <p>
                    Người mua chọn sản phẩm, áp Voucher Sàn và chuyển khoản vào Két Sắt GitXplore.
                    Hệ thống tạm khóa hàng (Inventory Locking) để đảm bảo không ai mua trùng.
                  </p>
                </div>
              </div>

              <div className="mp-guide-step">
                <span className="mp-step-badge">2</span>
                <div className="mp-step-text">
                  <h4>Người Bán Giao Hàng &amp; Người Mua Kiểm Tra 48H</h4>
                  <p>
                    Người bán bàn giao hàng cho đơn vị vận chuyển (AhaMove, GHN, Viettel Post) hoặc gửi mã key số.
                    Người mua có 48 giờ dùng thử, kiểm tra chất lượng thực tế.
                  </p>
                </div>
              </div>

              <div className="mp-guide-step">
                <span className="mp-step-badge">3</span>
                <div className="mp-step-text">
                  <h4>Giải Ngân Doanh Thu &amp; Khấu Trừ Phí Sàn 2.5%</h4>
                  <p>
                    Khi Người mua bấm Xác Nhận Hài Lòng (hoặc sau 48h không khiếu nại), Sàn tự động trích
                    <strong> 2.5% phí dịch vụ trung gian</strong> và chuyển toàn bộ số tiền còn lại vào Ví Người Bán.
                  </p>
                </div>
              </div>
            </div>

            {/* Cột phải: Máy tính biểu phí tương tác */}
            <div className="mp-calc-card">
              <h4 className="mp-calc-title">
                <span>🧮</span>
                <span>Máy Tính Biểu Phí Sàn (2.5%)</span>
              </h4>

              <div className="mp-calc-input-wrap">
                <label>Nhập giá trị món hàng (VND):</label>
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="mp-calc-results">
                <div className="mp-calc-row">
                  <span>Giá bán niêm yết:</span>
                  <strong>{formatVND(calcAmount)}</strong>
                </div>
                <div className="mp-calc-row">
                  <span>Phí trung gian Sàn thu (2.5%):</span>
                  <strong style={{ color: '#ef4444' }}>- {formatVND(calcFee)}</strong>
                </div>
                <div className="mp-calc-row is-receive">
                  <span>Người Bán thực nhận về ví:</span>
                  <strong>{formatVND(calcReceive)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. SHOPEE / LAZADA VOUCHER HUB ===== */}
      <section className="mp-vouchers-container">
        <div className="mp-vouchers-header">
          <div className="mp-vouchers-title">
            <span>🎟️</span>
            <span>Kho Voucher Giảm Giá Sàn GitXplore (Voucher Xtra)</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Đã lưu: <strong style={{ color: '#fef08a' }}>{savedVoucherCodes.length}</strong> voucher
          </span>
        </div>

        <div className="mp-vouchers-grid">
          {PLATFORM_VOUCHERS.map((v) => {
            const isSaved = savedVoucherCodes.includes(v.code);
            return (
              <div key={v.code} className="mp-voucher-card">
                <div className="mp-voucher-top">
                  <span className="mp-voucher-badge" style={{ background: v.color }}>
                    {v.tag}
                  </span>
                  <span className="mp-voucher-code">{v.code}</span>
                </div>
                <div>
                  <div className="mp-voucher-label">{v.label}</div>
                  <p className="mp-voucher-desc">{v.desc}</p>
                </div>
                <button
                  type="button"
                  className={`mp-voucher-btn ${isSaved ? 'is-saved' : ''}`}
                  onClick={() => toggleSaveVoucher(v.code)}
                >
                  {isSaved ? '✓ Đã Lưu' : '+ Lưu Mã'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 4. FLASH SALE SECTION ===== */}
      {flashSaleProducts.length > 0 && (
        <section className="mp-flash-section">
          <div className="mp-flash-banner">
            <div className="mp-flash-left">
              <span className="mp-flash-badge">⚡ FLASH SALE GIỜ VÀNG</span>
              <div className="mp-flash-timer">
                <span>Kết thúc trong:</span>
                <span className="mp-timer-digit">{String(flashTimeLeft.hours).padStart(2, '0')}</span> :
                <span className="mp-timer-digit">{String(flashTimeLeft.minutes).padStart(2, '0')}</span> :
                <span className="mp-timer-digit">{String(flashTimeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
            <span style={{ fontSize: '13px', color: '#fef08a', fontWeight: 700 }}>
              Giảm tới 35% • Số lượng có hạn
            </span>
          </div>

          <div className="mp-products-grid">
            {flashSaleProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpenDetail={() => setSelectedProduct(p)}
                onBuyNow={() => setCheckoutProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== 5. ALL-ELECTRONICS CATEGORIES BAR ===== */}
      <section className="mp-categories-container">
        <div style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
          📂 Danh Mục Thiết Bị Điện Tử &amp; Công Nghệ:
        </div>
        <div className="mp-categories-bar">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`mp-cat-pill ${selectedCat === cat.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="mp-cat-count">{cat.count || 0}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== 6. TOOLBAR (SEARCH & FILTER) ===== */}
      <section className="mp-toolbar">
        <div className="mp-search-box">
          <span className="mp-search-icon">🔍</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm điện thoại, laptop, linh kiện, vi mạch, TV, piano, key AI..."
          />
        </div>

        <div className="mp-filter-controls">
          <select
            className="mp-select"
            value={selectedCond}
            onChange={(e) => setSelectedCond(e.target.value)}
          >
            <option value="all">Tất cả tình trạng</option>
            <option value="brand_new">Mới 100% (Fullbox)</option>
            <option value="like_new">Like New 99%</option>
            <option value="used">Đã qua sử dụng</option>
            <option value="digital_license">Key bản quyền số</option>
          </select>

          <select
            className="mp-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Mới đăng nhất</option>
            <option value="popular">Bán chạy nhất (Shopee/Lazada)</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
          </select>
        </div>
      </section>

      {/* ===== 7. PRODUCTS GRID ===== */}
      <section className="mp-products-section">
        {filteredProducts.length === 0 ? (
          <div className="mp-empty-state">
            <div className="mp-empty-icon">🔌</div>
            <h3>Không tìm thấy sản phẩm điện tử phù hợp</h3>
            <p>Hãy thử tìm từ khóa khác hoặc xóa bộ lọc danh mục.</p>
            <button
              type="button"
              className="mp-btn-post"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSelectedCat('all');
                setSelectedCond('all');
                setSearchQuery('');
              }}
            >
              Xem Tất Cả Sản Phẩm
            </button>
          </div>
        ) : (
          <div className="mp-products-grid">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpenDetail={() => setSelectedProduct(p)}
                onBuyNow={() => setCheckoutProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== 8. MODAL CHI TIẾT SẢN PHẨM ===== */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={() => {
            const p = selectedProduct;
            setSelectedProduct(null);
            setCheckoutProduct(p);
          }}
        />
      )}

      {/* ===== 9. MODAL ĐẶT HÀNG & THANH TOÁN KÝ QUỸ (CHECKOUT) ===== */}
      {checkoutProduct && (
        <CheckoutEscrowModal
          product={checkoutProduct}
          savedVouchers={PLATFORM_VOUCHERS.filter((v) => savedVoucherCodes.includes(v.code))}
          onClose={() => setCheckoutProduct(null)}
          onConfirmOrder={handleCreateEscrowOrder}
        />
      )}

      {/* ===== 10. MODAL ĐĂNG BÁN SẢN PHẨM MỚI ===== */}
      {showPostModal && (
        <PostProductModal
          onClose={() => setShowPostModal(false)}
          onAddProduct={handleAddNewProduct}
        />
      )}

      {/* ===== 11. DRAWER KÉT SẮT & ĐƠN HÀNG (MY ORDERS & SELLER WALLET) ===== */}
      {showMyOrdersModal && (
        <MyOrdersModal
          orders={orders}
          tab={ordersModalTab}
          setTab={setOrdersModalTab}
          sellerRevenue={sellerRevenue}
          onClose={() => setShowMyOrdersModal(false)}
          onConfirmReceived={handleConfirmOrderReceived}
        />
      )}

      <Footer />
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: PRODUCT CARD
======================================================== */
function ProductCard({ product, onOpenDetail, onBuyNow }) {
  const cond = PRODUCT_CONDITIONS[product.condition] || PRODUCT_CONDITIONS.brand_new;

  return (
    <div className={`mp-product-card ${product.isFeatured ? 'is-featured' : ''}`}>
      <div className="mp-card-thumb" onClick={onOpenDetail}>
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'} alt={product.title} />
        <span className="mp-badge-tag" style={{ color: cond.color }}>
          ● {cond.label}
        </span>
        {product.isFlashSale && <span className="mp-badge-flash">⚡ SALE</span>}
      </div>

      <div className="mp-card-body">
        <span className="mp-card-cat">{product.categoryName || 'Thiết Bị Điện Tử'}</span>
        <h3 className="mp-card-title" onClick={onOpenDetail} title={product.title}>
          {product.title}
        </h3>

        <div className="mp-price-row">
          <span className="mp-price-current">{formatVND(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="mp-price-old">{formatVND(product.originalPrice)}</span>
          )}
        </div>

        {/* Stock & Sold count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
          <span>Kho: <strong>{product.stock || 1}</strong> cái</span>
          <span>Đã bán: <strong>{product.soldCount || 0}</strong></span>
        </div>

        <div className="mp-card-seller">
          <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="mp-seller-avatar" />
          <span className="mp-seller-name">{product.seller?.name || 'Kỹ Sư GitXplore'}</span>
          <span className="mp-seller-rating">⭐ {product.seller?.rating || '5.0'}</span>
        </div>

        <div className="mp-card-actions">
          <button type="button" className="mp-btn-detail" onClick={onOpenDetail}>
            Chi Tiết
          </button>
          <button type="button" className="mp-btn-buy" onClick={onBuyNow}>
            Ký Quỹ Mua
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: PRODUCT DETAIL MODAL
======================================================== */
function ProductDetailModal({ product, onClose, onBuyNow }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const cond = PRODUCT_CONDITIONS[product.condition] || PRODUCT_CONDITIONS.brand_new;

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="mp-detail-layout">
          {/* Cột trái: Ảnh */}
          <div className="mp-detail-gallery">
            <img
              src={product.images?.[activeImgIndex] || product.images?.[0]}
              alt=""
              className="mp-main-img"
            />
            {product.images?.length > 1 && (
              <div className="mp-thumb-row">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="mp-thumb-mini"
                    style={{ borderColor: activeImgIndex === idx ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => setActiveImgIndex(idx)}
                  />
                ))}
              </div>
            )}

            {/* Độ uy tín người bán */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src={product.seller?.avatar} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#ffffff' }}>{product.seller?.name}</strong>
                  <small style={{ color: '#94a3b8' }}>📍 {product.seller?.location || 'Toàn quốc'}</small>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                <span>Đánh giá: <strong style={{ color: '#fbbf24' }}>⭐ {product.seller?.rating || '5.0'}</strong></span>
                <span>Đã bán thành công: <strong>{product.seller?.completedOrders || 10}+ đơn</strong></span>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông số & Mua */}
          <div className="mp-detail-info">
            <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
              {product.categoryName}
            </span>
            <h2>{product.title}</h2>

            <div className="mp-price-row">
              <span className="mp-price-current" style={{ fontSize: '24px' }}>
                {formatVND(product.price)}
              </span>
              {product.originalPrice && (
                <span className="mp-price-old">{formatVND(product.originalPrice)}</span>
              )}
              <span style={{ color: cond.color, fontSize: '12px', fontWeight: 700, marginLeft: 'auto' }}>
                ● {cond.label}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6', margin: '14px 0' }}>
              {product.description}
            </p>

            {/* Thông số kỹ thuật */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mp-specs-list">
                <strong style={{ fontSize: '12.5px', color: '#fef08a', marginBottom: '4px' }}>
                  ⚙️ Thông số kỹ thuật chi tiết:
                </strong>
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="mp-specs-item">
                    <span>{key}:</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cam kết sàn */}
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#34d399', margin: '16px 0' }}>
              🛡️ <strong>Chính sách Escrow 48H:</strong> Tiền cọc được giữ tại Két Sắt GitXplore. Bạn có 48 giờ kiểm tra thiết bị trước khi giải ngân cho người bán!
            </div>

            <button
              type="button"
              className="mp-btn-buy"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              onClick={onBuyNow}
            >
              Tiến Hành Ký Quỹ &amp; Đặt Hàng ({formatVND(product.price)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: CHECKOUT ESCROW MODAL
======================================================== */
function CheckoutEscrowModal({ product, savedVouchers, onClose, onConfirmOrder }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedCarrierId, setSelectedCarrierId] = useState(
    product.deliveryType === 'digital' ? 'instant_digital' : 'fast_ghn'
  );
  const [appliedVoucherCode, setAppliedVoucherCode] = useState(
    savedVouchers.length > 0 ? savedVouchers[0].code : ''
  );
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Đơn vị vận chuyển đang chọn
  const carrier = SHIPPING_CARRIERS.find((c) => c.id === selectedCarrierId) || SHIPPING_CARRIERS[1];
  const shippingFee = product.deliveryType === 'digital' ? 0 : carrier.fee;

  // Tính tiền
  const subtotal = product.price * quantity;

  // Áp dụng voucher
  const voucher = savedVouchers.find((v) => v.code === appliedVoucherCode);
  let discountAmount = 0;
  if (voucher && subtotal >= (voucher.minOrder || 0)) {
    if (voucher.discountType === 'fixed') {
      discountAmount = voucher.discountValue;
    } else if (voucher.discountType === 'percent') {
      discountAmount = Math.min(
        Math.round((subtotal * voucher.discountPercent) / 100),
        voucher.maxDiscount || 999999999
      );
    }
  }

  const totalEscrowDeposit = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (product.deliveryType !== 'digital' && (!address.trim() || !phone.trim())) {
      alert('Vui lòng nhập địa chỉ nhận hàng và số điện thoại liên hệ!');
      return;
    }

    onConfirmOrder({
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      quantity,
      subtotal,
      shippingCarrier: carrier.name,
      shippingFee,
      appliedVoucher: voucher?.code || null,
      discountAmount,
      totalAmount: totalEscrowDeposit,
      shippingAddress: address || 'Bàn giao trực tuyến',
      phone: phone || 'N/A',
      note,
      sellerName: product.seller?.name,
    });
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
          🛒 Đặt Hàng &amp; Ký Quỹ Trung Gian (Escrow Vault)
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px' }}>
          Mã bảo chứng giao dịch tự động • Giữ tiền an toàn cho đến khi bạn xác nhận hài lòng.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Thông tin món hàng */}
          <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
            <img src={product.images?.[0]} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff' }}>{product.title}</strong>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{formatVND(product.price)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Số lượng:</span>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 5}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  style={{ width: '60px', padding: '2px 8px', background: '#1c1424', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>

          {/* Chọn Đơn Vị Vận Chuyển */}
          {product.deliveryType !== 'digital' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a', display: 'block', marginBottom: '6px' }}>
                🚚 Chọn Đơn Vị Vận Chuyển:
              </label>
              <div className="mp-carrier-list">
                {SHIPPING_CARRIERS.filter((c) => c.id !== 'instant_digital').map((c) => (
                  <div
                    key={c.id}
                    className={`mp-carrier-card ${selectedCarrierId === c.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedCarrierId(c.id)}
                  >
                    <div className="mp-carrier-info">
                      <span style={{ fontSize: '18px' }}>{c.icon}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>{c.time}</small>
                      </div>
                    </div>
                    <span className="mp-carrier-fee">{formatVND(c.fee)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chọn Voucher Sàn */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a', display: 'block', marginBottom: '6px' }}>
              🎟️ Áp Dụng Voucher Sàn:
            </label>
            <select
              className="mp-select"
              style={{ width: '100%' }}
              value={appliedVoucherCode}
              onChange={(e) => setAppliedVoucherCode(e.target.value)}
            >
              <option value="">Không dùng mã</option>
              {savedVouchers.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.label} - [{v.code}] - (Đơn từ {formatVND(v.minOrder)})
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin giao hàng */}
          {product.deliveryType !== 'digital' && (
            <div className="mp-form-grid" style={{ marginBottom: '16px' }}>
              <div className="mp-form-group">
                <label>Số điện thoại người nhận (*):</label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="mp-form-group">
                <label>Địa chỉ giao hàng chi tiết (*):</label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Bảng kê hóa đơn ký quỹ */}
          <div style={{ background: '#0a0810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div className="mp-calc-row" style={{ marginBottom: '6px' }}>
              <span>Tiền hàng ({quantity} cái):</span>
              <strong>{formatVND(subtotal)}</strong>
            </div>
            <div className="mp-calc-row" style={{ marginBottom: '6px' }}>
              <span>Phí vận chuyển ({carrier.name}):</span>
              <strong>{formatVND(shippingFee)}</strong>
            </div>
            {discountAmount > 0 && (
              <div className="mp-calc-row" style={{ marginBottom: '6px', color: '#10b981' }}>
                <span>Voucher giảm giá ({voucher?.code}):</span>
                <strong>- {formatVND(discountAmount)}</strong>
              </div>
            )}
            <div className="mp-calc-row is-receive" style={{ fontSize: '17px', color: '#f59e0b', marginTop: '10px' }}>
              <span>Tổng tiền nạp Két Sắt Escrow:</span>
              <strong>{formatVND(totalEscrowDeposit)}</strong>
            </div>
          </div>

          {/* Mô phỏng mã VietQR */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#fef08a', fontWeight: 700, marginBottom: '6px' }}>
              🏦 Quét Mã VietQR Chuyển Khoản Ký Quỹ Tự Động
            </div>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=GITXPLORE-ESCROW-DEPOSIT-2026"
              alt="VietQR Escrow"
              style={{ width: '130px', height: '130px', borderRadius: '8px', border: '2px solid #fff', margin: '0 auto 8px' }}
            />
            <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
              Nội dung CK: <strong style={{ color: '#38bdf8' }}>GX-ESC-ORDER</strong> • Ngân hàng: <strong>MBBank (GitXplore Escrow Vault)</strong>
            </div>
          </div>

          <button
            type="submit"
            className="mp-btn-buy"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            Xác Nhận Nạp Ký Quỹ &amp; Tạo Đơn Hàng ({formatVND(totalEscrowDeposit)})
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: POST PRODUCT MODAL (ĐĂNG BÁN SẢN PHẨM)
======================================================== */
function PostProductModal({ onClose, onAddProduct }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('components-circuits');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState('brand_new');
  const [stock, setStock] = useState('1');
  const [deliveryType, setDeliveryType] = useState('physical');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [specCpu, setSpecCpu] = useState('');
  const [specRam, setSpecRam] = useState('');
  const [specWarranty, setSpecWarranty] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Tính phí sàn ước tính
  const numPrice = Number(price) || 0;
  const estimatedFee = Math.round(numPrice * 0.025);
  const estimatedReceive = numPrice - estimatedFee;

  // Xử lý upload ảnh từ máy tính (FileReader -> Base64)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result;
        if (base64) {
          setImageUrls((prev) => (prev ? `${prev}\n${base64}` : base64));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert('Vui lòng nhập tên sản phẩm và giá bán!');
      return;
    }

    const catObj = MARKET_CATEGORIES.find((c) => c.id === category);

    // Tách mảng ảnh
    const rawImgs = imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalImages = rawImgs.length > 0 ? rawImgs : ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'];

    // Specs
    const specs = {};
    if (specCpu) specs['Vi xử lý / Model'] = specCpu;
    if (specRam) specs['Bộ nhớ / RAM'] = specRam;
    if (specWarranty) specs['Bảo hành'] = specWarranty;

    const newProduct = {
      id: `prod-${Date.now()}`,
      title,
      category,
      categoryName: catObj?.label || 'Thiết Bị Điện Tử',
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : null,
      condition,
      stock: Number(stock) || 1,
      soldCount: 0,
      deliveryType,
      images: finalImages,
      description,
      specs,
      escrowSupported: true,
      serviceFeePercent: 2.5,
      isFeatured,
      createdAt: new Date().toISOString(),
      status: 'available',
      seller: {
        id: user?.identifier || 'seller-current',
        name: user?.username || 'Kỹ Sư GitXplore',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: 5.0,
        completedOrders: 1,
        verified: true,
        location: 'Việt Nam',
      },
    };

    onAddProduct(newProduct);
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
          📤 Đăng Bán Sản Phẩm Điện Tử (Phí Sàn 2.5%)
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px' }}>
          Đăng bán mọi thiết bị điện tử, vi mạch, PC, gia dụng, âm thanh hay công cụ AI lên toàn bộ sàn.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mp-form-grid">
            {/* Tên sản phẩm */}
            <div className="mp-form-group is-full">
              <label>Tên sản phẩm điện tử (*):</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: iPhone 15 Pro Max 256GB / Kit ESP32-S3 AI / Piano Yamaha P-125..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Danh mục */}
            <div className="mp-form-group">
              <label>Phân loại ngành hàng điện tử (*):</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {MARKET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tình trạng */}
            <div className="mp-form-group">
              <label>Tình trạng sản phẩm (*):</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="brand_new">Mới 100% (Fullbox)</option>
                <option value="like_new">Like New 99%</option>
                <option value="used">Đã qua sử dụng (90-95%)</option>
                <option value="digital_license">Key bản quyền số</option>
              </select>
            </div>

            {/* Giá bán */}
            <div className="mp-form-group">
              <label>Giá bán cho Người Mua (VND) (*):</label>
              <input
                type="number"
                required
                min="10000"
                step="10000"
                placeholder="Ví dụ: 1500000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Giá gốc */}
            <div className="mp-form-group">
              <label>Giá gốc niêm yết (nếu có giảm giá):</label>
              <input
                type="number"
                min="10000"
                step="10000"
                placeholder="Ví dụ: 2000000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>

            {/* Số lượng tồn kho */}
            <div className="mp-form-group">
              <label>Số lượng tồn kho:</label>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>

            {/* Hình thức giao hàng */}
            <div className="mp-form-group">
              <label>Hình thức giao nhận:</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                <option value="physical">Vận chuyển bưu phẩm vật lý (GHN / Viettel Post / Hỏa tốc)</option>
                <option value="digital">Giao trực tuyến qua email / mã kích hoạt số</option>
              </select>
            </div>

            {/* Upload Ảnh */}
            <div className="mp-form-group is-full">
              <label>Hình ảnh sản phẩm (Tải lên từ máy hoặc dán link):</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Chọn ảnh từ thiết bị
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
              <textarea
                rows="2"
                placeholder="Mỗi dòng 1 đường dẫn ảnh hoặc dữ liệu ảnh..."
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
              />
            </div>

            {/* Thông số kỹ thuật nhanh */}
            <div className="mp-form-group">
              <label>Vi xử lý / Model thiết bị:</label>
              <input
                type="text"
                placeholder="Ví dụ: Apple A17 Pro / ESP32-S3 / Core i7..."
                value={specCpu}
                onChange={(e) => setSpecCpu(e.target.value)}
              />
            </div>
            <div className="mp-form-group">
              <label>Bảo hành / Cam kết:</label>
              <input
                type="text"
                placeholder="Ví dụ: 12 tháng chính hãng / Bao test 7 ngày..."
                value={specWarranty}
                onChange={(e) => setSpecWarranty(e.target.value)}
              />
            </div>

            {/* Mô tả chi tiết */}
            <div className="mp-form-group is-full">
              <label>Mô tả chi tiết sản phẩm:</label>
              <textarea
                rows="4"
                placeholder="Mô tả công năng, phụ kiện đi kèm, tình trạng trầy xước, lý do nhượng lại..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tùy chọn VIP */}
            <div className="mp-form-group is-full" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: '12px', borderRadius: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fef08a' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>👑 Đẩy tin VIP Lên Top Đầu (+15.000₫ phí dịch vụ sàn)</span>
              </label>
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Sản phẩm của bạn sẽ có viền sáng Neon Amber và luôn xuất hiện trên cùng trang tìm kiếm.
              </small>
            </div>
          </div>

          {/* Dự toán doanh thu người bán */}
          {numPrice > 0 && (
            <div style={{ background: '#0a0810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', margin: '16px 0', fontSize: '13px' }}>
              <div className="mp-calc-row">
                <span>Giá bán cho khách:</span>
                <strong>{formatVND(numPrice)}</strong>
              </div>
              <div className="mp-calc-row" style={{ color: '#ef4444' }}>
                <span>Phí dịch vụ sàn khấu trừ (2.5%):</span>
                <strong>- {formatVND(estimatedFee)}</strong>
              </div>
              <div className="mp-calc-row is-receive" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span>Bạn thực nhận về ví sàn:</span>
                <strong style={{ color: '#10b981', fontSize: '15px' }}>{formatVND(estimatedReceive)}</strong>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mp-btn-post"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            Đăng Sản Phẩm Lên Chợ Ngay
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: MY ORDERS & SELLER WALLET MODAL
======================================================== */
function MyOrdersModal({ orders, tab, setTab, sellerRevenue, onClose, onConfirmReceived }) {
  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" style={{ maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
          <button
            type="button"
            className={`mp-cat-pill ${tab === 'buyer' ? 'is-active' : ''}`}
            onClick={() => setTab('buyer')}
          >
            📦 Đơn Mua Ký Quỹ ({orders.length})
          </button>
          <button
            type="button"
            className={`mp-cat-pill ${tab === 'seller' ? 'is-active' : ''}`}
            onClick={() => setTab('seller')}
          >
            💰 Ví Sàn &amp; Người Bán
          </button>
        </div>

        {tab === 'buyer' ? (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 14px', color: '#ffffff' }}>
              Danh Sách Đơn Hàng Bảo Chứng Escrow:
            </h3>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p>Bạn chưa có đơn hàng ký quỹ nào. Hãy chọn sản phẩm và bấm "Ký Quỹ Mua"!</p>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="mp-order-card">
                  <div className="mp-order-top">
                    <div>
                      <strong style={{ color: '#fef08a', fontSize: '14px' }}>Mã đơn: {o.id}</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Ngày đặt: {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: o.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                      {o.statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '8px' }}>
                    <strong>{o.productTitle}</strong> (x{o.quantity})
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                    Tổng tiền nạp cọc: <strong style={{ color: '#f59e0b' }}>{formatVND(o.totalAmount)}</strong> • Vận chuyển: <strong>{o.shippingCarrier}</strong>
                  </div>

                  {/* 5-step timeline */}
                  <div className="mp-order-steps">
                    <div className="mp-order-step-node is-done">
                      <span className="mp-node-circle">✓</span>
                      <span>Đã nạp cọc</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status !== 'holding_escrow' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">2</span>
                      <span>Đóng gói</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'inspection_48h' || o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">3</span>
                      <span>Đang giao</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'inspection_48h' || o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">4</span>
                      <span>Test 48H</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">{o.status === 'completed' ? '✓' : '5'}</span>
                      <span>Giải ngân</span>
                    </div>
                  </div>

                  {o.status !== 'completed' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="mp-btn-buy"
                        style={{ padding: '8px 16px', fontSize: '12.5px' }}
                        onClick={() => onConfirmReceived(o.id)}
                      >
                        ✓ Xác Nhận Đã Nhận Hàng &amp; Giải Ngân
                      </button>
                      <button
                        type="button"
                        className="mp-btn-detail"
                        style={{ padding: '8px 16px', fontSize: '12.5px', color: '#fca5a5' }}
                        onClick={() => alert(`Yêu cầu Trọng tài Sàn can thiệp cho đơn ${o.id} đã được gửi. Đội ngũ kiểm soát sẽ liên hệ trong 30 phút!`)}
                      >
                        ⚠️ Khiếu Nại / Yêu Cầu Hoàn Tiền
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 14px', color: '#ffffff' }}>
              Ví Doanh Thu Sàn Của Người Bán:
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Số Dư Khả Dụng:</span>
                <h4 style={{ margin: '6px 0', fontSize: '22px', color: '#10b981', fontWeight: 900 }}>
                  {formatVND(sellerRevenue.netRevenue)}
                </h4>
                <small style={{ color: '#64748b' }}>Đã trừ 2.5% phí sàn</small>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tổng Phí Sàn Đã Đóng (2.5%):</span>
                <h4 style={{ margin: '6px 0', fontSize: '22px', color: '#f59e0b', fontWeight: 900 }}>
                  {formatVND(sellerRevenue.totalFee)}
                </h4>
                <small style={{ color: '#64748b' }}>Đóng góp duy trì sàn</small>
              </div>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đơn Hàng Thành Công:</span>
                <h4 style={{ margin: '6px 0', fontSize: '22px', color: '#38bdf8', fontWeight: 900 }}>
                  {sellerRevenue.orderCount} đơn
                </h4>
                <small style={{ color: '#64748b' }}>Tỷ lệ giao dịch 100%</small>
              </div>
            </div>

            <button
              type="button"
              className="mp-btn-post"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              onClick={() => {
                if (sellerRevenue.netRevenue <= 0) {
                  alert('Ví của bạn hiện chưa có số dư khả dụng từ đơn hàng thành công!');
                } else {
                  alert(`Đã gửi yêu cầu rút ${formatVND(sellerRevenue.netRevenue)} về số tài khoản ngân hàng của bạn. Tiền sẽ về trong 5-10 phút!`);
                }
              }}
            >
              💳 Rút Tiền Về Tài Khoản Ngân Hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
