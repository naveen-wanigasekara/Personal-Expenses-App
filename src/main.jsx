import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/app.css";
import "./styles/premium-fintech.css";
import App from "./App.jsx";
import ThemeProvider from "./components/ThemeProvider.jsx";
import "./styles/themes.css";
import "./styles/loan-calculator.css";
import "./styles/bank-details.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

// The worker caches only the public app shell, never financial/API data.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
}
