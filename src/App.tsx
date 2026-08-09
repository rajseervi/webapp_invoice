import React from 'react';
import { Sidebar } from './components/Sidebar'; // Adjust path if needed
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-grow p-8 bg-slate-100 overflow-y-auto">
          <header className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, User!</p>
          </header>

          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-600">Total Sales</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">$12,345</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-600">New Orders</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">678</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-600">Active Users</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">1,234</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-600">Conversion Rate</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">12.5%</p>
            </div>
          </div>

          {/* Your main page content goes here */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Sales Over Time</h2>
              {/* Placeholder for a chart */}
              <div className="bg-slate-200 h-64 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">[Bar Chart Placeholder]</p>
              </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-slate-700">Main Content Area</h2>
              <p className="text-slate-600 mt-2">This is where your main application content will be displayed. You can add charts, tables, forms, or any other components here.</p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white shadow-md rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Recent Activity</h2>
            <ul>
              <li className="border-b border-slate-200 py-3">User John Doe added a new product.</li>
              <li className="border-b border-slate-200 py-3">Order #1234 was shipped.</li>
              <li className="py-3">A new user registered.</li>
            </ul>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;