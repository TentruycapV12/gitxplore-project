import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { playSuccess, playTing } from '../utils/soundEffects';
import { showToast } from './ToastNotice';
import './AcademyCertificateModal.css';

export default function AcademyCertificateModal({ isOpen, onClose, onCelebrate }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

  const [studentName, setStudentName] = useState(
    user?.name || (isVi ? 'Học Viên Xuất Sắc' : 'Distinguished Student')
  );

  const canvasRef = useRef(null);

  // Vẽ chứng chỉ lên Canvas sắc nét độ phân giải 1600x1000
  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1600;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;

    // 1. Nền đen obsidian sang trọng
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W / 1.1);
    bgGrad.addColorStop(0, '#1c1010');
    bgGrad.addColorStop(0.5, '#0e0606');
    bgGrad.addColorStop(1, '#050202');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Viền ngoài vàng kim (Double Ornate Border)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(58, 58, W - 116, H - 116);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(68, 68, W - 136, H - 136);

    // Hoa văn 4 góc (Corner Brackets)
    const drawCorner = (x, y, flipX, flipY) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX, flipY);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.lineTo(0, 0);
      ctx.lineTo(50, 0);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(22, 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCorner(80, 80, 1, 1);
    drawCorner(W - 80, 80, -1, 1);
    drawCorner(80, H - 80, 1, -1);
    drawCorner(W - 80, H - 80, -1, -1);

    // 3. Logo & Tiêu đề tổ chức
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('⚡ GITXPLORE ACADEMY GLOBAL INITIATIVE ⚡', W / 2, 145);

    // Huy hiệu vinh danh
    ctx.fillStyle = '#ef4444';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(
      isVi ? '— CHỨNG NHẬN HOÀN THÀNH XUẤT SẮC —' : '— HONORARY CERTIFICATE OF COMPLETION —',
      W / 2,
      195
    );

    // Tiêu đề lớn
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 68px "Cormorant Garamond", serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(
      isVi ? 'BẰNG TỐT NGHIỆP VIBE CODING' : 'VIBE CODING GRADUATION DEGREE',
      W / 2,
      275
    );

    // Dòng giới thiệu
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(
      isVi ? 'Chứng nhận này được trân trọng trao tặng cho:' : 'This certificate is proudly awarded to:',
      W / 2,
      350
    );

    // 4. Tên học viên (Nổi bật rực rỡ)
    const nameGrad = ctx.createLinearGradient(W / 2 - 250, 0, W / 2 + 250, 0);
    nameGrad.addColorStop(0, '#fef08a');
    nameGrad.addColorStop(0.5, '#f59e0b');
    nameGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = nameGrad;
    ctx.font = '800 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(studentName || 'Học Viên GitXplore', W / 2, 440);

    // Gạch chân trang trí dưới tên
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 320, 470);
    ctx.lineTo(W / 2 + 320, 470);
    ctx.stroke();

    // 5. Nội dung thành tích
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.5px';
    const textDesc1 = isVi
      ? 'Đã hoàn thành xuất sắc toàn bộ 6/6 bài học thực chiến tại GitXplore Academy:'
      : 'Has successfully accomplished all 6 interactive quests at GitXplore Academy:';
    const textDesc2 = isVi
      ? 'Nhập môn Mã Nguồn Mở, Tự do Kiến tạo Phần mềm và Chỉ đạo AI kiến tạo ứng dụng Vibe Coding 2026.'
      : 'Mastering Open-Source Software, AI Prompt Engineering, and Autonomous Vibe Coding 2026.';

    ctx.fillText(textDesc1, W / 2, 540);
    ctx.fillText(textDesc2, W / 2, 580);

    // 6. Con dấu xác thực (Official Verified Seal)
    const sealX = W / 2;
    const sealY = 720;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sealX, sealY, 68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 56, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIED', sealX, sealY - 4);
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('GITXPLORE 2026', sealX, sealY + 18);
    ctx.restore();

    // 7. Chân bằng: Chữ ký và Mã định danh
    // Bên trái: Ngày cấp & Serial
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${isVi ? 'Ngày cấp' : 'Issued'}: ${new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}`,
      130,
      830
    );
    ctx.fillText(`Mã chứng nhận: GXP-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`, 130, 865);
    ctx.fillStyle = '#10b981';
    ctx.fillText('● Verified on GitXplore Blockchain Registry', 130, 900);

    // Bên phải: Chữ ký điện tử
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GitXplore Board of Technology', W - 130, 830);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Arisu AI Mentor & Co-Founder', W - 130, 865);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W - 420, 805);
    ctx.lineTo(W - 130, 805);
    ctx.stroke();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(drawCertificate, 80);
    }
  }, [isOpen, studentName, isVi]);

  if (!isOpen) return null;

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `Bang_Tot_Nghiep_GitXplore_${(studentName || 'HocVien').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      playSuccess();
      showToast(
        isVi ? '🎓 Đã tải ảnh Bằng Tốt Nghiệp độ nét cao (PNG) về máy!' : '🎓 Graduation certificate (PNG) downloaded!',
        '🏆',
        'success'
      );
    } catch {
      showToast(isVi ? 'Không thể xuất ảnh lúc này.' : 'Failed to export image.', '⚠️', 'error');
    }
  };

  const handleShareCertificate = () => {
    const text = isVi
      ? `🎉 Tôi vừa hoàn thành xuất sắc Khóa học Nhập môn Mã Nguồn Mở & Vibe Coding tại GitXplore Academy! Khám phá ngay tại: https://my-react-app-three-beta.vercel.app/`
      : `🎉 I just graduated from GitXplore Academy mastering Open Source & Vibe Coding! Check it out: https://my-react-app-three-beta.vercel.app/`;

    navigator.clipboard.writeText(text).then(() => {
      playTing();
      showToast(
        isVi ? '🔗 Đã sao chép lời chúc & link chứng chỉ để chia sẻ!' : '🔗 Achievement message copied to clipboard!',
        '✨',
        'success'
      );
    });
  };

  return (
    <div className="cert-overlay" onClick={onClose}>
      <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cert-header">
          <div className="cert-title-badge">
            <span>🏆</span>
            <span>{isVi ? 'BẰNG TỐT NGHIỆP DANH DỰ • GITXPLORE ACADEMY' : 'HONORARY GRADUATION DEGREE • GITXPLORE'}</span>
          </div>

          <button type="button" className="cert-close-btn" onClick={onClose} title="Đóng">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cert-body">
          {/* Tên Học Viên Edit Bar */}
          <div className="cert-name-input-row">
            <label>✏️ {isVi ? 'Tên trên bằng khen:' : 'Name on Certificate:'}</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={isVi ? 'Nhập tên của bạn...' : 'Enter your name...'}
              maxLength={40}
            />
          </div>

          {/* Canvas Preview */}
          <div className="cert-canvas-wrap">
            <canvas ref={canvasRef} />
          </div>

          {/* Action Buttons */}
          <div className="cert-actions-dock">
            <button
              type="button"
              className="cert-btn-download"
              onClick={handleDownloadImage}
            >
              <span>📥</span>
              <span>{isVi ? 'Tải Ảnh Bằng Khen (PNG)' : 'Download Degree (PNG)'}</span>
            </button>

            <button
              type="button"
              className="cert-btn-share"
              onClick={handleShareCertificate}
            >
              <span>🔗</span>
              <span>{isVi ? 'Sao Chép Link Khoe Thành Tích' : 'Share Achievement'}</span>
            </button>

            <button
              type="button"
              className="cert-btn-confetti"
              onClick={() => {
                playSuccess();
                if (onCelebrate) onCelebrate();
                showToast(isVi ? '🎆 Chúc mừng bạn đã tốt nghiệp xuất sắc!' : '🎆 Congratulations on your achievement!', '🎉', 'success');
              }}
            >
              <span>🎆</span>
              <span>{isVi ? 'Bắn Pháo Hoa Ăn Mừng' : 'Celebrate Fireworks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
