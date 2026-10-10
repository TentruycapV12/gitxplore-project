import React from 'react';

const About = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Curated & Audited',
      desc: 'Aggregating high-caliber GitHub repositories, rigorously categorized by tech stack, production-readiness, and real-world utility.'
    },
    {
      icon: '⚡',
      title: 'Accelerate Workflow',
      desc: 'Empowering engineers and developers to instantly discover templates, architectural boilerplates, and modular codebases within minutes.'
    },
    {
      icon: '🌐',
      title: 'Cross-Platform Ecosystem',
      desc: 'Spanning Web Development, Mobile Frameworks, AI & Machine Learning, to enterprise-grade Cloud Infrastructure and DevOps tooling.'
    },
    {
      icon: '🤝',
      title: 'Community-Driven',
      desc: 'An open hub uniting open-source developers worldwide to exchange architectural knowledge, collaborate on code, and expand free software.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Selected Repositories' },
    { value: '30+', label: 'Tech Domains' },
    { value: '100%', label: 'Free & Open Source' },
    { value: '24/7', label: 'Trending Updates' }
  ];

  return (
    <section className="about-section" id="about" style={styles.section}>
      <style>{`
        .about-feature { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .about-feature:hover { transform: translateY(-4px); border-color: rgba(251,191,36,.45); box-shadow: 0 14px 34px rgba(0,0,0,.55); }
        .about-cta-btn { transition: transform .2s ease, background-color .2s ease; }
        .about-cta-btn:hover { transform: translateY(-2px); background-color: #fbbf24; }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.badge}>ABOUT THE INITIATIVE</span>
          <h2 style={styles.title}>
            A Curated Portal for High-Performance <br />
            <span style={styles.gradientText}>Open-Source Artifacts</span>
          </h2>
          <p style={styles.subtitle}>
            Born to streamline technical discovery, GitXplore serves as an immersive visual library 
            guiding developers directly to exceptional code without hours of manual research.
          </p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <div key={idx} style={styles.statCard}>
              <h3 style={styles.statValue}>{stat.value}</h3>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={styles.featuresGrid}>
          {features.map((item, idx) => (
            <div key={idx} className="about-feature" style={styles.featureCard}>
              <div style={styles.iconWrapper}>{item.icon}</div>
              <h4 style={styles.featureTitle}>{item.title}</h4>
              <p style={styles.featureDesc}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Call to Action Footer */}
        <div style={styles.ctaBox}>
          <h3 style={styles.ctaTitle}>Have an open-source project to feature?</h3>
          <p style={styles.ctaText}>
            Contribute your repository or share innovative discoveries to strengthen the global open-source landscape.
          </p>
          <a
            href="https://github.com/TentruycapV12/gitxplore-project"
            target="_blank"
            rel="noopener noreferrer"
            className="about-cta-btn" style={styles.ctaButton}
          >
            Contribute on GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: '120px 6vw 110px',
    backgroundColor: '#090506',
    borderTop: '1px solid rgba(251, 191, 36, 0.15)',
    color: '#fef3c7',
    position: 'relative',
    zIndex: 2,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '80px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '2px',
    padding: '7px 18px',
    borderRadius: '20px',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    color: '#fbbf24',
    marginBottom: '24px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 'clamp(36px, 5.5vw, 64px)',
    fontWeight: '700',
    lineHeight: '1.12',
    marginBottom: '24px',
    color: '#ffffff',
  },
  gradientText: {
    fontFamily: 'Cormorant Garamond, serif',
    background: 'linear-gradient(135deg, #fde047 0%, #f97316 60%, #ef4444 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontStyle: 'italic',
  },
  subtitle: {
    maxWidth: '760px',
    margin: '0 auto',
    fontSize: '18px',
    lineHeight: '1.75',
    color: '#d6d3d1',
    opacity: 0.9,
  },

  /* Stats: bỏ thẻ, chỉ còn số lớn + nhãn, kẹp giữa 2 đường kẻ mảnh */
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '32px 24px',
    padding: '44px 0',
    marginBottom: '96px',
    borderTop: '1px solid rgba(251, 191, 36, 0.18)',
    borderBottom: '1px solid rgba(251, 191, 36, 0.18)',
  },
  statCard: {
    textAlign: 'center',
  },
  statValue: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 'clamp(44px, 5vw, 60px)',
    fontWeight: '700',
    lineHeight: '1',
    color: '#fbbf24',
    margin: '0 0 10px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#a8a29e',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '96px',
  },
  featureCard: {
    background: 'linear-gradient(180deg, #160c0d 0%, #0d0607 100%)',
    border: '1px solid rgba(251, 191, 36, 0.18)',
    borderRadius: '18px',
    padding: '36px 28px',
  },
  iconWrapper: {
    width: '52px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    borderRadius: '14px',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    marginBottom: '22px',
  },
  featureTitle: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '1.25',
    color: '#fef08a',
    margin: '0 0 12px',
  },
  featureDesc: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#d6d3d1',
    opacity: 0.9,
    margin: 0,
  },

  /* CTA: viền liền thay cho nét đứt, nút đặc 1 màu thay cho gradient cam-đỏ */
  ctaBox: {
    textAlign: 'center',
    padding: '64px 28px',
    background: 'linear-gradient(135deg, rgba(38, 14, 16, 0.7) 0%, rgba(13, 6, 7, 0.9) 100%)',
    border: '1px solid rgba(251, 191, 36, 0.25)',
    borderRadius: '24px',
  },
  ctaTitle: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 'clamp(28px, 3.5vw, 38px)',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 14px',
  },
  ctaText: {
    color: '#d6d3d1',
    maxWidth: '620px',
    margin: '0 auto 32px',
    fontSize: '16px',
    lineHeight: '1.7',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '14px 34px',
    backgroundColor: '#f59e0b',
    color: '#1a0e05',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '15px',
    borderRadius: '12px',
  },
};

export default About;
