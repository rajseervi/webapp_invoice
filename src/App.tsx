    import React from 'react';
    import { Sidebar } from './components/Sidebar'; // Adjust path if needed

    function App() {
      return (
        <div className="flex">
          <Sidebar />
          <main className="flex-grow p-8 bg-slate-100">
            {/* Your main page content goes here */}
            <h1 className="text-2xl font-bold">Main Content Area</h1>
            <p>Welcome to the application!</p>
          </main>
        </div>
      );
    }

    export default App;