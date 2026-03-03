import { useState, useEffect } from 'react';
import './styles/HomePage.css';

export default function HomePage({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    {
      question: "How does the automated matching work?",
      answer: "Our system analyzes job requirements and student profiles (CGPA, skills, department) in real-time. When a company posts a job, eligible students are automatically notified via the platform."
    },
    {
      question: "Is the platform mobile-responsive?",
      answer: "Yes, SmartPlace is built with a mobile-first approach. Students can track applications and receive notifications on any device."
    },
    {
      question: "How are academic records verified?",
      answer: "Faculty advisors and administrators have dedicated dashboards to verify student-uploaded documents and CGPA data before it becomes visible to recruiters."
    }
  ];

  return (
    <div className="lp-root">
      {/* Navbar */}
      <header className={`lp-header ${scrolled ? 'lp-header-scrolled' : ''}`}>
        <div className="lp-logo">
          <span className="lp-logo-text">SmartPlace</span>
        </div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#faq">FAQ</a>
        </nav>
        <button className="lp-btn-outline" onClick={onEnter}>
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-eyebrow animate-fade-in">The Professional Standard</div>
          <h1 className="lp-heading animate-slide-up">
            Campus Recruitment<br />
            <span className="lp-heading-sub">Reimagined.</span>
          </h1>
          <p className="lp-subtext animate-slide-up-delayed">
            A high-performance placement ecosystem connecting elite talent with industry leaders through a unified, minimal interface.
          </p>
          <div className="lp-hero-actions animate-fade-in-delayed">
            <button className="lp-btn-primary" onClick={onEnter}>
              Get Started
            </button>
            <button className="lp-btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Platform
            </button>
          </div>
        </div>
      </main>

      {/* Features Section - Bento Grid Style */}
      <section id="features" className="lp-section">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Core Capabilities</h2>
          <p className="lp-section-desc">Precision-engineered tools for the modern placement cell.</p>
        </div>
        
        <div className="lp-bento-grid">
          <div className="lp-bento-item lp-bento-main">
            <div className="lp-card-icon">01</div>
            <h3 className="lp-card-title">Centralized Command</h3>
            <p className="lp-card-text">Manage thousands of students and hundreds of companies from a single, high-density dashboard. Track every stage of the recruitment funnel with zero lag.</p>
            <div className="lp-bento-visual">
              <div className="lp-visual-mockup"></div>
            </div>
          </div>
          
          <div className="lp-bento-item lp-bento-accent">
            <div className="lp-card-icon">02</div>
            <h3 className="lp-card-title">Real-time Analytics</h3>
            <p className="lp-card-text">Live tracking of selection rates and interview progress.</p>
          </div>
          
          <div className="lp-bento-item">
            <div className="lp-card-icon">03</div>
            <h3 className="lp-card-title">Verified Profiles</h3>
            <p className="lp-card-text">Fraud-resistant academic records vetted by faculty.</p>
          </div>
          
          <div className="lp-bento-item lp-bento-wide">
            <div className="lp-card-icon">04</div>
            <h3 className="lp-card-title">Automated Notifications</h3>
            <p className="lp-card-text">Instant alerts for eligibility, interview schedules, and offer letters via our unified messaging system.</p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="lp-section lp-section-alt">
        <div className="lp-section-header">
          <h2 className="lp-section-title">The Workflow</h2>
        </div>
        <div className="lp-workflow-steps">
          <div className="lp-step">
            <div className="lp-step-number">01</div>
            <div className="lp-step-content">
              <h4>Setup</h4>
              <p>Onboard departments and faculty coordinators.</p>
            </div>
          </div>
          <div className="lp-step">
            <div className="lp-step-number">02</div>
            <div className="lp-step-content">
              <h4>Posting</h4>
              <p>Companies list opportunities and criteria.</p>
            </div>
          </div>
          <div className="lp-step">
            <div className="lp-step-number">03</div>
            <div className="lp-step-content">
              <h4>Matching</h4>
              <p>System auto-identifies eligible candidates.</p>
            </div>
          </div>
          <div className="lp-step">
            <div className="lp-step-number">04</div>
            <div className="lp-step-content">
              <h4>Selection</h4>
              <p>Digital management of offers and results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="lp-section">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Common Questions</h2>
        </div>
        <div className="lp-faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`lp-faq-item ${activeFaq === index ? 'lp-faq-active' : ''}`}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div className="lp-faq-question">
                {faq.question}
                <span className="lp-faq-icon">{activeFaq === index ? '−' : '+'}</span>
              </div>
              <div className="lp-faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="lp-stats-strip">
        <div className="lp-stat-item">
          <span className="lp-stat-num">50k+</span>
          <span className="lp-stat-lab">Placements</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-num">200+</span>
          <span className="lp-stat-lab">Colleges</span>
        </div>
        <div className="lp-stat-item">
          <span className="lp-stat-num">1.2k+</span>
          <span className="lp-stat-lab">Partners</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <h3 className="lp-logo-text">SmartPlace</h3>
            <p>Elevating campus recruitment for the modern age.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-link-group">
              <h5>Platform</h5>
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="lp-link-group">
              <h5>Legal</h5>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © {new Date().getFullYear()} SmartPlace. Defined by precision.
        </div>
      </footer>
    </div>
  );
}
