import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Settings, GraduationCap, FileText } from 'lucide-react';
import { Switch } from 'antd';
import { useDarkMode } from '../hooks/useDarkMode';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div className="app-container">
      <aside className="main-sidebar">
        <div className="logo-section">
          <div className="logo-icon">
            <GraduationCap size={28} />
          </div>
          {/* <span className="logo-text">Exam</span> */}
        </div>

        <nav className="main-nav">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            title="刷题练习"
          >
            <BookOpen size={24} />
            <span className="nav-label">刷题</span>
          </NavLink>
          <NavLink
            to="/manage"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            title="题库管理"
          >
            <Settings size={24} />
            <span className="nav-label">管理</span>
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            title="模版配置"
          >
            <FileText size={24} />
            <span className="nav-label">模版</span>
          </NavLink>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Switch
            checked={darkMode}
            onChange={setDarkMode}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </div>
      </aside>
      <main className="app-content">{children}</main>
    </div>
  );
}
