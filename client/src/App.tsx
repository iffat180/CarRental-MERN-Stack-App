import React, { lazy, Suspense, useEffect } from "react";
import A4Header from "./components/a4/A4Header";
import A4Footer from "./components/a4/A4Footer";
import "./components/a4/a4.css";
import "./components/a4/a4-skin.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomeA4 from "./pages/HomeA4";
import CarDetails from "./pages/CarDetails";
import Cars from "./pages/Cars";
import Loader from "./components/Loader";
import Seo from "./components/Seo";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./pwa/OfflineBanner";
import PwaPrompt from "./pwa/PwaPrompt";
import { AnimatePresence, LazyMotion, MotionConfig, m } from "motion/react";

// The animation code is fetched after the first paint, not bundled into it.
// Pages that are only for logged-in people: kept out of search engines
const PRIVATE_PAGES: [prefix: string, title: string][] = [
  ["/my-bookings", "My bookings"],
  ["/booking-details", "Booking details"],
  ["/booking-summary", "Booking summary"],
  ["/booking-success", "Booking confirmed"],
  ["/owner", "Owner dashboard"],
];

const loadMotionFeatures = () => import("./motionFeatures").then((mod) => mod.default);

// Loaded on demand, so the home page does not download the booking form (zod, React
// Hook Form) or the owner area (Recharts) until someone actually opens them.
// The dialogs (and the Radix code behind them) are only downloaded when one is opened.
const Login = lazy(() => import("./components/Login"));
const LoginRequiredModal = lazy(() => import("./components/LoginRequiredModal"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const BookingSummary = lazy(() => import("./pages/BookingSummary"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const Layout = lazy(() => import("./pages/owner/Layout"));
const Dashboard = lazy(() => import("./pages/owner/Dashboard"));
const AddCar = lazy(() => import("./pages/owner/AddCar"));
const ManageCars = lazy(() => import("./pages/owner/ManageCars"));
const ManageBookings = lazy(() => import("./pages/owner/ManageBookings"));
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";

const App = () => {
  const { showLogin, showLoginRequired, setShowLoginRequired } = useAppContext();
  const { pathname, hash } = useLocation();
  const location = useLocation();
  const isOwnerPath = pathname.startsWith("/owner");
  // Pages fade when the route changes. The whole owner area counts as one page, so
  // moving between its tabs does not re-animate the sidebar.
  const pageKey = isOwnerPath ? "owner" : pathname;
  // Account, booking and owner pages must not show up in search results
  const privateTitle = PRIVATE_PAGES.find(([prefix]) => pathname.startsWith(prefix))?.[1];

  // New page -> scroll to top. Link with a #hash -> scroll to that section.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 50);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="a4">
          {privateTitle && <Seo title={privateTitle} path={pathname} noindex />}
          <Toaster />
          <OfflineBanner />
          <PwaPrompt />
          {/* Skip to main content link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Skip to main content
          </a>

          <Suspense fallback={null}>
            {showLogin && <Login />}
            {showLoginRequired && (
              <LoginRequiredModal
                isOpen={showLoginRequired}
                onClose={() => setShowLoginRequired(false)}
              />
            )}
          </Suspense>

          {!isOwnerPath && <A4Header />}

          <main id="main-content" role="main">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={pageKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* a crash in one page keeps the header and footer, and clears when you go elsewhere */}
                <ErrorBoundary key={pageKey}>
                  <Suspense fallback={<Loader />}>
                    <Routes location={location}>
                      <Route path="/" element={<HomeA4 />} />
                      <Route path="/preview" element={<Navigate to="/" replace />} />
                      <Route path="/car-details/:id" element={<CarDetails />} />
                      <Route path="/cars" element={<Cars />} />
                      <Route path="/my-bookings" element={<MyBookings />} />
                      <Route path="/booking-details/:carId" element={<BookingDetails />} />
                      <Route path="/booking-summary/:bookingId" element={<BookingSummary />} />
                      <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
                      <Route path="/owner" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="add-car" element={<AddCar />} />
                        <Route path="manage-cars" element={<ManageCars />} />
                        <Route path="manage-bookings" element={<ManageBookings />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </m.div>
            </AnimatePresence>
          </main>

          {!isOwnerPath && <A4Footer />}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};

export default App;
