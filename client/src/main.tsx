import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One shared cache for server data. Retry once, and do not refetch just because
// the browser tab regained focus.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
