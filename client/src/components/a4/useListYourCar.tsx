import React, { useState, lazy, Suspense } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
const OwnerOnboardingModal = lazy(() => import("../owner/OwnerOnboardingModal"));

// Same "List your car" behaviour the old Navbar had:
//  - logged out  -> remember where to go, open the login modal
//  - owner       -> go straight to the add-car page
//  - plain user  -> show the "become an owner" onboarding modal
export const useListYourCar = () => {
  const { setShowLogin, user, navigate, upgradeToOwner } = useAppContext();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const listYourCar = () => {
    if (!user) {
      sessionStorage.setItem("redirectPath", "/owner/add-car");
      setShowLogin(true);
      return;
    }
    if (user.role === "owner") {
      navigate("/owner/add-car");
      return;
    }
    setOpen(true);
  };

  const becomeOwner = async () => {
    setBusy(true);
    try {
      const result = await upgradeToOwner();
      if (result?.success) {
        setOpen(false);
        toast.success("You're now registered as an owner");
        navigate("/owner/add-car");
        sessionStorage.removeItem("redirectPath");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to become an owner. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // only created (and downloaded) once someone opens it
  const modal = open ? (
    <Suspense fallback={null}>
      <OwnerOnboardingModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onBecomeOwner={becomeOwner}
        isSubmitting={busy}
      />
    </Suspense>
  ) : null;

  return { listYourCar, modal };
};
