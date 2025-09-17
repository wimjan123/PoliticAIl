import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import "./styles.css";
import queryClient, { queryDevtools } from "./services/queryClient";
import { SimulationProvider } from "./contexts/SimulationContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <App />
        <ReactQueryDevtools
          initialIsOpen={queryDevtools.initialIsOpen}
          position={queryDevtools.position}
        />
      </SimulationProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);