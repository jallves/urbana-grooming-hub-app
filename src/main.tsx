
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipPrimitive.Provider>
      <App />
    </TooltipPrimitive.Provider>
  </React.StrictMode>
);
