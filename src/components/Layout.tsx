import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  MessageSquare,
  Bot,
  CheckSquare,
  FileText,
  Wrench,
  Settings,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  Zap,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "ダッシュボード",
      icon: <Home className="w-5 h-5" />,
      path: "/",
    },
    {
      id: "chat",
      label: "チャット",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/chat",
      badge: 3,
    },
    {
      id: "agents",
      label: "エージェント",
      icon: <Bot className="w-5 h-5" />,
      path: "/agents",
    },
    {
      id: "tasks",
      label: "タスク",
      icon: <CheckSquare className="w-5 h-5" />,
      path: "/tasks",
      badge: 5,
    },
    {
      id: "files",
      label: "ファイル",
      icon: <FileText className="w-5 h-5" />,
      path: "/files",
    },
    {
      id: "tools",
      label: "ツール",
      icon: <Wrench className="w-5 h-5" />,
      path: "/tools",
    },
    {
      id: "settings",
      label: "設定",
      icon: <Settings className="w-5 h-5" />,
      path: "/settings",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const sidebarVariants = {
    expanded: {
      width: 280,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    collapsed: {
      width: 80,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const contentVariants = {
    expanded: {
      marginLeft: 280,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    collapsed: {
      marginLeft: 80,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        variants={sidebarVariants}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-xl font-bold text-gray-900">DeepResearch</h1>
                  <p className="text-xs text-gray-500">AI Agent Platform</p>
                </motion.div>
              )}
            </div>
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`flex-shrink-0 ${
                  isActive(item.path) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}>
                  {item.icon}
                </div>
                
                {!sidebarCollapsed && (
                  <motion.div
                    className="flex items-center justify-between flex-1 min-w-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
                
                {sidebarCollapsed && item.badge && (
                  <div className="absolute left-12 top-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">Research User</p>
                  <p className="text-xs text-gray-500 truncate">user@deepresearch.ai</p>
                </motion.div>
              )}
            </div>
            
            {!sidebarCollapsed && (
              <motion.div
                className="mt-3 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  <span>ヘルプ</span>
                </button>
                <button className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="lg:ml-0"
        variants={contentVariants}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
      >
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  3
                </span>
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;