import { useState, useEffect, useMemo, useRef } from 'react';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';
import BuyerSellerChatModal from '../Components/marketplace/BuyerSellerChatModal.jsx';
import ProductReviewSection from '../Components/marketplace/ProductReviewSection.jsx';
import {
  MARKET_CATEGORIES,
  PRODUCT_CONDITIONS,
  SHIPPING_CARRIERS,
  PLATFORM_VOUCHERS,
  INITIAL_MARKET_PRODUCTS,
} from '../data/marketplaceData.js';
import { getMarketplaceText } from '../data/marketplaceTranslations.js';
import { sendMarketplaceNotification } from '../hooks/useNotifications.js';
import './MarketplacePage.css';

const STORAGE_PRODUCTS_KEY = 'gx_marketplace_products_v4';
const STORAGE_ORDERS_KEY = 'gx_marketplace_orders_v3';
const STORAGE_VOUCHERS_KEY = 'gx_marketplace_saved_vouchers_v3';
const STORAGE_SELLER_KYC_KEY = 'gx_marketplace_seller_kyc_v3';
const STORAGE_ADMIN_TREASURY_KEY = 'gx_admin_fee_treasury_v1';

// Super Admin / Platform Regulator credentials
const ADMIN_EMAIL = 'phamanhhoang920@gmail.com';
const ADMIN_PUBLIC_ID = '63292076';

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

  // Kiểm tra tài khoản Super Admin (Chủ sàn GitXplore)
  const isAdmin = Boolean(
    (user?.identifier || user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    String(user?.publicId || user?.id || '') === ADMIN_PUBLIC_ID ||
    user?.role === 'admin'
  );

  // 1. Quản lý danh sách sản phẩm (Mặc định ban đầu trống - Người bán đăng tải qua Seller Central)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
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

  // Tự động đồng bộ sản phẩm & đơn hàng từ Supabase Cloud (với fallback localStorage)
  useEffect(() => {
    let isMounted = true;
    async function loadCloudData() {
      try {
        const { data: cloudProds, error: pErr } = await supabase
          .from('marketplace_products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!pErr && Array.isArray(cloudProds) && cloudProds.length > 0 && isMounted) {
          setProducts((prev) => {
            const map = new Map();
            cloudProds.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Supabase marketplace_products fetch fallback:', err);
      }

      try {
        const { data: cloudOrders, error: oErr } = await supabase
          .from('marketplace_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!oErr && Array.isArray(cloudOrders) && cloudOrders.length > 0 && isMounted) {
          setOrders((prev) => {
            const map = new Map();
            cloudOrders.forEach((o) => map.set(o.id, o));
            prev.forEach((o) => { if (!map.has(o.id)) map.set(o.id, o); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Supabase marketplace_orders fetch fallback:', err);
      }
    }

    loadCloudData();

    // Lắng nghe thay đổi sản phẩm theo thời gian thực (Realtime sync)
    const channel = supabase
      .channel('public:marketplace_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_products' }, (payload) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          setProducts((prev) => [payload.new, ...prev.filter((p) => p.id !== payload.new.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts((prev) => prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)));
        } else if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
  const [chatProduct, setChatProduct] = useState(null); // Trò chuyện trực tiếp Người mua <-> Người bán
  const [showPostModal, setShowPostModal] = useState(false); // Đăng bán sản phẩm (Seller Central)
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false); // Quản lý đơn hàng & Ví sàn
  const [ordersModalTab, setOrdersModalTab] = useState('buyer'); // 'buyer' | 'seller'
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false); // Két Phí Dịch Vụ & Quản Trị Super Admin

  // Quản lý Két Doanh Thu Thu Phí Dịch Vụ Sàn (2.5% Escrow Fee Vault)
  const [adminTreasury, setAdminTreasury] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ADMIN_TREASURY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      beneficiaryEmail: ADMIN_EMAIL,
      beneficiaryId: ADMIN_PUBLIC_ID,
      totalFeesCollected: 387500,
      transactions: [
        {
          id: 'TXN-FEE-88921',
          orderId: 'GX-ESC-50291',
          amount: 387500,
          rate: '2.5%',
          productTitle: 'MacBook Pro 14 M3 Pro 18GB/512GB (Fullbox)',
          timestamp: '2026-10-10T14:30:00.000Z',
        },
      ],
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ADMIN_TREASURY_KEY, JSON.stringify(adminTreasury));
    } catch {
      // ignore
    }
  }, [adminTreasury]);

  // Mở modal nếu có query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('post') === 'true') {
      if (isAdmin) {
        alert(txt('admin_no_post_notice'));
      } else {
        setShowPostModal(true);
      }
    }
  }, [isAdmin]);

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
      buyerName: user?.username || user?.name || (isVi ? 'Khách Hàng GitXplore' : 'GitXplore Customer'),
      ...orderData,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCheckoutProduct(null);
    setSelectedProduct(null);
    setOrdersModalTab('buyer');
    setShowMyOrdersModal(true);

    // Đồng bộ đơn hàng lên Supabase Cloud
    try {
      supabase.from('marketplace_orders').insert([{
        id: newOrder.id,
        product_id: newOrder.productId,
        product_title: newOrder.productTitle,
        total_amount: newOrder.totalAmount,
        status: newOrder.status,
        buyer_name: newOrder.buyerName,
        shipping_address: newOrder.shippingAddress,
        phone: newOrder.phone,
        created_at: newOrder.createdAt,
      }]).then(({ error }) => {
        if (error) console.warn('Supabase marketplace_orders insert note:', error.message);
      });
    } catch {}

    // Gửi thông báo thực tế tới TopNav notification bell
    sendMarketplaceNotification({
      title: isVi ? `🛡️ Đã nạp cọc Ký Quỹ Escrow: Đơn ${newOrder.id}` : `🛡️ Escrow Deposited: Order ${newOrder.id}`,
      message: isVi
        ? `Số tiền ${formatCurrency(newOrder.totalAmount, lang)} đã được bảo chứng an toàn tại Két Escrow GitXplore cho "${newOrder.productTitle}". Người bán đang chuẩn bị đóng gói!`
        : `Amount of ${formatCurrency(newOrder.totalAmount, lang)} is securely locked in Escrow for "${newOrder.productTitle}". Seller is preparing package.`,
      type: 'escrow',
      category: 'market',
      link: '/marketplace',
    });
  };

  // 11. Xử lý người mua bấm xác nhận hoàn tất & giải ngân
  const handleConfirmOrderReceived = (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const confirmMsg = isVi
      ? 'Bạn xác nhận đã nhận đúng sản phẩm, kiểm tra hoàn tất 48h và đồng ý giải ngân tiền cho Người Bán?'
      : 'Do you confirm that you have received and inspected the item, and agree to release funds to the Seller?';

    if (window.confirm(confirmMsg)) {
      const grossPrice = targetOrder.productPrice || targetOrder.totalAmount || 0;
      const fee2_5 = Math.round(grossPrice * 0.025);
      const tax1_5 = Math.round(grossPrice * 0.015);
      const sellerNet = grossPrice - fee2_5 - tax1_5;

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

      // Cập nhật Két Phí Dịch Vụ Admin Vault (phamanhhoang920@gmail.com)
      setAdminTreasury((prev) => ({
        ...prev,
        totalFeesCollected: (prev.totalFeesCollected || 0) + fee2_5,
        transactions: [
          {
            id: `TXN-FEE-${Date.now().toString().slice(-6)}`,
            orderId: targetOrder.id,
            amount: fee2_5,
            rate: '2.5%',
            productTitle: targetOrder.productTitle,
            timestamp: new Date().toISOString(),
          },
          ...(prev.transactions || []),
        ],
      }));

      // Bắn thông báo cho Người mua & Người bán
      sendMarketplaceNotification({
        title: isVi ? `✅ Giao dịch hoàn tất • Đã giải ngân: ${targetOrder.id}` : `✅ Order Completed • Payout Released: ${targetOrder.id}`,
        message: isVi
          ? `Đơn hàng "${targetOrder.productTitle}" đã hoàn tất 48h kiểm nghiệm. Người bán đã nhận ${formatCurrency(sellerNet, lang)} vào ví sàn!`
          : `Order "${targetOrder.productTitle}" completed 48h trial. Seller received ${formatCurrency(sellerNet, lang)} into wallet!`,
        type: 'wallet',
        category: 'market',
        link: '/marketplace',
      });

      // Bắn thông báo thu phí sàn 2.5% tới Super Admin phamanhhoang920@gmail.com
      sendMarketplaceNotification(
        {
          title: isVi ? `👑 Thu phí dịch vụ sàn 2.5%: Đơn ${targetOrder.id}` : `👑 Platform Fee Collected 2.5%: Order ${targetOrder.id}`,
          message: isVi
            ? `Sàn GitXplore đã thu phí dịch vụ ${formatCurrency(fee2_5, lang)} từ đơn ${targetOrder.id} và ghi có vào Két Doanh Thu của Super Admin (${ADMIN_EMAIL}).`
            : `GitXplore collected service fee ${formatCurrency(fee2_5, lang)} from order ${targetOrder.id} into Super Admin Vault (${ADMIN_EMAIL}).`,
          type: 'admin',
          category: 'market',
          link: '/marketplace',
        },
        ADMIN_EMAIL
      );
    }
  };

  // 12. Xử lý thêm sản phẩm mới (từ Seller Central)
  const handleAddNewProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    setShowPostModal(false);

    // Đồng bộ sản phẩm mới lên Supabase Cloud
    try {
      supabase.from('marketplace_products').insert([{
        id: newProd.id,
        sku: newProd.sku,
        title: newProd.title,
        title_en: newProd.title_en || newProd.title,
        category: newProd.category,
        category_name: newProd.categoryName,
        price: newProd.price,
        original_price: newProd.originalPrice,
        condition: newProd.condition,
        stock: newProd.stock,
        images: newProd.images,
        description: newProd.description,
        specs: newProd.specs,
        seller: newProd.seller,
        created_at: newProd.createdAt || new Date().toISOString(),
      }]).then(({ error }) => {
        if (error) console.warn('Supabase marketplace_products insert note:', error.message);
      });
    } catch {}

    // Gửi thông báo đăng sản phẩm thành công
    sendMarketplaceNotification({
      title: isVi ? `📦 Đã đăng bán sản phẩm mới lên sàn!` : `📦 New Product Listed on Marketplace!`,
      message: isVi
        ? `Sản phẩm "${newProd.title}" (Mã định danh GTIN/SKU: ${newProd.sku || 'Generic'}) đã được niêm yết công khai trên chợ GitXplore.`
        : `Product "${newProd.title}" (GTIN/SKU: ${newProd.sku || 'Generic'}) is now live on GitXplore marketplace.`,
      type: 'order',
      category: 'market',
      link: '/marketplace',
    });
  };

  // 13. Xử lý trọng tài giải quyết tranh chấp (Admin 48H Arbitration)
  const handleDisputeResolve = (orderId, resolution) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (resolution === 'release_to_seller') {
      handleConfirmOrderReceived(orderId);
    } else if (resolution === 'refund_buyer') {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'completed',
                statusLabel: isVi
                  ? 'Trọng tài hoàn tiền 100% cho Người Mua'
                  : 'Arbitration 100% refunded to Buyer',
              }
            : o
        )
      );

      sendMarketplaceNotification({
        title: isVi ? `↩ Hoàn tiền thành công: Đơn ${targetOrder.id}` : `↩ Refund Completed: Order ${targetOrder.id}`,
        message: isVi
          ? `Trọng tài Sàn GitXplore đã phê duyệt hoàn tiền ${formatCurrency(targetOrder.totalAmount, lang)} về tài khoản của bạn.`
          : `GitXplore Arbitration approved refund of ${formatCurrency(targetOrder.totalAmount, lang)} to your account.`,
        type: 'wallet',
        category: 'market',
        link: '/marketplace',
      });
    }
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
        {/* Super Admin Identity Banner */}
        {isAdmin && (
          <div className="mp-admin-badge-banner">
            <div className="mp-admin-info">
              <span className="mp-admin-pill">{txt('admin_badge')}</span>
              <span style={{ fontSize: '13px', color: '#fbcfe8' }}>
                <strong>{ADMIN_EMAIL}</strong> • ID: <strong>{ADMIN_PUBLIC_ID}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#fef08a' }}>
                💰 {txt('admin_fee_balance')} <strong>{formatCurrency(adminTreasury.totalFeesCollected, lang)}</strong>
              </span>
              <button
                type="button"
                className="mp-btn-admin-portal"
                onClick={() => setShowAdminModal(true)}
              >
                👑 {txt('admin_portal_btn')}
              </button>
            </div>
          </div>
        )}

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
          {isAdmin ? (
            <button
              type="button"
              className="mp-btn-post mp-btn-admin-portal"
              onClick={() => setShowAdminModal(true)}
            >
              <span>👑 {txt('admin_portal_btn')}</span>
            </button>
          ) : (
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
              <span>🚀 {txt('btn_open_seller_central')}</span>
            </button>
          )}

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

          {/* Quick Demo Catalog / Clear Catalog Toggle */}
          {products.length === 0 ? (
            <button
              type="button"
              className="mp-cat-pill"
              style={{ borderColor: '#f59e0b', color: '#fef08a', padding: '8px 14px' }}
              onClick={() => setProducts(INITIAL_MARKET_PRODUCTS)}
            >
              🎲 {txt('btn_load_demo_catalog')}
            </button>
          ) : (
            <button
              type="button"
              className="mp-cat-pill"
              style={{ borderColor: '#ef4444', color: '#fca5a5', padding: '8px 14px' }}
              onClick={() => {
                if (window.confirm(isVi ? 'Bạn có chắc muốn xóa tất cả sản phẩm về danh mục trống?' : 'Reset to empty catalog?')) {
                  setProducts([]);
                }
              }}
            >
              🗑️ {txt('btn_clear_to_empty')}
            </button>
          )}
        </div>
      </section>

      {/* ===== 7. PRODUCTS GRID ===== */}
      <section className="mp-products-section">
        {products.length === 0 ? (
          <div className="mp-empty-catalog-card">
            <div className="mp-empty-catalog-icon">🏪</div>
            <h3>{txt('empty_market_title')}</h3>
            <p>{txt('empty_market_desc')}</p>
            <div className="mp-empty-catalog-actions">
              <button
                type="button"
                className="mp-btn-post"
                onClick={() => {
                  if (isAdmin) {
                    alert(txt('admin_no_post_notice'));
                  } else if (!user) {
                    openModal('signin');
                  } else {
                    setShowPostModal(true);
                  }
                }}
              >
                <span>🚀 {txt('btn_open_seller_central')}</span>
              </button>
              <button
                type="button"
                className="mp-btn-orders"
                onClick={() => setProducts(INITIAL_MARKET_PRODUCTS)}
              >
                <span>🎲 {txt('btn_load_demo_catalog')}</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
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
          onOpenChat={(p) => setChatProduct(p)}
          onBuyNow={() => {
            const p = selectedProduct;
            setSelectedProduct(null);
            setCheckoutProduct(p);
          }}
        />
      )}

      {/* ===== MODAL CHAT TRỰC TIẾP NGƯỜI MUA <-> NGƯỜI BÁN ===== */}
      {chatProduct && (
        <BuyerSellerChatModal
          product={chatProduct}
          lang={lang}
          onClose={() => setChatProduct(null)}
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

      {/* ===== 10. MODAL SELLER CENTRAL (AMAZON & SHOPEE STANDARD LISTING) ===== */}
      {showPostModal && (
        <SellerCentralModal
          lang={lang}
          sellerKYC={sellerKYC}
          onOpenKYC={() => setShowKYCModal(true)}
          onClose={() => setShowPostModal(false)}
          onAddProduct={handleAddNewProduct}
        />
      )}

      {/* ===== 11. MODAL KÉT DOANH THU THU PHÍ DỊCH VỤ SÀN (SUPER ADMIN) ===== */}
      {showAdminModal && (
        <AdminTreasuryModal
          adminTreasury={adminTreasury}
          orders={orders}
          lang={lang}
          sellerKYC={sellerKYC}
          onClose={() => setShowAdminModal(false)}
          onDisputeResolve={handleDisputeResolve}
        />
      )}

      {/* ===== 12. MODAL XÁC THỰC KYC (LUẬT TMĐT 2025) ===== */}
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

      {/* ===== 13. DRAWER KÉT SẮT & ĐƠN HÀNG (MY ORDERS & SELLER CENTER) ===== */}
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
function ProductDetailModal({ product, lang, onClose, onBuyNow, onOpenChat }) {
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="mp-btn-detail"
                style={{
                  flex: '0 0 auto',
                  padding: '12px 18px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  color: '#fef08a',
                }}
                onClick={() => onOpenChat && onOpenChat(product)}
              >
                <span>💬</span>
                <span>{isVi ? 'Chat Với Người Bán' : 'Chat with Seller'}</span>
              </button>
              <button
                type="button"
                className="mp-btn-buy"
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                onClick={onBuyNow}
              >
                {isVi ? `Ký Quỹ & Đặt Hàng (${formatCurrency(product.price, lang)})` : `Place Escrow Order (${formatCurrency(product.price, lang)})`}
              </button>
            </div>

            {/* Đánh Giá & Nhận Xét Từ Người Mua */}
            <ProductReviewSection productId={product.id} lang={lang} />
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

          {/* Cổng thanh toán mã VietQR tự động */}
          <div style={{ background: 'linear-gradient(135deg, rgba(20, 28, 46, 0.9), rgba(14, 19, 31, 0.95))', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13.5px', color: '#fef08a', fontWeight: 800, marginBottom: '10px' }}>
              <span>🏦</span>
              <span>{isVi ? 'Quét Mã VietQR Chuyển Khoản Ký Quỹ Tức Thì' : 'Scan VietQR for Instant Escrow Deposit'}</span>
            </div>

            <div style={{ display: 'inline-block', background: '#ffffff', padding: '10px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', marginBottom: '12px' }}>
              <img
                src={`https://img.vietqr.io/image/MB-0348736111-compact2.png?amount=${totalEscrowDeposit}&addInfo=GX_ESC_${product.id.slice(-6)}&accountName=GITXPLORE%20ESCROW%20VAULT`}
                alt="VietQR MBBank"
                style={{ width: '190px', height: 'auto', display: 'block' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', textAlign: 'left', background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Ngân hàng: </span>
                <strong style={{ color: '#ffffff' }}>MB Bank (Quân Đội)</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Số TK: </span>
                <strong style={{ color: '#fef08a' }}>0348736111</strong>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText('0348736111'); alert(isVi ? 'Đã sao chép số tài khoản!' : 'Copied account number!'); }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginLeft: '6px', fontSize: '11px', textDecoration: 'underline' }}
                >
                  {isVi ? 'Sao chép' : 'Copy'}
                </button>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Chủ TK: </span>
                <strong style={{ color: '#ffffff' }}>GITXPLORE ESCROW</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Nội dung: </span>
                <strong style={{ color: '#38bdf8' }}>{`GX_ESC_${product.id.slice(-6)}`}</strong>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(`GX_ESC_${product.id.slice(-6)}`); alert(isVi ? 'Đã sao chép nội dung chuyển khoản!' : 'Copied memo!'); }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginLeft: '6px', fontSize: '11px', textDecoration: 'underline' }}
                >
                  {isVi ? 'Sao chép' : 'Copy'}
                </button>
              </div>
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
   SUB-COMPONENT: SELLER CENTRAL MODAL (AMAZON & SHOPEE FLOW)
======================================================== */
function SellerCentralModal({ lang, sellerKYC, onOpenKYC, onClose, onAddProduct }) {
  const isVi = lang === 'vi';
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // 5-Step Wizard Navigation
  const [step, setStep] = useState(1);

  // Form states
  const [isNewToCatalog, setIsNewToCatalog] = useState(true);
  const [sku, setSku] = useState('GTIN-' + Math.floor(100000 + Math.random() * 900000));
  const [category, setCategory] = useState('components-circuits');
  const [brand, setBrand] = useState('');
  const [modelOrCpu, setModelOrCpu] = useState('');

  const [title, setTitle] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState('brand_new');
  const [stock, setStock] = useState('1');
  const [isFeatured, setIsFeatured] = useState(false);

  const [fulfillmentType, setFulfillmentType] = useState('FBM'); // 'FBM' | 'FBS'
  const [specWarranty, setSpecWarranty] = useState('12 tháng chính hãng');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Dự toán đối soát phí sàn 2.5% + Thuế 1.5%
  const numPrice = Number(price) || 0;
  const estimatedFee = Math.round(numPrice * 0.025);
  const estimatedTax = Math.round(numPrice * 0.015);
  const estimatedReceive = numPrice - estimatedFee - estimatedTax;

  // Upload file từ máy
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

  const handleFinalSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !numPrice) {
      alert(isVi ? 'Vui lòng điền đầy đủ tiêu đề sản phẩm và giá bán!' : 'Please enter product title and price!');
      setStep(1);
      return;
    }

    const catObj = MARKET_CATEGORIES.find((c) => c.id === category);
    const rawImgs = imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalImages = rawImgs.length > 0 ? rawImgs : ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'];

    const specs = {};
    if (sku) specs[isVi ? 'Mã định danh GTIN/SKU' : 'GTIN/SKU'] = sku;
    if (brand) specs[isVi ? 'Thương hiệu' : 'Brand'] = brand;
    if (modelOrCpu) specs[isVi ? 'Model / Vi xử lý' : 'Processor / Model'] = modelOrCpu;
    if (specWarranty) specs[isVi ? 'Bảo hành' : 'Warranty'] = specWarranty;
    specs[isVi ? 'Hình thức hoàn thiện' : 'Fulfillment'] = fulfillmentType === 'FBM' ? 'FBM (Người bán tự giao)' : 'FBS (GitXplore Fulfillment)';

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: sku || `GENERIC-${Math.floor(100000 + Math.random() * 900000)}`,
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
      deliveryType: condition === 'digital_license' || fulfillmentType === 'FBS' ? 'digital' : 'physical',
      fulfillmentType,
      images: finalImages,
      description,
      keywords,
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
      <div className="mp-modal-box" style={{ maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        {/* Header Seller Central */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
              🏪 {getMarketplaceText(lang, 'seller_central_title')}
            </h2>
            <small style={{ color: '#94a3b8' }}>
              {getMarketplaceText(lang, 'seller_central_subtitle')}
            </small>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#fef08a', padding: '4px 10px', borderRadius: '8px' }}>
            ⚡ {isVi ? 'Phí Sàn Trung Gian: 2.5%' : 'Platform Intermediary Fee: 2.5%'}
          </span>
        </div>

        {/* KYC Compliance Status Banner */}
        <div style={{ background: sellerKYC?.isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid', borderColor: sellerKYC?.isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <strong style={{ color: sellerKYC?.isVerified ? '#34d399' : '#f87171', fontSize: '13px' }}>
              {sellerKYC?.isVerified
                ? (isVi ? '✓ Người Bán Đã Xác Thực KYC (Luật TMĐT 2025)' : '✓ Verified Seller KYC (E-Commerce Law)')
                : (isVi ? '⚠️ Bắt buộc định danh KYC để nhận tiền giải ngân' : '⚠️ KYC Identity Required for Payouts')}
            </strong>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              {isVi ? `Chủ Shop: ${sellerKYC.fullName} • MST: ${sellerKYC.taxCode}` : `Owner: ${sellerKYC.fullName} • Tax Code: ${sellerKYC.taxCode}`}
            </div>
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

        {/* Steps Bar */}
        <div className="mp-seller-steps-bar">
          <button
            type="button"
            className={`mp-step-tab ${step === 1 ? 'is-active' : ''}`}
            onClick={() => setStep(1)}
          >
            1. {isVi ? 'Danh mục & Mã GTIN' : 'Catalog & GTIN'}
          </button>
          <button
            type="button"
            className={`mp-step-tab ${step === 2 ? 'is-active' : ''}`}
            onClick={() => setStep(2)}
          >
            2. {isVi ? 'Tiêu đề & Hình ảnh' : 'Title & Media'}
          </button>
          <button
            type="button"
            className={`mp-step-tab ${step === 3 ? 'is-active' : ''}`}
            onClick={() => setStep(3)}
          >
            3. {isVi ? 'Ưu đãi & Giá bán' : 'Offer & Pricing'}
          </button>
          <button
            type="button"
            className={`mp-step-tab ${step === 4 ? 'is-active' : ''}`}
            onClick={() => setStep(4)}
          >
            4. {isVi ? 'Hoàn thiện (FBM/FBS)' : 'Fulfillment'}
          </button>
          <button
            type="button"
            className={`mp-step-tab ${step === 5 ? 'is-active' : ''}`}
            onClick={() => setStep(5)}
          >
            5. {isVi ? 'Đối soát & Niêm yết' : 'Review & Publish'}
          </button>
        </div>

        {/* STEP 1: Catalog & Product Identity */}
        {step === 1 && (
          <div className="mp-step-content">
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#7dd3fc', fontWeight: 700, fontSize: '13.5px' }}>
                <input
                  type="checkbox"
                  checked={isNewToCatalog}
                  onChange={(e) => setIsNewToCatalog(e.target.checked)}
                />
                <span>✓ {isVi ? 'Tôi đang thêm một sản phẩm chưa từng bán trên GitXplore' : 'I am adding a product not sold on GitXplore'}</span>
              </label>
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                {isVi
                  ? 'Quy trình chuẩn Amazon: Thiết lập danh mục listing mới cho thiết bị phần cứng, linh kiện DIY hoặc key bản quyền số.'
                  : 'Amazon Standard: Setup brand new catalog listing for hardware, DIY components, or digital AI licenses.'}
              </small>
            </div>

            <div className="mp-form-grid">
              <div className="mp-form-group">
                <label>{isVi ? 'Mã định danh sản phẩm (GTIN / UPC / EAN / Generic) (*):' : 'Product Identifier (GTIN / UPC / EAN / Generic) (*):'}</label>
                <input
                  type="text"
                  required
                  placeholder={isVi ? 'Ví dụ: 8935212345678 hoặc Generic' : 'e.g., 8935212345678 or Generic'}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
                <small style={{ color: '#94a3b8' }}>
                  {isVi ? 'Nếu sản phẩm tự chế, đồ cũ hoặc không có mã vạch, có thể nhập "Generic".' : 'If handmade, pre-owned or barcode-exempt, enter "Generic".'}
                </small>
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Ngành hàng điện tử (*):' : 'Electronics Category (*):'}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {MARKET_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {getMarketplaceText(lang, c.key) || c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Thương hiệu / Hãng sản xuất:' : 'Brand / Manufacturer:'}</label>
                <input
                  type="text"
                  placeholder={isVi ? 'Ví dụ: Apple, Sony, ESPRESSIF, Yamaha, NVIDIA...' : 'e.g., Apple, Sony, ESPRESSIF, Yamaha...'}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Model thiết bị / Vi xử lý:' : 'Model / Processor:'}</label>
                <input
                  type="text"
                  placeholder={isVi ? 'Ví dụ: ESP32-S3 Dual-Core, Apple M3, Core i7-14700K...' : 'e.g., ESP32-S3, Apple M3, Core i7...'}
                  value={modelOrCpu}
                  onChange={(e) => setModelOrCpu(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="mp-btn-post"
                onClick={() => setStep(2)}
              >
                {isVi ? 'Tiếp Tục: Tiêu Đề & Hình Ảnh ➔' : 'Next: Title & Media ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Title, Media & Description */}
        {step === 2 && (
          <div className="mp-step-content">
            <div className="mp-form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>{isVi ? 'Tiêu đề sản phẩm (Title - Tối đa 200 ký tự) (*):' : 'Product Title (Max 200 chars) (*):'}</label>
                <span style={{ fontSize: '12px', color: title.length > 180 ? '#f87171' : '#94a3b8' }}>{title.length}/200</span>
              </div>
              <input
                type="text"
                required
                maxLength={200}
                placeholder={isVi ? 'Viết hoa chữ cái đầu: Ví dụ: MacBook Pro 14 M3 Pro 18GB/512GB Xám Không Gian (Fullbox)' : 'Capitalize each word: e.g., MacBook Pro 14 M3 Pro 18GB Space Gray (Fullbox)'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mp-form-group" style={{ marginBottom: '14px' }}>
              <label>{isVi ? 'Hình ảnh sản phẩm (Nền trắng rõ nét 500x500 hoặc 1000x1000) (*):' : 'Product Images (White background 500x500 or 1000x1000) (*):'}</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.15))',
                    border: '1px solid #f59e0b',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: '#fef08a',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>📷</span>
                  <span>{isVi ? 'Chọn ảnh từ thiết bị / máy tính' : 'Upload from device'}</span>
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

              {/* Gallery of Uploaded Photos */}
              {imageUrls.trim() && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                  {imageUrls.split('\n').filter(Boolean).map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <img src={img.trim()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => {
                          const lines = imageUrls.split('\n').filter((_, i) => i !== idx);
                          setImageUrls(lines.join('\n'));
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'grid',
                          placeItems: 'center',
                          padding: 0,
                        }}
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                rows="2"
                placeholder={isVi ? 'Dán link ảnh URL hoặc tải thêm ảnh từ máy tính...' : 'Paste image URLs or uploaded files (one per line)...'}
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
              />
            </div>

            <div className="mp-form-group" style={{ marginBottom: '14px' }}>
              <label>{isVi ? 'Mô tả chi tiết sản phẩm:' : 'Product Description:'}</label>
              <textarea
                rows="3"
                placeholder={isVi ? 'Mô tả công năng, ngoại hình trầy xước, phụ kiện đi kèm...' : 'Describe technical features, cosmetics, included accessories...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mp-form-group">
              <label>{isVi ? 'Từ khóa tìm kiếm (Search Keywords - cách nhau dấu phẩy):' : 'Search Keywords (comma separated):'}</label>
              <input
                type="text"
                placeholder={isVi ? 'laptop cu, macbook m3, esp32, piano dien...' : 'macbook, esp32 ai, gaming laptop...'}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="mp-btn-detail"
                onClick={() => setStep(1)}
              >
                ⬅ {isVi ? 'Quay Lại' : 'Back'}
              </button>
              <button
                type="button"
                className="mp-btn-post"
                onClick={() => setStep(3)}
              >
                {isVi ? 'Tiếp Tục: Ưu Đãi & Giá Bán ➔' : 'Next: Offer & Price ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Offer & Pricing */}
        {step === 3 && (
          <div className="mp-step-content">
            <div className="mp-form-grid">
              <div className="mp-form-group">
                <label>{isVi ? 'Giá bán niêm yết (Gross Price - VND) (*):' : 'Selling Price (VND) (*):'}</label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="10000"
                  placeholder="Ví dụ: 3500000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Giá gốc thị trường (nếu có giảm giá):' : 'Original Price (if discounted):'}</label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  placeholder="Ví dụ: 4500000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Tình trạng sản phẩm (*):' : 'Item Condition (*):'}</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="brand_new">{getMarketplaceText(lang, 'cond_brand_new')}</option>
                  <option value="like_new">{getMarketplaceText(lang, 'cond_like_new')}</option>
                  <option value="used">{getMarketplaceText(lang, 'cond_used')}</option>
                  <option value="digital_license">{getMarketplaceText(lang, 'cond_digital')}</option>
                </select>
              </div>

              <div className="mp-form-group">
                <label>{isVi ? 'Số lượng tồn kho (Units):' : 'Stock Quantity:'}</label>
                <input
                  type="number"
                  min="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div className="mp-form-group is-full">
                <label>{isVi ? 'Chính sách bảo hành / Cam kết đổi trả:' : 'Warranty & Guarantee Policy:'}</label>
                <input
                  type="text"
                  placeholder={isVi ? 'Ví dụ: 12 tháng chính hãng / Bao test 7 ngày 1 đổi 1' : 'e.g., 12 months warranty / 7-day money back'}
                  value={specWarranty}
                  onChange={(e) => setSpecWarranty(e.target.value)}
                />
              </div>

              <div className="mp-form-group is-full" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: '12px', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fef08a' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span>👑 {isVi ? 'Đẩy tin VIP Lên Đầu Trang (+15.000₫ phí đẩy tin)' : 'VIP Featured Boost (+15,000₫ ads fee)'}</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="mp-btn-detail"
                onClick={() => setStep(2)}
              >
                ⬅ {isVi ? 'Quay Lại' : 'Back'}
              </button>
              <button
                type="button"
                className="mp-btn-post"
                onClick={() => setStep(4)}
              >
                {isVi ? 'Tiếp Tục: Kênh Vận Chuyển ➔' : 'Next: Fulfillment ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Fulfillment Channel (FBM vs FBS) */}
        {step === 4 && (
          <div className="mp-step-content">
            <h4 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: '15px' }}>
              {isVi ? 'Chọn Hình Thức Hoàn Thiện Đơn Hàng (Fulfillment Channel):' : 'Select Fulfillment Channel:'}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  background: fulfillmentType === 'FBM' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                  border: '1.5px solid',
                  borderColor: fulfillmentType === 'FBM' ? '#38bdf8' : 'rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => setFulfillmentType('FBM')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>📦</span>
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                      FBM (Fulfillment by Merchant)
                    </strong>
                    <small style={{ color: '#38bdf8' }}>{isVi ? 'Người bán tự đóng gói' : 'Merchant self-pack'}</small>
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  {isVi
                    ? 'Bạn tự lưu kho hàng tại nhà/shop, khi có đơn sẽ đóng gói và bàn giao cho các hãng vận chuyển (GHN, Viettel Post, Hỏa tốc 2H).'
                    : 'You store inventory in your warehouse. When an order arrives, you pack and hand it to integrated couriers.'}
                </p>
              </div>

              <div
                style={{
                  background: fulfillmentType === 'FBS' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                  border: '1.5px solid',
                  borderColor: fulfillmentType === 'FBS' ? '#10b981' : 'rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => setFulfillmentType('FBS')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block' }}>
                      FBS (Fulfillment by GitXplore)
                    </strong>
                    <small style={{ color: '#10b981' }}>{isVi ? 'Sàn phân phối / Key số' : 'Platform Fulfilled'}</small>
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  {isVi
                    ? 'Gửi hàng vào trung tâm điều phối của GitXplore, hoặc tự động phát hành license key phần mềm / mã kích hoạt AI trực tuyến tức thì.'
                    : 'Stock in GitXplore hub or deliver instant digital software/AI license keys directly through platform automation.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="mp-btn-detail"
                onClick={() => setStep(3)}
              >
                ⬅ {isVi ? 'Quay Lại' : 'Back'}
              </button>
              <button
                type="button"
                className="mp-btn-post"
                onClick={() => setStep(5)}
              >
                {isVi ? 'Tiếp Tục: Đối Soát Biểu Phí ➔' : 'Next: Review & Fee Preview ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Publish */}
        {step === 5 && (
          <div className="mp-step-content">
            <h4 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: '15px' }}>
              {isVi ? 'Bảng Kê Đối Soát Doanh Thu & Niêm Yết Sàn (2.5% Phí Sàn):' : 'Financial Settlement & Listing Review:'}
            </h4>

            {/* Bảng kê đối soát tài chính */}
            <div style={{ background: '#0a0810', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', marginBottom: '16px', fontSize: '13.5px' }}>
              <div className="mp-calc-row">
                <span>{isVi ? 'Tiêu đề sản phẩm:' : 'Product Listing:'}</span>
                <strong style={{ color: '#fef08a' }}>{title || (isVi ? '(Chưa đặt)' : '(Untitled)')}</strong>
              </div>
              <div className="mp-calc-row">
                <span>{isVi ? 'Mã định danh GTIN/SKU:' : 'GTIN/SKU:'}</span>
                <strong>{sku}</strong>
              </div>
              <div className="mp-calc-row">
                <span>{isVi ? 'Giá bán niêm yết cho khách:' : 'Gross price:'}</span>
                <strong style={{ color: '#ffffff' }}>{formatCurrency(numPrice, lang)}</strong>
              </div>
              <div className="mp-calc-row" style={{ color: '#ef4444' }}>
                <span>{isVi ? 'Phí dịch vụ trung gian sàn GitXplore (2.5%):' : 'Platform fee (2.5%):'}</span>
                <strong>- {formatCurrency(estimatedFee, lang)}</strong>
              </div>
              <div className="mp-calc-row" style={{ color: '#f59e0b' }}>
                <span>{isVi ? 'Thuế khấu trừ tại nguồn (1.5% - NĐ 117/2025/NĐ-CP):' : 'Tax withholding (1.5%):'}</span>
                <strong>- {formatCurrency(estimatedTax, lang)}</strong>
              </div>
              <div className="mp-calc-row is-receive" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span>{isVi ? 'Người bán thực nhận về Ví Sàn sau 48h kiểm nghiệm:' : 'Net payout to seller wallet after 48h inspection:'}</span>
                <strong style={{ color: '#10b981', fontSize: '16px' }}>{formatCurrency(estimatedReceive, lang)}</strong>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '14px 0', cursor: 'pointer', fontSize: '12.5px', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <span>
                {isVi
                  ? 'Tôi cam kết thông tin kỹ thuật chính xác, hàng hóa hợp pháp theo Luật Thương mại điện tử 2025 và chấp hành quy định tạm giữ ký quỹ Két Sắt Escrow 48h để bảo vệ quyền lợi người mua.'
                  : 'I agree to the 2025 E-Commerce Regulations and the 48-Hour Escrow inspection protection policy of GitXplore.'}
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="mp-btn-detail"
                onClick={() => setStep(4)}
              >
                ⬅ {isVi ? 'Quay Lại Chỉnh Sửa' : 'Back'}
              </button>
              <button
                type="button"
                className="mp-btn-post"
                disabled={!agreedTerms}
                onClick={handleFinalSubmit}
                style={{ padding: '14px 28px', fontSize: '15px' }}
              >
                🚀 {isVi ? 'Niêm Yết Lên Sàn GitXplore Ngay' : 'Publish Product to Marketplace Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================
   SUB-COMPONENT: ADMIN TREASURY & PLATFORM PORTAL MODAL
   Account: phamanhhoang920@gmail.com (ID: 63292076)
======================================================== */
function AdminTreasuryModal({ adminTreasury, orders, lang, sellerKYC, onClose, onDisputeResolve }) {
  const isVi = lang === 'vi';
  const [adminTab, setAdminTab] = useState('treasury'); // 'treasury' | 'kyc_moderation' | 'arbitration'

  const completedOrders = orders.filter((o) => o.status === 'completed');
  const disputedOrders = orders.filter((o) => o.status === 'disputed' || o.status === 'locked_escrow' || o.status === 'delivered_testing');

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal-box" style={{ maxWidth: '920px' }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mp-modal-close" onClick={onClose}>✕</button>

        {/* Super Admin Identity Badge */}
        <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(236,72,153,0.5)', padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>👑</span>
              <strong style={{ fontSize: '16px', color: '#fbcfe8' }}>
                {isVi ? 'TÀI KHOẢN CHỦ SÀN / SUPER ADMIN' : 'PLATFORM OWNER / SUPER ADMIN'}
              </strong>
              <span className="mp-admin-pill">ID: 63292076</span>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              <strong>phamanhhoang920@gmail.com</strong> • {isVi ? 'Đơn vị trung gian hưởng 2.5% phí dịch vụ toàn sàn' : 'Platform Intermediary 2.5% Fee Beneficiary'}
            </div>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', color: '#fef08a' }}>
            🔒 {isVi ? 'Chế độ Trung lập: Không được đăng bán hàng' : 'Neutrality: Listing Restricted'}
          </span>
        </div>

        {/* Treasury Highlight Banner */}
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{getMarketplaceText(lang, 'admin_fee_balance')}</span>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#10b981', margin: '6px 0' }}>
              {formatCurrency(adminTreasury.totalFeesCollected, lang)}
            </h2>
            <small style={{ color: '#cbd5e1' }}>
              {isVi ? 'Tự động trích 2.5% từ mọi giao dịch Escrow hoàn tất trên sàn' : 'Auto-deducted 2.5% from all completed marketplace escrow orders'}
            </small>
          </div>
          <button
            type="button"
            className="mp-btn-buy"
            style={{ padding: '12px 20px', fontSize: '14px' }}
            onClick={() => {
              alert(isVi
                ? `Lệnh rút quỹ phí sàn ${formatCurrency(adminTreasury.totalFeesCollected, lang)} đã được gửi tới tài khoản ngân hàng của Super Admin phamanhhoang920@gmail.com!`
                : `Platform fee payout ${formatCurrency(adminTreasury.totalFeesCollected, lang)} dispatched to Super Admin bank account (phamanhhoang920@gmail.com)!`);
            }}
          >
            💳 {isVi ? 'Rút Tiền Phí Về Ngân Hàng Super Admin' : 'Withdraw Fees to Admin Account'}
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '18px' }}>
          <button
            type="button"
            className={`mp-cat-pill ${adminTab === 'treasury' ? 'is-active' : ''}`}
            onClick={() => setAdminTab('treasury')}
          >
            💰 {isVi ? 'Sổ Cái Thu Phí Dịch Vụ 2.5%' : '2.5% Fee Treasury Ledger'} ({adminTreasury.transactions?.length || 0})
          </button>
          <button
            type="button"
            className={`mp-cat-pill ${adminTab === 'kyc_moderation' ? 'is-active' : ''}`}
            onClick={() => setAdminTab('kyc_moderation')}
          >
            📋 {isVi ? 'Kiểm Duyệt KYC Người Bán (Luật 2025)' : 'Seller KYC & Moderation'}
          </button>
          <button
            type="button"
            className={`mp-cat-pill ${adminTab === 'arbitration' ? 'is-active' : ''}`}
            onClick={() => setAdminTab('arbitration')}
          >
            ⚖️ {isVi ? 'Trọng Tài Giải Quyết Tranh Chấp 48H' : '48H Dispute Arbitration'} ({disputedOrders.length})
          </button>
        </div>

        {/* Tab 1: Sổ cái thu phí */}
        {adminTab === 'treasury' && (
          <div>
            <div style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '12px' }}>
              {isVi ? 'Lịch sử dòng tiền 2.5% phí dịch vụ trung gian ghi có vào ví phamanhhoang920@gmail.com:' : 'Intermediary 2.5% fee transaction history credited to phamanhhoang920@gmail.com:'}
            </div>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {(adminTreasury.transactions || []).map((txn) => (
                <div
                  key={txn.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', marginBottom: '8px' }}
                >
                  <div>
                    <strong style={{ color: '#fef08a', fontSize: '13px' }}>{txn.id} • {txn.orderId}</strong>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>{txn.productTitle}</div>
                    <small style={{ color: '#94a3b8' }}>{new Date(txn.timestamp).toLocaleString(isVi ? 'vi-VN' : 'en-US')}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#10b981', fontSize: '15px' }}>+{formatCurrency(txn.amount, lang)}</strong>
                    <div style={{ fontSize: '11px', color: '#f59e0b' }}>{isVi ? 'Phí sàn 2.5%' : '2.5% Fee'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: KYC & Moderation */}
        {adminTab === 'kyc_moderation' && (
          <div>
            <h4 style={{ margin: '0 0 10px', color: '#fff', fontSize: '15px' }}>
              {isVi ? 'Danh Sách Người Bán Đã Định Danh Theo Luật TMĐT 2025:' : 'Registered Sellers under E-Commerce Law 2025:'}
            </h4>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <strong style={{ color: '#ffffff', fontSize: '14px' }}>{sellerKYC?.fullName || 'Vũ Minh Tuấn'}</strong>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    CCCD/Hộ chiếu: <strong>{sellerKYC?.idNumber || '001095012345'}</strong> • MST: <strong>{sellerKYC?.taxCode || '8392019482'}</strong>
                  </div>
                </div>
                <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                  ✓ ĐÃ XÁC THỰC KYC
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>
                {isVi ? 'Tuân thủ Nghị định 117/2025/NĐ-CP: Sàn GitXplore đã lưu trữ hồ sơ và tự động khấu trừ 1.5% thuế TNCN/GTGT khi giải ngân đơn hàng.' : 'Compliant with statutory regulations: GitXplore stores identity records and withholds 1.5% tax upon disbursement.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Arbitration */}
        {adminTab === 'arbitration' && (
          <div>
            <h4 style={{ margin: '0 0 10px', color: '#fff', fontSize: '15px' }}>
              {isVi ? 'Đơn Hàng Đang Giữ Ký Quỹ & Trọng Tài Sàn:' : 'Active Escrow Orders & Platform Arbitration:'}
            </h4>
            {disputedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                ⚖️ {isVi ? 'Hiện không có đơn hàng nào bị khiếu nại hoặc tranh chấp.' : 'No disputed orders currently.'}
              </div>
            ) : (
              disputedOrders.map((o) => (
                <div
                  key={o.id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#fef08a' }}>{o.id} • {o.productTitle}</strong>
                    <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 800 }}>{o.statusLabel}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '10px' }}>
                    {isVi ? 'Tổng tiền ký quỹ:' : 'Escrow Amount:'} <strong>{formatCurrency(o.totalAmount, lang)}</strong> • {isVi ? 'Người mua:' : 'Buyer:'} {o.buyerName}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="mp-btn-buy"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        onDisputeResolve(o.id, 'release_to_seller');
                        alert(isVi ? `Trọng tài đã giải ngân tiền cho Người Bán đơn ${o.id}!` : `Arbitration released funds to Seller for ${o.id}!`);
                      }}
                    >
                      ✓ {isVi ? 'Phán quyết: Giải ngân cho Người Bán' : 'Release to Seller'}
                    </button>
                    <button
                      type="button"
                      className="mp-btn-detail"
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#fca5a5' }}
                      onClick={() => {
                        onDisputeResolve(o.id, 'refund_buyer');
                        alert(isVi ? `Trọng tài đã hoàn tiền 100% cho Người Mua đơn ${o.id}!` : `Arbitration refunded 100% to Buyer for ${o.id}!`);
                      }}
                    >
                      ↩ {isVi ? 'Phán quyết: Hoàn tiền cho Người Mua' : 'Refund to Buyer'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
