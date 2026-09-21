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
            <div key={idx} style={styles.featureCard}>
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
            style={styles.ctaButton}
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
    padding: '90px 6vw',
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
    marginBottom: '50px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    padding: '6px 16px',
    borderRadius: '20px',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    color: '#fbbf24',
    marginBottom: '16px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 'clamp(32px, 5vw, 54px)',
    fontWeight: '700',
    lineHeight: '1.15',
    marginBottom: '16px',
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
    maxWidth: '720px',
    margin: '0 auto',
    fontSize: '14.5px',
    lineHeight: '1.7',
    color: '#d6d3d1',
    opacity: 0.88,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '50px',
  },
  statCard: {
    background: 'linear-gradient(180deg, #180d0e 0%, #0d0607 100%)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    borderRadius: '18px',
    padding: '24px 18px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  statValue: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '38px',
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#a8a29e',
    margin: 0,
    fontWeight: '500',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '50px',
  },
  featureCard: {
    background: 'linear-gradient(180deg, #160c0d 0%, #0d0607 100%)',
    border: '1px solid rgba(251, 191, 36, 0.18)',
    borderRadius: '18px',
    padding: '28px 22px',
  },
  iconWrapper: {
    fontSize: '28px',
    marginBottom: '14px',
  },
  featureTitle: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fef08a',
    marginBottom: '8px',
  },
  featureDesc: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#d6d3d1',
    opacity: 0.85,
    margin: 0,
  },
  ctaBox: {
    textAlign: 'center',
    padding: '40px 24px',
    background: 'linear-gradient(135deg, rgba(38, 14, 16, 0.7) 0%, rgba(13, 6, 7, 0.9) 100%)',
    border: '1px dashed rgba(251, 191, 36, 0.35)',
    borderRadius: '20px',
  },
  ctaTitle: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '26px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '10px',
  },
  ctaText: {
    color: '#d6d3d1',
    maxWidth: '560px',
    margin: '0 auto 20px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '13px',
    borderRadius: '10px',
    boxShadow: '0 0 16px rgba(220, 38, 38, 0.35)',
  },
};

export default About;