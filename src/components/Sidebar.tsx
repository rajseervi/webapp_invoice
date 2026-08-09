import React from 'react';

// Example SVG Icons (You can replace these with your own or from a library like Heroicons)
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12v10.5a.75.75 0 00.75.75h17.5a.75.75 0 00.75-.75V12M2.25 12L12 2.25 21.75 12" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.057-1.228a48.249 48.249 0 0112.126 0c.497.22.967.686 1.057 1.228.09.542-.01 1.09-.232 1.564A48.25 48.25 0 0112 20.25a48.25 48.25 0 01-10.426-14.746c-.222-.474-.322-1.022-.232-1.564z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);


interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label, isActive }) => {
  return (
    <a
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out
                  ${isActive
                    ? 'bg-sky-500 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  );
};

export const Sidebar = () => {
  // Example: Determine active link based on current path (you'd use a router for this)
  const currentPath = "/dashboard"; // Replace with actual path from router

  const navItems = [
    { href: "/dashboard", icon: <HomeIcon />, label: "Dashboard" },
    { href: "/analytics", icon: <AnalyticsIcon />, label: "Analytics" },
    { href: "/reports", icon: <SettingsIcon />, label: "Reports" }, // Using SettingsIcon as placeholder
    { href: "/settings", icon: <SettingsIcon />, label: "Settings" },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        {/* Replace with your actual logo */}
        <img src="https://tailwindui.com/img/logos/mark.svg?color=sky&shade=500" alt="Company Logo" className="h-10 w-auto" />
        <span className="ml-3 text-2xl font-bold text-sky-400">YourBrand</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.href}
          />
        ))}
      </nav>

      {/* Buttons & Actions Section */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <button
          className="w-full flex items-center justify-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>New Project</span>
        </button>
        <button
          className="w-full flex items-center justify-center space-x-2 bg-slate-600 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>

      {/* User Profile (Optional) */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80" // Placeholder image
            alt="User Avatar"
          />
          <div>
            <p className="font-semibold text-sm text-slate-100">John Doe</p>
            <p className="text-xs text-slate-400">john.doe@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
