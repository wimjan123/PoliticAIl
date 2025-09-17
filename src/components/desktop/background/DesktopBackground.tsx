import { useDesktop } from '../../../contexts/DesktopContext';
import '../../../styles/components/desktop-background.css';

export function DesktopBackground() {
  const { state } = useDesktop();
  const { theme } = state;

  return (
    <div
      className="desktop-background"
      style={{
        background: theme.wallpaper,
      }}
    >
      {/* Political themed background elements */}
      <div className="background-elements">
        {/* Capitol building silhouette */}
        <div className="capitol-silhouette">
          <div className="capitol-dome">🏛️</div>
          <div className="capitol-base"></div>
        </div>

        {/* Floating political icons */}
        <div className="floating-icons">
          <div className="floating-icon" style={{ top: '20%', left: '15%', animationDelay: '0s' }}>⚖️</div>
          <div className="floating-icon" style={{ top: '35%', right: '20%', animationDelay: '2s' }}>📊</div>
          <div className="floating-icon" style={{ bottom: '25%', left: '10%', animationDelay: '4s' }}>🗳️</div>
          <div className="floating-icon" style={{ top: '60%', right: '15%', animationDelay: '6s' }}>📈</div>
          <div className="floating-icon" style={{ bottom: '40%', right: '30%', animationDelay: '8s' }}>🌐</div>
        </div>

        {/* Grid pattern overlay */}
        <div className="grid-overlay" style={{
          backgroundImage: `
            linear-gradient(${theme.colors.secondary}20 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.secondary}20 1px, transparent 1px)
          `
        }}></div>

        {/* Subtle gradient overlay */}
        <div
          className="gradient-overlay"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, ${theme.colors.primary}10 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, ${theme.colors.accent}08 0%, transparent 50%)
            `
          }}
        ></div>
      </div>

      {/* Desktop info overlay (bottom right) */}
      <div className="desktop-info" style={{ color: `${theme.colors.text}60` }}>
        <div className="version-info">
          <div className="app-name">PoliticAIl</div>
          <div className="app-version">v1.0.0-alpha</div>
        </div>
        <div className="system-info">
          <div className="theme-name">{theme.name}</div>
        </div>
      </div>
    </div>
  );
}