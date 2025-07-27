import { Toaster } from "react-hot-toast";

export const Toast = () => (
  <Toaster
    position="bottom-right"
    toastOptions={{
      style: {
        background: "#1e1e2e",
        color: "#fff",
        fontFamily: '"Press Start 2P", cursive',
      },
      success: {
        iconTheme: {
          primary: "#7c3aed",
          secondary: "#fff",
        },
      },
    }}
  />
);
