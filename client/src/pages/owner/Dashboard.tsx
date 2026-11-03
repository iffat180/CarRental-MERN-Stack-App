import React, { useEffect, useState } from "react";
import type { Booking, MonthlyRevenue } from "../../types";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import LoadingState from "../../components/owner/LoadingState";
import ErrorState from "../../components/owner/ErrorState";
import EmptyState from "../../components/owner/EmptyState";
import RevenueChart from "../../components/owner/RevenueChart";
import { useOwnerLiveRefresh } from "../../hooks/useOwnerLiveRefresh";

const Dashboard = () => {
  const { axios, isOwner, currency } = useAppContext();

  const [data, setData] = useState<{
    totalCars: number;
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    recentBookings: Booking[];
    monthlyRevenue: number;
    revenueByMonth: MonthlyRevenue[];
  }>({
    totalCars: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: [],
    monthlyRevenue: 0,
    revenueByMonth: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dashboardCards = [
    { title: "Total Cars", value: data.totalCars, icon: assets.carIconColored },
    {
      title: "Total Bookings",
      value: data.totalBookings,
      icon: assets.listIconColored,
    },
    {
      title: "Pending",
      value: data.pendingBookings,
      icon: assets.cautionIconColored,
    },
    {
      title: "Completed",
      value: data.completedBookings,
      icon: assets.listIconColored,
    },
  ];

  // `silent` refreshes (live updates and polling) keep the page as it is: no spinner,
  // no error toast.
  const fetchDashboardData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const { data } = await axios.get("/api/owner/dashboard");
      if (data.success) {
        setData(data.dashboardData);
      } else {
        if (!silent) {
          const errorMessage = data.message || "Failed to fetch dashboard data";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      if (!silent) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to fetch dashboard data";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchDashboardData();
    }
  }, [isOwner]);

  // live updates over a WebSocket, or polling when the server cannot hold one
  useOwnerLiveRefresh(() => fetchDashboardData(true));

  return (
    <div className="px-4 pt-10 md:px-10 flex-1">
      <Title
        title="Admin Dashboard"
        subTitle="Monitor overall platform performance including total cars, bookings, revenue, and recent activities"
      />

      {/* Loading State */}
      {isLoading && <LoadingState message="Loading dashboard data..." />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState error={error} onRetry={() => fetchDashboardData()} retryLabel="Retry" />
      )}

      {/* Dashboard Content */}
      {!isLoading && !error && (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-8 max-w-3xl">
            {dashboardCards.map((card, index) => (
              <div
                key={index}
                className="flex gap-2 items-center justify-between p-4 rounded-md border border-borderColor"
              >
                <div>
                  <h1 className="text-xs text-gray-500">{card.title}</h1>
                  <p className="text-lg font-semibold">{card.value}</p>
                </div>

                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <img src={card.icon} alt="" className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-start gap-6 mb-8 w-full">
            {/* recent booking */}
            <div className="p-4 md:p-6 border border-borderColor rounded-md max-w-lg w-full">
              <h1 className="text-lg font-medium">Recent Bookings</h1>
              <p className="text-gray-500">Latest customer bookings</p>
              {data.recentBookings.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No recent bookings"
                    message="Recent bookings will appear here"
                  />
                </div>
              ) : (
                data.recentBookings.map((booking, index) => (
                  <div key={index} className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <img src={assets.listIconColored} alt="" className="h-5 w-5" />
                      </div>
                    </div>

                    <p>
                      {booking.car.brand} {booking.car.model}
                    </p>
                    <p className="text-sm text-gray-500">{booking.createdAt?.split("T")[0]}</p>
                    <div className="flex items-center gap-2 font-medium">
                      <p className="text-sm text-gray-500">
                        {currency}
                        {booking.price}
                      </p>
                      <p className="px-3 py-0.5 border border-borderColor rounded-full text-sm">
                        {booking.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Monthly Revenue */}
            <div className="p-4 md:p-6 mb-6 border border-borderColor rounded-md w-full md:max-w-xs">
              <h1 className="text-lg font-medium">Monthly Revenue</h1>
              <p className="text-gray-500">Revenue for current month</p>
              <p className="text-3xl mt-6 font-semibold text-primary">
                {currency}
                {data.monthlyRevenue}
              </p>
            </div>
          </div>

          <section className="p-4 md:p-6 mb-8 border border-borderColor rounded-md w-full max-w-3xl">
            <h2 className="text-lg">Revenue by month</h2>
            <p className="text-gray-500 mb-4">Confirmed and completed bookings, last 6 months</p>
            <RevenueChart data={data.revenueByMonth} currency={currency} />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
