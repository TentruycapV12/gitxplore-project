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
            The <strong>HKA</strong> brand, co-founded and operated by a collaborative team of three members.
          </p>
          
          <p className="footer-text">
            The web platform is designed to specialize in surveying, discovering, and exploring high-potential open-source repositories. We provide resource integration, risk management, and strategic project deployments that deliver exceptional value to developers and partners worldwide.
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