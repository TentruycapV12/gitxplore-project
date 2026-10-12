import { useState, useEffect, useMemo, useRef } from 'react';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import {
  MARKET_CATEGORIES,
  PRODUCT_CONDITIONS,
  SHIPPING_CARRIERS,
  PLATFORM_VOUCHERS,
  INITIAL_MARKET_PRODUCTS,
} from '../data/marketplaceData.js';
import { getMarketplaceText } from '../data/marketplaceTranslations.js';
import './MarketplacePage.css';

const STORAGE_PRODUCTS_KEY = 'gx_marketplace_products_v3';
const STORAGE_ORDERS_KEY = 'gx_marketplace_orders_v3';
const STORAGE_VOUCHERS_KEY = 'gx_marketplace_saved_vouchers_v3';
const STORAGE_SELLER_KYC_KEY = 'gx_marketplace_seller_kyc_v3';

// Format tiền tệ theo ngôn ngữ được chọn
const formatCurrency = (num, lang = 'vi') => {
  if (lang === 'vi') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  }
  // Quy đổi ước tính VND -> USD nếu là tiếng Anh hoặc ngôn ngữ quốc tế khác (1 USD ≈ 25.000 VND)
  const usd = Math.round((num || 0) / 25000);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usd);
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { openModal } = useUI();
  const { lang, t } = useLanguage();

  const isVi = lang === 'vi';
  const txt = (key, params) => getMarketplaceText(lang, key, params);

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

  // 2. Quản lý danh sách đơn hàng ký quỹ (State Machine)
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

  // 4. KYC Người Bán (Luật TMĐT 2025 bắt buộc định danh)
  const [sellerKYC, setSellerKYC] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SELLER_KYC_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fullName: 'Vũ Minh Tuấn',
      idNumber: '001095012345',
      taxCode: '8392019482',
      isVerified: true,
      registeredAt: '2026-08-15',
    };
  });

  const handleUpdateKYC = (kycData) => {
    const updated = { ...sellerKYC, ...kycData, isVerified: true };
    setSellerKYC(updated);
    try {
      localStorage.setItem(STORAGE_SELLER_KYC_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    alert(isVi ? 'Đã xác thực định danh KYC Người Bán thành công theo Luật TMĐT 2025!' : 'Seller KYC verified successfully under E-Commerce Regulations!');
  };

  // 5. Đồng hồ đếm ngược Flash Sale (Mô hình Shopee)
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

  // 6. Bộ lọc & Tìm kiếm
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedCond, setSelectedCond] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'popular'
  const [showGuide, setShowGuide] = useState(true);

  // 7. Modals & Dialogs
  const [selectedProduct, setSelectedProduct] = useState(null); // Chi tiết sản phẩm
  const [checkoutProduct, setCheckoutProduct] = useState(null); // Đặt mua & Ký quỹ
  const [showPostModal, setShowPostModal] = useState(false); // Đăng bán sản phẩm
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false); // Quản lý đơn hàng & Ví sàn
  const [ordersModalTab, setOrdersModalTab] = useState('buyer'); // 'buyer' | 'seller'
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Mở modal nếu có query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('post') === 'true') {
      setShowPostModal(true);
    }
  }, []);

  // 8. Máy tính biểu phí tương tác (Live Fee & Tax Calculator)
  // Phí sàn 2.5% + Thuế khấu trừ 1.5% (Nghị định 117/2025/NĐ-CP)
  const [calcAmount, setCalcAmount] = useState(2500000);
  const calcFee = Math.round(calcAmount * 0.025);
  const calcTax = Math.round(calcAmount * 0.015);
  const calcReceive = calcAmount - calcFee - calcTax;

  // 9. Lọc và sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCat !== 'all' && p.category !== selectedCat) return false;
        if (selectedCond !== 'all' && p.condition !== selectedCond) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (p.title || '').toLowerCase().includes(q) || (p.title_en || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchSeller = (p.seller?.name || '').toLowerCase().includes(q);
          const matchCat = (p.categoryName || '').toLowerCase().includes(q);
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

  // 10. Xử lý tạo đơn hàng Escrow
  const handleCreateEscrowOrder = (orderData) => {
    const newOrder = {
      id: `GX-ESC-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: 'locked_escrow', // 'locked_escrow' | 'packed' | 'in_transit' | 'delivered_testing' | 'completed' | 'disputed'
      statusLabel: isVi
        ? 'Tiền giữ an toàn tại Két Sắt Escrow (Tạm khóa kho 15 phút)'
        : 'Funds locked in Escrow Vault (15-min inventory reserved)',
      buyerName: user?.username || (isVi ? 'Khách Hàng GitXplore' : 'GitXplore Customer'),
      ...orderData,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCheckoutProduct(null);
    setSelectedProduct(null);
    setOrdersModalTab('buyer');
    setShowMyOrdersModal(true);
  };

  // 11. Xử lý người mua bấm xác nhận hoàn tất & giải ngân
  const handleConfirmOrderReceived = (orderId) => {
    const confirmMsg = isVi
      ? 'Bạn xác nhận đã nhận đúng sản phẩm, kiểm tra hoàn tất 48h và đồng ý giải ngân tiền cho Người Bán?'
      : 'Do you confirm that you have received and inspected the item, and agree to release funds to the Seller?';

    if (window.confirm(confirmMsg)) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'completed',
                statusLabel: isVi
                  ? 'Giao dịch hoàn tất • Đã giải ngân vào ví người bán'
                  : 'Completed • Disbursed to seller wallet',
              }
            : o
        )
      );
    }
  };

  // 12. Xử lý thêm sản phẩm mới
  const handleAddNewProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    setShowPostModal(false);
  };

  // 13. Sổ cái kép & Doanh thu Người bán (Double-entry Ledger)
  const sellerLedger = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalGross = completedOrders.reduce((sum, o) => sum + (o.productPrice || 0), 0);
    const totalPlatformFee = Math.round(totalGross * 0.025);
    const totalTaxWithholding = Math.round(totalGross * 0.015);
    const netRevenue = totalGross - totalPlatformFee - totalTaxWithholding;
    return {
      totalGross,
      totalPlatformFee,
      totalTaxWithholding,
      netRevenue,
      orderCount: completedOrders.length,
    };
  }, [orders]);

  return (
    <div className="mp-page">
      <TopNav />

      {/* ===== 1. HERO SECTION ===== */}
      <section className="mp-hero">
        <div className="mp-hero-badge">
          <span>{txt('hero_badge')}</span>
        </div>

        <h1 className="mp-hero-title">
          {txt('hero_title_1')}
          <span>{txt('hero_title_highlight')}</span>
        </h1>

        <p className="mp-hero-subtitle">
          {txt('hero_subtitle')}
        </p>

        {/* Live Platform Highlights */}
        <div className="mp-stats-bar">
          <div className="mp-stat-card">
            <div className="mp-stat-icon">🛡️</div>
            <div className="mp-stat-info">
              <strong>{txt('stat_escrow_title')}</strong>
              <span>{txt('stat_escrow_desc')}</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⚡</div>
            <div className="mp-stat-info">
              <strong>{txt('stat_fee_title')}</strong>
              <span>{txt('stat_fee_desc')}</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">⏱️</div>
            <div className="mp-stat-info">
              <strong>{txt('stat_trial_title')}</strong>
              <span>{txt('stat_trial_desc')}</span>
            </div>
          </div>
          <div className="mp-stat-card">
            <div className="mp-stat-icon">🚚</div>
            <div className="mp-stat-info">
              <strong>{txt('stat_logistics_title')}</strong>
              <span>{txt('stat_logistics_desc')}</span>
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
            <span>{txt('btn_post_product')}</span>
          </button>

          <button
            type="button"
            className="mp-btn-orders"
            onClick={() => setShowMyOrdersModal(true)}
          >
            <span>{txt('btn_my_orders')} ({orders.length})</span>
          </button>

          <button
            type="button"
            className="mp-btn-guide-toggle"
            onClick={() => setShowGuide((prev) => !prev)}
          >
            {showGuide ? txt('btn_hide_guide') : txt('btn_show_guide')}
          </button>
        </div>
      </section>

      {/* ===== 2. ESCROW WORKFLOW & LIVE FEE/TAX CALCULATOR ===== */}
      {showGuide && (
        <section className="mp-guide-section">
          <div className="mp-guide-box">
            {/* Cột trái: 3 bước vận hành TMĐT */}
            <div className="mp-guide-steps">
              <div className="mp-guide-step">
                <span className="mp-step-badge">1</span>
                <div className="mp-step-text">
                  <h4>{txt('guide_step1_title')}</h4>
                  <p>{txt('guide_step1_desc')}</p>
                </div>
              </div>

              <div className="mp-guide-step">
                <span className="mp-step-badge">2</span>
                <div className="mp-step-text">
                  <h4>{txt('guide_step2_title')}</h4>
                  <p>{txt('guide_step2_desc')}</p>
                </div>
              </div>

              <div className="mp-guide-step">
                <span className="mp-step-badge">3</span>
                <div className="mp-step-text">
                  <h4>{txt('guide_step3_title')}</h4>
                  <p>{txt('guide_step3_desc')}</p>
                </div>
              </div>
            </div>

            {/* Cột phải: Máy tính biểu phí tương tác & Thuế */}
            <div className="mp-calc-card">
              <h4 className="mp-calc-title">
                <span>🧮</span>
                <span>{txt('calc_title')}</span>
              </h4>

              <div className="mp-calc-input-wrap">
                <label>{txt('calc_input_label')}</label>
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
                  <span>{txt('calc_row_price')}</span>
                  <strong>{formatCurrency(calcAmount, lang)}</strong>
                </div>
                <div className="mp-calc-row">
                  <span>{txt('calc_row_fee')}</span>
                  <strong style={{ color: '#ef4444' }}>- {formatCurrency(calcFee, lang)}</strong>
                </div>
                <div className="mp-calc-row">
                  <span>{txt('calc_row_tax')}</span>
                  <strong style={{ color: '#f59e0b' }}>- {formatCurrency(calcTax, lang)}</strong>
                </div>
                <div className="mp-calc-row is-receive">
                  <span>{txt('calc_row_receive')}</span>
                  <strong>{formatCurrency(calcReceive, lang)}</strong>
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
            <span>{txt('voucher_hub_title')}</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            {txt('voucher_saved_count', { count: savedVoucherCodes.length })}
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
                  <div className="mp-voucher-label">{isVi ? v.label : (v.label_en || v.label)}</div>
                  <p className="mp-voucher-desc">{isVi ? v.desc : (v.desc_en || v.desc)}</p>
                </div>
                <button
                  type="button"
                  className={`mp-voucher-btn ${isSaved ? 'is-saved' : ''}`}
                  onClick={() => toggleSaveVoucher(v.code)}
                >
                  {isSaved ? txt('btn_saved_voucher') : txt('btn_save_voucher')}
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
              <span className="mp-flash-badge">{txt('flash_sale_badge')}</span>
              <div className="mp-flash-timer">
                <span>{txt('flash_sale_ends_in')}</span>
                <span className="mp-timer-digit">{String(flashTimeLeft.hours).padStart(2, '0')}</span> :
                <span className="mp-timer-digit">{String(flashTimeLeft.minutes).padStart(2, '0')}</span> :
                <span className="mp-timer-digit">{String(flashTimeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
            <span style={{ fontSize: '13px', color: '#fef08a', fontWeight: 700 }}>
              {txt('flash_sale_tag')}
            </span>
          </div>

          <div className="mp-products-grid">
            {flashSaleProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                lang={lang}
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
          {txt('categories_title')}
        </div>
        <div className="mp-categories-bar">
          {MARKET_CATEGORIES.map((cat) => {
            const label = txt(cat.key) || cat.label;
            return (
              <button
                key={cat.id}
                type="button"
                className={`mp-cat-pill ${selectedCat === cat.id ? 'is-active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{label}</span>
                <span className="mp-cat-count">{cat.count || 0}</span>
              </button>
            );
          })}
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
            placeholder={txt('search_placeholder')}
          />
        </div>

        <div className="mp-filter-controls">
          <select
            className="mp-select"
            value={selectedCond}
            onChange={(e) => setSelectedCond(e.target.value)}
          >
            <option value="all">{txt('cond_all')}</option>
            <option value="brand_new">{txt('cond_brand_new')}</option>
            <option value="like_new">{txt('cond_like_new')}</option>
            <option value="used">{txt('cond_used')}</option>
            <option value="digital_license">{txt('cond_digital')}</option>
          </select>

          <select
            className="mp-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">{txt('sort_newest')}</option>
            <option value="popular">{txt('sort_popular')}</option>
            <option value="price_asc">{txt('sort_price_asc')}</option>
            <option value="price_desc">{txt('sort_price_desc')}</option>
          </select>
        </div>
      </section>

      {/* ===== 7. PRODUCTS GRID ===== */}
      <section className="mp-products-section">
        {filteredProducts.length === 0 ? (
          <div className="mp-empty-state">
            <div className="mp-empty-icon">🔌</div>
            <h3>{txt('empty_title')}</h3>
            <p>{txt('empty_desc')}</p>
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
              {txt('btn_view_all')}
            </button>
          </div>
        ) : (
          <div className="mp-products-grid">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                lang={lang}
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
          lang={lang}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={() => {
            const p = selectedProduct;
            setSelectedProduct(null);
            setCheckoutProduct(p);
          }}
        />
      )}

      {/* ===== 9. MODAL ĐẶT HÀNG & KÝ QUỸ (CHECKOUT) ===== */}
      {checkoutProduct && (
        <CheckoutEscrowModal
          product={checkoutProduct}
          lang={lang}
          savedVouchers={PLATFORM_VOUCHERS.filter((v) => savedVoucherCodes.includes(v.code))}
          onClose={() => setCheckoutProduct(null)}
          onConfirmOrder={handleCreateEscrowOrder}
        />
      )}

      {/* ===== 10. MODAL ĐĂNG BÁN SẢN PHẨM MỚI ===== */}
      {showPostModal && (
        <PostProductModal
          lang={lang}
          sellerKYC={sellerKYC}
          onOpenKYC={() => setShowKYCModal(true)}
          onClose={() => setShowPostModal(false)}
          onAddProduct={handleAddNewProduct}
        />
      )}

      {/* ===== 11. MODAL XÁC THỰC KYC (LUẬT TMĐT 2025) ===== */}
      {showKYCModal && (
        <SellerKYCModal
          lang={lang}
          currentKYC={sellerKYC}
          onClose={() => setShowKYCModal(false)}
          onSaveKYC={(data) => {
            handleUpdateKYC(data);
            setShowKYCModal(false);
          }}
        />
      )}

      {/* ===== 12. DRAWER KÉT SẮT & ĐƠN HÀNG (MY ORDERS & SELLER CENTER) ===== */}
      {showMyOrdersModal && (
        <MyOrdersModal
          orders={orders}
          tab={ordersModalTab}
          setTab={setOrdersModalTab}
          lang={lang}
          sellerKYC={sellerKYC}
          onOpenKYC={() => setShowKYCModal(true)}
          sellerLedger={sellerLedger}
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
function ProductCard({ product, lang, onOpenDetail, onBuyNow }) {
  const isVi = lang === 'vi';
  const condConfig = PRODUCT_CONDITIONS[product.condition] || PRODUCT_CONDITIONS.brand_new;
  const condLabel = isVi ? condConfig.label : (condConfig.label_en || condConfig.label);
  const displayTitle = isVi ? product.title : (product.title_en || product.title);

  return (
    <div className={`mp-product-card ${product.isFeatured ? 'is-featured' : ''}`}>
      <div className="mp-card-thumb" onClick={onOpenDetail}>
        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'} alt={displayTitle} />
        <span className="mp-badge-tag" style={{ color: condConfig.color }}>
          ● {condLabel}
        </span>
        {product.isFlashSale && <span className="mp-badge-flash">⚡ SALE</span>}
      </div>

      <div className="mp-card-body">
        <span className="mp-card-cat">{isVi ? product.categoryName : (product.categoryName_en || product.categoryName)}</span>
        <h3 className="mp-card-title" onClick={onOpenDetail} title={displayTitle}>
          {displayTitle}
        </h3>

        <div className="mp-price-row">
          <span className="mp-price-current">{formatCurrency(product.price, lang)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="mp-price-old">{formatCurrency(product.originalPrice, lang)}</span>
          )}
        </div>

        {/* Stock & Sold count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
          <span>{getMarketplaceText(lang, 'stock_label', { stock: product.stock || 1 })}</span>
          <span>{getMarketplaceText(lang, 'sold_label', { sold: product.soldCount || 0 })}</span>
        </div>

        <div className="mp-card-seller">
          <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="mp-seller-avatar" />
          <span className="mp-seller-name">{product.seller?.name || 'Verified Tech Shop'}</span>
          <span className="mp-seller-rating">⭐ {product.seller?.rating || '5.0'}</span>
        </div>

        <div className="mp-card-actions">
          <button type="button" className="mp-btn-detail" onClick={onOpenDetail}>
            {getMarketplaceText(lang, 'btn_detail')}
          </button>
          <button type="button" className="mp-btn-buy" onClick={onBuyNow}>
            {getMarketplaceText(lang, 'btn_buy_escrow')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: PRODUCT DETAIL MODAL
======================================================== */
function ProductDetailModal({ product, lang, onClose, onBuyNow }) {
  const isVi = lang === 'vi';
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const condConfig = PRODUCT_CONDITIONS[product.condition] || PRODUCT_CONDITIONS.brand_new;
  const condLabel = isVi ? condConfig.label : (condConfig.label_en || condConfig.label);
  const displayTitle = isVi ? product.title : (product.title_en || product.title);

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

            {/* Độ uy tín người bán & KYC */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src={product.seller?.avatar} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{product.seller?.name}</strong>
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ KYC Verified
                    </span>
                  </div>
                  <small style={{ color: '#94a3b8' }}>📍 {product.seller?.location || (isVi ? 'Toàn quốc' : 'Nationwide')}</small>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                <span>{isVi ? 'Đánh giá:' : 'Rating:'} <strong style={{ color: '#fbbf24' }}>⭐ {product.seller?.rating || '5.0'}</strong></span>
                <span>{isVi ? 'Đã hoàn tất:' : 'Completed orders:'} <strong>{product.seller?.completedOrders || 10}+</strong></span>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông số & Mua */}
          <div className="mp-detail-info">
            <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
              {isVi ? product.categoryName : (product.categoryName_en || product.categoryName)}
            </span>
            <h2>{displayTitle}</h2>

            <div className="mp-price-row">
              <span className="mp-price-current" style={{ fontSize: '24px' }}>
                {formatCurrency(product.price, lang)}
              </span>
              {product.originalPrice && (
                <span className="mp-price-old">{formatCurrency(product.originalPrice, lang)}</span>
              )}
              <span style={{ color: condConfig.color, fontSize: '12px', fontWeight: 700, marginLeft: 'auto' }}>
                ● {condLabel}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6', margin: '14px 0' }}>
              {product.description}
            </p>

            {/* Thông số kỹ thuật */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mp-specs-list">
                <strong style={{ fontSize: '12.5px', color: '#fef08a', marginBottom: '4px' }}>
                  ⚙️ {isVi ? 'Thông số kỹ thuật chi tiết:' : 'Technical Specifications:'}
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
              🛡️ <strong>{isVi ? 'Chính sách Escrow 48H:' : '48-Hour Escrow Protection:'}</strong>{' '}
              {isVi
                ? 'Tiền cọc giữ tại Két Sắt GitXplore. Bạn có 48 giờ kiểm tra thiết bị trước khi giải ngân cho người bán!'
                : 'Funds held in Escrow Vault. You have a 48-hour inspection trial before funds are released to the seller!'}
            </div>

            <button
              type="button"
              className="mp-btn-buy"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              onClick={onBuyNow}
            >
              {isVi ? `Tiến Hành Ký Quỹ & Đặt Hàng (${formatCurrency(product.price, lang)})` : `Place Escrow Order (${formatCurrency(product.price, lang)})`}
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
function CheckoutEscrowModal({ product, lang, savedVouchers, onClose, onConfirmOrder }) {
  const isVi = lang === 'vi';
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
      alert(isVi ? 'Vui lòng nhập địa chỉ nhận hàng và số điện thoại liên hệ!' : 'Please enter delivery address and phone number!');
      return;
    }

    onConfirmOrder({
      productId: product.id,
      productTitle: isVi ? product.title : (product.title_en || product.title),
      productPrice: product.price,
      quantity,
      subtotal,
      shippingCarrier: isVi ? carrier.name : (carrier.name_en || carrier.name),
      shippingFee,
      appliedVoucher: voucher?.code || null,
      discountAmount,
      totalAmount: totalEscrowDeposit,
      shippingAddress: address || (isVi ? 'Bàn giao trực tuyến' : 'Instant Digital'),
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
          🛒 {isVi ? 'Đặt Hàng & Ký Quỹ Trung Gian (Escrow Vault)' : 'Place Order & Escrow Deposit'}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px' }}>
          {isVi
            ? 'Mã bảo chứng giao dịch tự động • Khóa kho 15 phút • Giữ tiền an toàn cho đến khi bạn xác nhận hài lòng.'
            : 'Automated escrow transaction • 15-min inventory lock • 100% money-back guarantee until confirmed.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Thông tin món hàng */}
          <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
            <img src={product.images?.[0]} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '14px', color: '#ffffff' }}>
                {isVi ? product.title : (product.title_en || product.title)}
              </strong>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{formatCurrency(product.price, lang)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isVi ? 'Số lượng:' : 'Qty:'}</span>
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
                🚚 {isVi ? 'Chọn Đơn Vị Vận Chuyển:' : 'Select Logistics Carrier:'}
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
                        <strong>{isVi ? c.name : (c.name_en || c.name)}</strong>
                        <small>{isVi ? c.time : (c.time_en || c.time)}</small>
                      </div>
                    </div>
                    <span className="mp-carrier-fee">{formatCurrency(c.fee, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chọn Voucher Sàn */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a', display: 'block', marginBottom: '6px' }}>
              🎟️ {isVi ? 'Áp Dụng Voucher Sàn:' : 'Apply Platform Voucher:'}
            </label>
            <select
              className="mp-select"
              style={{ width: '100%' }}
              value={appliedVoucherCode}
              onChange={(e) => setAppliedVoucherCode(e.target.value)}
            >
              <option value="">{isVi ? 'Không dùng mã' : 'No voucher'}</option>
              {savedVouchers.map((v) => (
                <option key={v.code} value={v.code}>
                  {isVi ? v.label : (v.label_en || v.label)} - [{v.code}]
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin giao hàng */}
          {product.deliveryType !== 'digital' && (
            <div className="mp-form-grid" style={{ marginBottom: '16px' }}>
              <div className="mp-form-group">
                <label>{isVi ? 'Số điện thoại nhận hàng (*):' : 'Phone Number (*):'}</label>
                <input
                  type="tel"
                  required
                  placeholder={isVi ? '0912 345 678' : '+84 912 345 678'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="mp-form-group">
                <label>{isVi ? 'Địa chỉ giao hàng (*):' : 'Shipping Address (*):'}</label>
                <input
                  type="text"
                  required
                  placeholder={isVi ? 'Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP' : 'Street address, City, Country'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Bảng kê hóa đơn ký quỹ */}
          <div style={{ background: '#0a0810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div className="mp-calc-row" style={{ marginBottom: '6px' }}>
              <span>{isVi ? `Tiền hàng (${quantity} cái):` : `Item Subtotal (${quantity} pcs):`}</span>
              <strong>{formatCurrency(subtotal, lang)}</strong>
            </div>
            <div className="mp-calc-row" style={{ marginBottom: '6px' }}>
              <span>{isVi ? 'Phí vận chuyển:' : 'Shipping Fee:'}</span>
              <strong>{formatCurrency(shippingFee, lang)}</strong>
            </div>
            {discountAmount > 0 && (
              <div className="mp-calc-row" style={{ marginBottom: '6px', color: '#10b981' }}>
                <span>{isVi ? `Voucher giảm giá (${voucher?.code}):` : `Voucher Discount (${voucher?.code}):`}</span>
                <strong>- {formatCurrency(discountAmount, lang)}</strong>
              </div>
            )}
            <div className="mp-calc-row is-receive" style={{ fontSize: '17px', color: '#f59e0b', marginTop: '10px' }}>
              <span>{isVi ? 'Tổng tiền nạp Két Sắt Escrow:' : 'Total Escrow Deposit:'}</span>
              <strong>{formatCurrency(totalEscrowDeposit, lang)}</strong>
            </div>
          </div>

          {/* Mô phỏng mã VietQR */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: '#fef08a', fontWeight: 700, marginBottom: '6px' }}>
              🏦 {isVi ? 'Quét Mã VietQR Chuyển Khoản Ký Quỹ Tự Động' : 'Scan VietQR to Deposit Escrow'}
            </div>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=GITXPLORE-ESCROW-DEPOSIT-2026"
              alt="VietQR Escrow"
              style={{ width: '130px', height: '130px', borderRadius: '8px', border: '2px solid #fff', margin: '0 auto 8px' }}
            />
            <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
              {isVi ? 'Nội dung CK:' : 'Transfer Note:'} <strong style={{ color: '#38bdf8' }}>GX-ESC-ORDER</strong> • Bank: <strong>MBBank (GitXplore Escrow Vault)</strong>
            </div>
          </div>

          <button
            type="submit"
            className="mp-btn-buy"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {isVi ? `Xác Nhận Nạp Ký Quỹ (${formatCurrency(totalEscrowDeposit, lang)})` : `Confirm Escrow Deposit (${formatCurrency(totalEscrowDeposit, lang)})`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: POST PRODUCT MODAL (ĐĂNG BÁN SẢN PHẨM)
======================================================== */
function PostProductModal({ lang, sellerKYC, onOpenKYC, onClose, onAddProduct }) {
  const isVi = lang === 'vi';
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
  const [specWarranty, setSpecWarranty] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Tính phí sàn 2.5% + Thuế khấu trừ 1.5%
  const numPrice = Number(price) || 0;
  const estimatedFee = Math.round(numPrice * 0.025);
  const estimatedTax = Math.round(numPrice * 0.015);
  const estimatedReceive = numPrice - estimatedFee - estimatedTax;

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
      alert(isVi ? 'Vui lòng nhập tên sản phẩm và giá bán!' : 'Please enter product title and price!');
      return;
    }

    const catObj = MARKET_CATEGORIES.find((c) => c.id === category);

    const rawImgs = imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalImages = rawImgs.length > 0 ? rawImgs : ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'];

    const specs = {};
    if (specCpu) specs[isVi ? 'Vi xử lý / Model' : 'Processor / Model'] = specCpu;
    if (specWarranty) specs[isVi ? 'Bảo hành' : 'Warranty'] = specWarranty;

    const newProduct = {
      id: `prod-${Date.now()}`,
      title,
      title_en: title,
      category,
      categoryName: catObj?.label || 'Thiết Bị Điện Tử',
      categoryName_en: catObj?.label || 'Electronics',
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
        name: sellerKYC?.fullName || user?.username || 'Verified Tech Shop',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: 5.0,
        completedOrders: 1,
        verified: sellerKYC?.isVerified || false,
        location: isVi ? 'Việt Nam' : 'Verified Hub',
      },
    };

    onAddProduct(newProduct);
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
          📤 {isVi ? 'Đăng Bán Thiết Bị Điện Tử (Phí Sàn 2.5%)' : 'List Electronics for Sale (2.5% Fee)'}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
          {isVi
            ? 'Đăng bán mọi thiết bị điện tử, vi mạch, PC, gia dụng, âm thanh hay công cụ AI lên toàn bộ sàn.'
            : 'List phones, computers, semiconductors, smart home, audio, TVs or AI licenses on the marketplace.'}
        </p>

        {/* Thông báo KYC Luật TMĐT 2025 */}
        <div style={{ background: sellerKYC?.isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid', borderColor: sellerKYC?.isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <strong style={{ color: sellerKYC?.isVerified ? '#34d399' : '#f87171', fontSize: '13px', display: 'block' }}>
              {sellerKYC?.isVerified
                ? (isVi ? '✓ Danh tính người bán đã được KYC xác thực' : '✓ Seller Identity KYC Verified')
                : (isVi ? '⚠️ Cần xác thực danh tính KYC (Luật TMĐT 2025)' : '⚠️ KYC Identity Required (E-Commerce Law)')}
            </strong>
            <small style={{ color: '#94a3b8' }}>
              {isVi ? `Chủ gian hàng: ${sellerKYC.fullName} • MST: ${sellerKYC.taxCode}` : `Store Owner: ${sellerKYC.fullName} • Tax: ${sellerKYC.taxCode}`}
            </small>
          </div>
          <button
            type="button"
            className="mp-btn-detail"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={onOpenKYC}
          >
            {isVi ? 'Cập Nhật KYC' : 'Update KYC'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mp-form-grid">
            {/* Tên sản phẩm */}
            <div className="mp-form-group is-full">
              <label>{isVi ? 'Tên sản phẩm điện tử (*):' : 'Product Title (*):'}</label>
              <input
                type="text"
                required
                placeholder={isVi ? 'Ví dụ: iPhone 15 Pro Max / Kit ESP32-S3 AI / Piano Yamaha P-125...' : 'e.g., iPhone 15 Pro Max / ESP32-S3 AI Kit / Yamaha P-125 Piano...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Danh mục */}
            <div className="mp-form-group">
              <label>{isVi ? 'Phân loại ngành hàng điện tử (*):' : 'Electronics Category (*):'}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {MARKET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {getMarketplaceText(lang, c.key) || c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tình trạng */}
            <div className="mp-form-group">
              <label>{isVi ? 'Tình trạng sản phẩm (*):' : 'Item Condition (*):'}</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="brand_new">{getMarketplaceText(lang, 'cond_brand_new')}</option>
                <option value="like_new">{getMarketplaceText(lang, 'cond_like_new')}</option>
                <option value="used">{getMarketplaceText(lang, 'cond_used')}</option>
                <option value="digital_license">{getMarketplaceText(lang, 'cond_digital')}</option>
              </select>
            </div>

            {/* Giá bán */}
            <div className="mp-form-group">
              <label>{isVi ? 'Giá bán niêm yết (VND) (*):' : 'Selling Price (VND) (*):'}</label>
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
              <label>{isVi ? 'Giá gốc (nếu có giảm giá):' : 'Original Price (if on sale):'}</label>
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
              <label>{isVi ? 'Số lượng tồn kho:' : 'Stock Quantity:'}</label>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>

            {/* Hình thức giao hàng */}
            <div className="mp-form-group">
              <label>{isVi ? 'Hình thức giao nhận:' : 'Fulfillment Type:'}</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                <option value="physical">{isVi ? 'Vận chuyển hàng hóa vật lý (GHN / Viettel Post / Hỏa tốc)' : 'Physical shipping (Couriers / 2H Express)'}</option>
                <option value="digital">{isVi ? 'Giao trực tuyến qua email / mã kích hoạt số' : 'Instant digital license key'}</option>
              </select>
            </div>

            {/* Upload Ảnh */}
            <div className="mp-form-group is-full">
              <label>{isVi ? 'Hình ảnh sản phẩm (Tải lên từ máy hoặc dán link):' : 'Product Images (Upload or paste links):'}</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 {isVi ? 'Chọn ảnh từ thiết bị' : 'Choose files from device'}
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
                placeholder={isVi ? 'Mỗi dòng 1 đường dẫn ảnh hoặc dữ liệu ảnh...' : 'One image URL per line...'}
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
              />
            </div>

            {/* Thông số kỹ thuật nhanh */}
            <div className="mp-form-group">
              <label>{isVi ? 'Vi xử lý / Model thiết bị:' : 'Processor / Model:'}</label>
              <input
                type="text"
                placeholder={isVi ? 'Ví dụ: Apple A17 Pro / ESP32-S3' : 'e.g., Apple A17 Pro / ESP32-S3'}
                value={specCpu}
                onChange={(e) => setSpecCpu(e.target.value)}
              />
            </div>
            <div className="mp-form-group">
              <label>{isVi ? 'Bảo hành / Cam kết:' : 'Warranty / Guarantee:'}</label>
              <input
                type="text"
                placeholder={isVi ? 'Ví dụ: 12 tháng chính hãng / Bao test 7 ngày' : 'e.g., 12 months manufacturer'}
                value={specWarranty}
                onChange={(e) => setSpecWarranty(e.target.value)}
              />
            </div>

            {/* Mô tả chi tiết */}
            <div className="mp-form-group is-full">
              <label>{isVi ? 'Mô tả chi tiết sản phẩm:' : 'Product Description:'}</label>
              <textarea
                rows="4"
                placeholder={isVi ? 'Mô tả công năng, phụ kiện đi kèm, tình trạng trầy xước, lý do nhượng lại...' : 'Describe specifications, condition, included accessories...'}
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
                <span>👑 {isVi ? 'Đẩy tin VIP Lên Top Đầu (+15.000₫ phí quảng cáo sàn)' : 'VIP Featured Boost (+15,000₫ ads fee)'}</span>
              </label>
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                {isVi ? 'Sản phẩm có viền sáng Neon Amber và luôn xuất hiện trên cùng trang tìm kiếm.' : 'Product will be highlighted with Neon Amber border and ranked on top.'}
              </small>
            </div>
          </div>

          {/* Dự toán đối soát doanh thu người bán */}
          {numPrice > 0 && (
            <div style={{ background: '#0a0810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', margin: '16px 0', fontSize: '13px' }}>
              <div className="mp-calc-row">
                <span>{isVi ? 'Giá bán cho khách:' : 'Gross price:'}</span>
                <strong>{formatCurrency(numPrice, lang)}</strong>
              </div>
              <div className="mp-calc-row" style={{ color: '#ef4444' }}>
                <span>{isVi ? 'Phí dịch vụ sàn (2.5%):' : 'Platform fee (2.5%):'}</span>
                <strong>- {formatCurrency(estimatedFee, lang)}</strong>
              </div>
              <div className="mp-calc-row" style={{ color: '#f59e0b' }}>
                <span>{isVi ? 'Khấu trừ thuế (1.5% - NĐ 117/2025):' : 'Tax withholding (1.5%):'}</span>
                <strong>- {formatCurrency(estimatedTax, lang)}</strong>
              </div>
              <div className="mp-calc-row is-receive" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span>{isVi ? 'Bạn thực nhận về ví sàn:' : 'Net payout to seller wallet:'}</span>
                <strong style={{ color: '#10b981', fontSize: '15px' }}>{formatCurrency(estimatedReceive, lang)}</strong>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mp-btn-post"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {isVi ? 'Đăng Sản Phẩm Lên Chợ Ngay' : 'List Item on Marketplace Now'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: SELLER KYC MODAL (LUẬT TMĐT 2025)
======================================================== */
function SellerKYCModal({ lang, currentKYC, onClose, onSaveKYC }) {
  const isVi = lang === 'vi';
  const [fullName, setFullName] = useState(currentKYC.fullName || '');
  const [idNumber, setIdNumber] = useState(currentKYC.idNumber || '');
  const [taxCode, setTaxCode] = useState(currentKYC.taxCode || '');

  const handleSave = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !idNumber.trim()) {
      alert(isVi ? 'Vui lòng nhập Họ tên và số CCCD / Hộ chiếu!' : 'Please enter full name and National ID number!');
      return;
    }
    onSaveKYC({ fullName, idNumber, taxCode });
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
          🛡️ {isVi ? 'Xác Thực Danh Tính KYC Người Bán' : 'Seller Identity Verification (KYC)'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px', lineHeight: '1.5' }}>
          {isVi
            ? 'Căn cứ Luật Thương mại điện tử 2025 (122/2025/QH15): Mọi cá nhân, hộ kinh doanh mở gian hàng bán sản phẩm đều bắt buộc phải định danh để phòng chống gian lận và khấu trừ thuế hợp pháp.'
            : 'Pursuant to E-Commerce Regulations: All sellers must complete identity verification to prevent fraud and ensure statutory tax withholding.'}
        </p>

        <form onSubmit={handleSave}>
          <div className="mp-form-group" style={{ marginBottom: '12px' }}>
            <label>{isVi ? 'Họ và tên / Tên hộ kinh doanh (*):' : 'Full Name / Business Name (*):'}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="mp-form-group" style={{ marginBottom: '12px' }}>
            <label>{isVi ? 'Số CCCD / Hộ chiếu (*):' : 'National ID / Passport Number (*):'}</label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />
          </div>

          <div className="mp-form-group" style={{ marginBottom: '18px' }}>
            <label>{isVi ? 'Mã số thuế cá nhân / MST Doanh nghiệp:' : 'Tax Identification Number (TIN):'}</label>
            <input
              type="text"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mp-btn-buy"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            {isVi ? 'Lưu & Hoàn Tất Xác Thực KYC' : 'Save & Verify KYC'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: MY ORDERS & SELLER CENTER MODAL
======================================================== */
function MyOrdersModal({ orders, tab, setTab, lang, sellerKYC, onOpenKYC, sellerLedger, onClose, onConfirmReceived }) {
  const isVi = lang === 'vi';

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
          <button
            type="button"
            className={`mp-cat-pill ${tab === 'buyer' ? 'is-active' : ''}`}
            onClick={() => setTab('buyer')}
          >
            {getMarketplaceText(lang, 'tab_buyer_orders')} ({orders.length})
          </button>
          <button
            type="button"
            className={`mp-cat-pill ${tab === 'seller' ? 'is-active' : ''}`}
            onClick={() => setTab('seller')}
          >
            {getMarketplaceText(lang, 'tab_seller_wallet')}
          </button>
        </div>

        {tab === 'buyer' ? (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 14px', color: '#ffffff' }}>
              {isVi ? 'Danh Sách Đơn Hàng Bảo Chứng Escrow (Quy Trình 5 Bước):' : 'Escrow Protected Orders (5-Stage State Machine):'}
            </h3>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p>{isVi ? 'Bạn chưa có đơn hàng ký quỹ nào. Hãy chọn sản phẩm và bấm "Ký Quỹ Mua"!' : 'No escrow orders yet. Browse products and place an order!'}</p>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="mp-order-card">
                  <div className="mp-order-top">
                    <div>
                      <strong style={{ color: '#fef08a', fontSize: '14px' }}>
                        {isVi ? 'Mã đơn:' : 'Order ID:'} {o.id}
                      </strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {isVi ? 'Ngày đặt:' : 'Date:'} {new Date(o.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')}
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
                    {isVi ? 'Tổng tiền nạp cọc:' : 'Total deposited:'} <strong style={{ color: '#f59e0b' }}>{formatCurrency(o.totalAmount, lang)}</strong> • {isVi ? 'Vận chuyển:' : 'Carrier:'} <strong>{o.shippingCarrier}</strong>
                  </div>

                  {/* 5-step state machine timeline */}
                  <div className="mp-order-steps">
                    <div className="mp-order-step-node is-done">
                      <span className="mp-node-circle">✓</span>
                      <span>{isVi ? 'Đã nạp cọc' : 'Deposited'}</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status !== 'locked_escrow' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">2</span>
                      <span>{isVi ? 'Đóng gói' : 'Packed'}</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'in_transit' || o.status === 'delivered_testing' || o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">3</span>
                      <span>{isVi ? 'Đang giao' : 'Shipping'}</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'delivered_testing' || o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">4</span>
                      <span>{isVi ? 'Test 48H' : '48H Test'}</span>
                    </div>
                    <div className={`mp-order-step-node ${o.status === 'completed' ? 'is-done' : ''}`}>
                      <span className="mp-node-circle">{o.status === 'completed' ? '✓' : '5'}</span>
                      <span>{isVi ? 'Giải ngân' : 'Disbursed'}</span>
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
                        ✓ {isVi ? 'Xác Nhận Đã Nhận Hàng & Giải Ngân' : 'Confirm Delivered & Release Escrow'}
                      </button>
                      <button
                        type="button"
                        className="mp-btn-detail"
                        style={{ padding: '8px 16px', fontSize: '12.5px', color: '#fca5a5' }}
                        onClick={() => alert(isVi ? `Yêu cầu Trọng tài Sàn can thiệp cho đơn ${o.id} đã được gửi. Đội ngũ kiểm soát sẽ liên hệ trong 30 phút!` : `Dispute initiated for ${o.id}. Arbitration team will respond within 30 minutes!`)}
                      >
                        ⚠️ {isVi ? 'Khiếu Nại / Yêu Cầu Hoàn Tiền' : 'Dispute / Request Refund'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {/* Header Seller Center & KYC status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#ffffff', display: 'block' }}>
                  {isVi ? 'Hồ Sơ Gian Hàng & Xác Thực KYC (Luật TMĐT 2025)' : 'Seller Store KYC Profile (E-Commerce Law)'}
                </strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {isVi ? `Chủ gian hàng: ${sellerKYC.fullName} • CCCD: ${sellerKYC.idNumber}` : `Owner: ${sellerKYC.fullName} • National ID: ${sellerKYC.idNumber}`}
                </span>
              </div>
              <button
                type="button"
                className="mp-btn-detail"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={onOpenKYC}
              >
                {sellerKYC.isVerified ? (isVi ? '✓ Đã KYC' : '✓ KYC Verified') : (isVi ? 'Cập nhật KYC' : 'Update KYC')}
              </button>
            </div>

            <h3 style={{ fontSize: '16px', margin: '0 0 14px', color: '#ffffff' }}>
              {isVi ? 'Sổ Cái Kép & Đối Soát Doanh Thu Ví Sàn:' : 'Double-Entry Ledger & Settlement Balance:'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isVi ? 'Số Dư Khả Dụng:' : 'Available Balance:'}</span>
                <h4 style={{ margin: '6px 0', fontSize: '20px', color: '#10b981', fontWeight: 900 }}>
                  {formatCurrency(sellerLedger.netRevenue, lang)}
                </h4>
                <small style={{ color: '#64748b' }}>{isVi ? 'Đã trừ 2.5% phí + 1.5% thuế' : 'After fee & tax deductions'}</small>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isVi ? 'Phí Sàn Khấu Trừ (2.5%):' : 'Platform Fee (2.5%):'}</span>
                <h4 style={{ margin: '6px 0', fontSize: '20px', color: '#f59e0b', fontWeight: 900 }}>
                  {formatCurrency(sellerLedger.totalPlatformFee, lang)}
                </h4>
                <small style={{ color: '#64748b' }}>{isVi ? 'Doanh thu sàn trung gian' : 'Intermediary fee'}</small>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isVi ? 'Thuế Đã Khấu Trừ (1.5%):' : 'Tax Withholding (1.5%):'}</span>
                <h4 style={{ margin: '6px 0', fontSize: '20px', color: '#f87171', fontWeight: 900 }}>
                  {formatCurrency(sellerLedger.totalTaxWithholding, lang)}
                </h4>
                <small style={{ color: '#64748b' }}>{isVi ? 'Nghị định 117/2025/NĐ-CP' : 'Statutory e-commerce tax'}</small>
              </div>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isVi ? 'Đơn Hàng Thành Công:' : 'Completed Orders:'}</span>
                <h4 style={{ margin: '6px 0', fontSize: '20px', color: '#38bdf8', fontWeight: 900 }}>
                  {sellerLedger.orderCount} {isVi ? 'đơn' : 'orders'}
                </h4>
                <small style={{ color: '#64748b' }}>100% {isVi ? 'tỷ lệ giao dịch' : 'success rate'}</small>
              </div>
            </div>

            <button
              type="button"
              className="mp-btn-post"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              onClick={() => {
                if (sellerLedger.netRevenue <= 0) {
                  alert(isVi ? 'Ví của bạn hiện chưa có số dư khả dụng từ đơn hàng thành công!' : 'No available balance for withdrawal yet!');
                } else {
                  alert(isVi
                    ? `Đã gửi lệnh rút ${formatCurrency(sellerLedger.netRevenue, lang)} về tài khoản ngân hàng của bạn. Tiền sẽ về trong 5-10 phút!`
                    : `Withdrawal request for ${formatCurrency(sellerLedger.netRevenue, lang)} processed to your bank account!`);
                }
              }}
            >
              💳 {isVi ? 'Rút Tiền Về Tài Khoản Ngân Hàng' : 'Withdraw Funds to Bank Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
