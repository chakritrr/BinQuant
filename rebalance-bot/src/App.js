import React from "react";
import Dashboard from "./components/Dashboard";
import { BotProvider } from "./hooks/useRebalanceBot";

function App() {
  return (
    <BotProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <Dashboard />
      </div>
    </BotProvider>
  );
}

export default App;
