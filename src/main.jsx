import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/app.css";
import "./styles/premium-fintech.css";
import App from "./App.jsx";
import ThemeProvider from "./components/ThemeProvider.jsx";
import "./styles/themes.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
