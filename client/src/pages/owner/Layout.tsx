import React from "react";
import NavbarOwner from "../../components/owner/NavbarOwner";
import Sidebar from "../../components/owner/Sidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useEffect } from "react";

const Layout = () => {
  const { isOwner, user, token, navigate } = useAppContext();

  useEffect(() => {
    // On a page refresh the user is still being loaded from the saved login.
    // Wait for that, otherwise a real owner gets bounced to the home page.
    if (!user && localStorage.getItem("token")) return;
    if (!isOwner) {
      navigate("/");
    }
  }, [isOwner, user, token]);

  return (
    <div className="flex flex-col">
      <NavbarOwner />
      <div className="flex">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
