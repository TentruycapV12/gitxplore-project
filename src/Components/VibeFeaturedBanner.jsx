import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VibeFeaturedBanner.css';

export default function VibeFeaturedBanner() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const sampleCmd = 'npx aitmpl add skill frontend-vibe-wizard';

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sampleCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="vfb-banner" onClick={() => navigate('/vibe')}>
      <div className="vfb-glow" />
      
      <div className="vfb-left">
        <div className="vfb-badge">
          <span className="vfb-sparkle">✦</span>
          <span>MỚI: VIBE CODING HUB</span>
          <span className="vfb-badge-tag">aitmpl.com</span>
        </div>

        <h2 className="vfb-title">
          Kho Mẫu Vibe Coding, <span>AI Agents</span> & Giao Thức MCP
        </h2>

        <p className="vfb-desc">
          Bộ sưu tập thành phần AI lập trình hàng đầu: Skills, Autonomous Agents, Slash Commands, MCP Servers
          và quy tắc <code>.cursorrules</code> / <code>CLAUDE.md</code> chuẩn quốc tế cho Claude Code, Cursor & Antigravity.
        </p>

        {/* Quick Category Badges */}
        <div className="vfb-categories" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => navigate('/vibe?cat=skills')}>
            ⚡ Skills (8)
          </button>
          <button type="button" onClick={() => navigate('/vibe?cat=agents')}>
            🤖 AI Agents (6)
          </button>
          <button type="button" onClick={() => navigate('/vibe?cat=commands')}>
            ⌨️ Commands (5)
          </button>
          <button type="button" onClick={() => navigate('/vibe?cat=mcps')}>
            🔌 MCPs (5)
          </button>
          <button type="button" onClick={() => navigate('/vibe?cat=rules')}>
            📜 .cursorrules (4)
          </button>
        </div>

        <div className="vfb-cta-row">
          <button
            type="button"
            className="vfb-cta-btn vfb-cta-primary"
            onClick={(e) => { e.stopPropagation(); navigate('/vibe'); }}
          >
            Khám phá Vibe Hub ▸
          </button>
          <a
            href="https://aitmpl.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="vfb-cta-btn vfb-cta-link"
            onClick={(e) => e.stopPropagation()}
          >
            Xem aitmpl.com ↗
          </a>
        </div>
      </div>

      <div className="vfb-right" onClick={(e) => e.stopPropagation()}>
        <div className="vfb-terminal">
          <div className="vfb-terminal-bar">
            <div className="vfb-dots">
              <span className="is-red" />
              <span className="is-yellow" />
              <span className="is-green" />
            </div>
            <span className="vfb-terminal-title">bash — claude-code & aitmpl</span>
          </div>

          <div className="vfb-terminal-body">
            <p className="vfb-terminal-comment"># Cài đặt mẫu UI Vibe Coding trong 1 giây:</p>
            <div className="vfb-terminal-cmd">
              <span className="vfb-term-prompt">&gt;</span>
              <code>{sampleCmd}</code>
            </div>
            <p className="vfb-terminal-log">
              ✔ Resolved component: <span className="is-cyan">frontend-vibe-wizard@v2.4.0</span><br />
              ✔ Injected into .cursorrules & CLAUDE.md<br />
              ✔ Ready to code with 100% Vibe Aesthetics!
            </p>
          </div>

          <button
            type="button"
            className={`vfb-copy-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            title="Copy lệnh CLI"
          >
            {copied ? '✓ Đã copy lệnh!' : 'Copy lệnh CLI'}
          </button>
        </div>
      </div>
    </section>
  );
}
