import './Logo.css';

export default function Logo({ size = 'large', showText = true }) {
  return (
    <div className={`logo-container logo-${size}`}>
      <img 
        src="/aegis-logo.png" 
        alt="AEGIS Logo" 
        className="logo-image"
      />
      {showText && (
        <div className="logo-text">
          <h1 className="logo-title">AEGIS</h1>
          <p className="logo-subtitle">Project Aegis</p>
        </div>
      )}
    </div>
  );
}
