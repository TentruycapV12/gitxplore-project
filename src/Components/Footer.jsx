import React from 'react';

export default function Footer() {
  return (
    <footer className="custom-footer">
      <div className="footer-inner">
        {/* Cột trái: Logo & Giới thiệu */}
        <div className="footer-left">
          <div className="footer-logo">
            <span className="logo-main">HKA</span>
            <span className="logo-sub">.vn</span>
          </div>
          
          <p className="footer-text">
            Thương hiệu <strong>HKA</strong>, được đồng sáng lập và vận hành bởi nhóm 3 thành viên.
          </p>
          
          <p className="footer-text">
            Giao diện trang web và nền tảng được phát triển nhằm chuyên sâu vào việc khảo sát, khám phá và khai thác các dự án tiềm năng. Chúng tôi cung cấp các giải pháp kết nối tài nguyên, quản trị rủi ro và triển khai các dự án chiến lược mang lại giá trị gia tăng vượt trội cho khách hàng và đối tác.
          </p>
        </div>

        {/* Cột phải: Bản quyền */}
        <div className="footer-right">
          <p className="footer-copyright">
            © 2026 HKA. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}