import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpenCheck,
  Settings,
  GraduationCap,
  FileText,
  Sun,
  Moon,
  MenuIcon,
} from 'lucide-react';
import { Layout as AntLayout, Menu, Switch, Tooltip, Drawer, Button } from 'antd';
import type { MenuProps } from 'antd';
import { useDarkMode } from '../hooks/useDarkMode';

const { Sider, Content } = AntLayout;

interface LayoutProps {
  children: ReactNode;
}

const MENU_ITEMS: MenuProps['items'] = [
  { key: '/', icon: <BookOpenCheck size={20} />, label: '刷题' },
  { key: '/manage', icon: <Settings size={20} />, label: '管理' },
  { key: '/templates', icon: <FileText size={20} />, label: '模版' },
];

const MOBILE_BREAKPOINT = 768;

export function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useDarkMode();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    if (isMobile) setDrawerOpen(false);
  };

  // 根据当前路由匹配菜单 selectedKey
  const selectedKey = MENU_ITEMS?.find(
    (item) => item && 'key' in item && location.pathname === item.key,
  )
    ? location.pathname
    : '/';

  const siderContent = (
    <>
      <div
        className={`flex items-center gap-3 transition-all duration-200 ${collapsed ? 'justify-center py-6' : 'justify-start px-6 py-6'}`}
      >
        <GraduationCap size={28} className="text-indigo-600 dark:text-indigo-500" />
        {!collapsed && (
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap tracking-wide">
            Exam
          </span>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={MENU_ITEMS}
        onClick={handleMenuClick}
        className="flex-1 border-none bg-transparent"
      />

      <div
        className={`flex flex-col items-center gap-3 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'py-5' : 'px-6 py-5'}`}
      >
        <Tooltip title={darkMode ? '切换亮色模式' : '切换暗色模式'} placement="right">
          <Switch
            checked={darkMode}
            onChange={setDarkMode}
            checkedChildren={<Moon size={12} />}
            unCheckedChildren={<Sun size={12} />}
            className="shadow-sm"
          />
        </Tooltip>
        {!collapsed && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wider">
            v1.0.0
          </span>
        )}
      </div>
    </>
  );

  // 移动端：使用 Drawer
  if (isMobile) {
    return (
      <AntLayout className="min-h-screen bg-gray-50 dark:bg-[#121212]">
        {/* 顶部栏 */}
        <div className="h-14 flex items-center px-4 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[99] gap-3 shadow-sm">
          <Button
            type="text"
            icon={<MenuIcon size={20} className="text-gray-600 dark:text-gray-300" />}
            onClick={() => setDrawerOpen(true)}
          />
          <GraduationCap size={22} className="text-indigo-600 dark:text-indigo-500" />
          <span className="font-semibold text-base text-gray-800 dark:text-gray-100">Exam</span>
        </div>
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
          className="dark:bg-[#1f1f1f]"
        >
          {siderContent}
        </Drawer>
        <Content className="p-0 overflow-auto">{children}</Content>
      </AntLayout>
    );
  }

  // 桌面端：使用 Sider
  return (
    <AntLayout className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        collapsedWidth={80}
        breakpoint="lg"
        theme={darkMode ? 'dark' : 'light'}
        className="h-screen fixed left-0 top-0 bottom-0 z-[100] flex flex-col border-r border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 expert-sider bg-white dark:bg-[#121212]"
      >
        <div className="flex flex-col h-full bg-white dark:bg-[#121212]">{siderContent}</div>
      </Sider>
      <AntLayout
        className="transition-all duration-300 bg-gray-50 dark:bg-[#121212]"
        style={{ marginLeft: collapsed ? 80 : 240 }}
      >
        <Content className="overflow-auto h-screen">{children}</Content>
      </AntLayout>
    </AntLayout>
  );
}
