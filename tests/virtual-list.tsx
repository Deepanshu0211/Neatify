import React from "react";
import { createRoot } from "react-dom/client";
import VirtualFileList from "../src/components/VirtualFileList";
import "../src/App.css";
const items = Array.from({ length: 100000 }, (_, i) => ({
  source: `C:/Synthetic fixture/File ${String(i + 1).padStart(6, "0")}.pdf`,
  destination: `C:/Synthetic fixture/Documents/File ${i + 1}.pdf`,
  category: "Documents",
  extension: "pdf",
  bytes: 1024,
  modified: 1,
  session_id: "",
}));
createRoot(document.getElementById("root")!).render(
  <div className="app-window">
    <h1>Development fixture · 100,000 synthetic files</h1>
    <div style={{ height: 600, display: "flex" }}>
      <VirtualFileList items={items} />
    </div>
  </div>,
);
