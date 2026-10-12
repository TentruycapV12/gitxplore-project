/**
 * Dữ liệu Sàn Thương Mại Điện Tử & Trung Gian Ký Quỹ GitXplore (Electronics Mega-Marketplace)
 * Vận hành chuẩn mô hình Shopee / Lazada:
 * - Bao quát TOÀN BỘ sản phẩm điện tử, công nghệ, gia dụng thông minh, vi mạch, phụ kiện và tài nguyên số.
 * - Mô hình 3 bên: Người bán (Seller) - Người mua (Buyer) - Sàn GitXplore trung gian (Escrow Vault).
 * - Hệ thống Voucher giảm giá, Flash Sale theo giờ, và lựa chọn Đơn vị vận chuyển (Logistics).
 */

// 1. Phổ danh mục TOÀN BỘ THIẾT BỊ ĐIỆN TỬ
export const MARKET_CATEGORIES = [
  { id: 'all', key: 'cat_all', label: 'Tất cả thiết bị điện tử', icon: '🌐', count: 48 },
  { id: 'phones-tablets', key: 'cat_phones', label: 'Điện thoại & Tablet', icon: '📱', count: 8 },
  { id: 'computers-laptops', key: 'cat_computers', label: 'Máy tính, Laptop & PC', icon: '💻', count: 9 },
  { id: 'components-circuits', key: 'cat_components', label: 'Vi mạch, Bán dẫn & IoT', icon: '🔌', count: 12 },
  { id: 'pc-parts', key: 'cat_pc_parts', label: 'Linh kiện PC & Phần cứng', icon: '⚙️', count: 7 },
  { id: 'audio-music', key: 'cat_audio', label: 'Âm thanh & Nhạc cụ điện tử', icon: '🎧', count: 6 },
  { id: 'smart-home', key: 'cat_smarthome', label: 'Smarthome & Điện gia dụng', icon: '🏠', count: 5 },
  { id: 'displays-tv', key: 'cat_displays', label: 'Tivi & Màn hình 4K', icon: '📺', count: 4 },
  { id: 'cameras-drones', key: 'cat_cameras', label: 'Máy ảnh & Flycam số', icon: '📷', count: 4 },
  { id: 'wearables', key: 'cat_wearables', label: 'Smartwatch & Thiết bị đeo', icon: '⌚', count: 3 },
  { id: 'network-telecom', key: 'cat_network', label: 'Thiết bị mạng & Router', icon: '📡', count: 4 },
  { id: 'ai-software', key: 'cat_ai', label: 'Công cụ AI & Bản quyền số', icon: '🤖', count: 8 },
  { id: 'accessories-cables', key: 'cat_accessories', label: 'Phụ kiện, Củ sạc & Pin', icon: '🔋', count: 6 },
  { id: 'diy-tools', key: 'cat_tools', label: 'Máy hàn & Thiết bị đo điện', icon: '🛠️', count: 4 },
];

// 2. Tình trạng sản phẩm
export const PRODUCT_CONDITIONS = {
  brand_new: { key: 'cond_brand_new', label: 'Mới 100% (Fullbox)', label_en: 'Brand New 100% (Fullbox)', color: '#10b981' },
  like_new: { key: 'cond_like_new', label: 'Like New 99%', label_en: 'Like New 99%', color: '#38bdf8' },
  used: { key: 'cond_used', label: 'Đã qua sử dụng (90-95%)', label_en: 'Pre-owned (Used)', color: '#f59e0b' },
  digital_license: { key: 'cond_digital', label: 'Key bản quyền số (Online)', label_en: 'Digital License Key', color: '#ec4899' },
};

// 3. Đơn vị vận chuyển logistics
export const SHIPPING_CARRIERS = [
  {
    id: 'express_2h',
    name: 'Hỏa Tốc 2H (AhaMove / GrabExpress)',
    name_en: '2H Express (AhaMove / GrabExpress)',
    fee: 45000,
    time: 'Giao trong 2 giờ (Nội thành)',
    time_en: '2 hours delivery (Inner city)',
    icon: '⚡',
  },
  {
    id: 'fast_ghn',
    name: 'Giao Hàng Nhanh (GHN / Viettel Post)',
    name_en: 'Fast Courier (GHN / Viettel Post)',
    fee: 25000,
    time: '1 - 2 ngày làm việc',
    time_en: '1 - 2 business days',
    icon: '🚚',
  },
  {
    id: 'economy_vnpost',
    name: 'Tiết Kiệm (Bưu Điện VNPost)',
    name_en: 'Economy Postal (VNPost)',
    fee: 15000,
    time: '3 - 5 ngày làm việc',
    time_en: '3 - 5 business days',
    icon: '📦',
  },
  {
    id: 'instant_digital',
    name: 'Bàn Giao Kỹ Thuật Số (Trực Tuyến)',
    name_en: 'Instant Digital Key Delivery',
    fee: 0,
    time: 'Kích hoạt ngay trong 5 phút',
    time_en: 'Instant activation within 5 mins',
    icon: '🔑',
  },
];

// 4. Kho Voucher Sàn GitXplore (Shopee / Lazada Voucher Hub)
export const PLATFORM_VOUCHERS = [
  {
    code: 'FREESHIP',
    label: 'Freeship Xtra Toàn Quốc',
    discountType: 'fixed',
    discountValue: 25000,
    minOrder: 300000,
    desc: 'Giảm 25.000₫ phí vận chuyển cho đơn từ 300K',
    tag: 'VẬN CHUYỂN',
    color: '#10b981',
  },
  {
    code: 'TECH50K',
    label: 'Voucher Công Nghệ Tân Thủ',
    discountType: 'fixed',
    discountValue: 50000,
    minOrder: 500000,
    desc: 'Giảm 50.000₫ trực tiếp cho đơn từ 500K',
    tag: 'GIẢM GIÁ',
    color: '#f59e0b',
  },
  {
    code: 'AIELITE',
    label: 'Đặc Quyền Vibe & AI Tools',
    discountType: 'percent',
    discountPercent: 10,
    maxDiscount: 150000,
    minOrder: 800000,
    desc: 'Giảm 10% (tối đa 150K) cho key AI & Bản quyền',
    tag: 'AI PRO',
    color: '#ec4899',
  },
  {
    code: 'ESCROW100',
    label: 'Két Sắt An Toàn VIP',
    discountType: 'fixed',
    discountValue: 100000,
    minOrder: 2000000,
    desc: 'Giảm 100.000₫ cho đơn điện máy, PC trên 2 triệu',
    tag: 'ĐẠI TIỆC',
    color: '#8b5cf6',
  },
];


// 5. Danh mục sản phẩm khởi đầu rỗng (Sàn thật 100% - chỉ hiển thị sản phẩm do Người bán thực tế niêm yết)
export const INITIAL_MARKET_PRODUCTS = [];
