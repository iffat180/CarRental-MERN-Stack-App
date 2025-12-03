import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import LoadingState from "../../components/owner/LoadingState";
import ErrorState from "../../components/owner/ErrorState";
import EmptyState from "../../components/owner/EmptyState";
import TableSkeleton from "../../components/owner/TableSkeleton";
import ConfirmModal from "../../components/owner/ConfirmModal";

const ManageCars = () => {
  const { isOwner, axios, currency } = useAppContext();

  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);

  const fetchOwnerCars = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/owner/cars");
      if (data.success) {
        setCars(data.cars);
      } else {
        const errorMessage = data.message || "Failed to fetch cars";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch cars";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailablity = async (carId) => {
    setActionLoading(carId);
    try {
      const { data } = await axios.post("/api/owner/toggle-cars", { carId });
      if (data.success) {
        toast.success(data.message);
        fetchOwnerCars();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to toggle availability";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (carId) => {
    if (actionLoading) return;
    setCarToDelete(carId);
    setShowDeleteModal(true);
  };

  const deleteCar = async () => {
    if (!carToDelete) return;
    
    setActionLoading(carToDelete);
    setShowDeleteModal(false);
    
    try {
      const { data } = await axios.post("/api/owner/delete-car", { carId: carToDelete });
      if (data.success) {
        toast.success(data.message);
        fetchOwnerCars();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete car";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
      setCarToDelete(null);
    }
  };

  useEffect(() => {
    isOwner && fetchOwnerCars();
  }, [isOwner]);

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <Title
        title="Manage Cars"
        subTitle="View all listed cars, update their details, or remove them from the booking platform."
      />

      {/* Loading State */}
      {isLoading && <TableSkeleton rows={5} />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState error={error} onRetry={fetchOwnerCars} retryLabel="Retry" />
      )}

      {/* Empty State */}
      {!isLoading && !error && cars.length === 0 && (
        <EmptyState 
          title="No cars found" 
          message="You haven't added any cars yet. Start by adding your first car!"
        />
      )}

      {/* Cars Table */}
      {!isLoading && !error && cars.length > 0 && (
        <div className="max-w-3xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="text-gray-500">
              <tr>
                <th className="p-3 font-medium">Car</th>
                <th className="p-3 font-medium max-md:hidden">Category</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium max-md:hidden">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {cars.map((car, index) => (
              <tr key={index} className="border-t border-borderColor">
                {/* Car cell */}
                <td className="p-3 flex items-center gap-3">
                  <img
                    src={car.image}
                    alt=""
                    className="h-12 w-12 aspect-square rounded-md object-cover"
                  />
                  <div className="max-md:hidden">
                    <p className="font-medium">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {car.seating_capacity} • {car.transmission}
                    </p>
                  </div>
                </td>

                {/* Category */}
                <td className="p-3 max-md:hidden">{car.category}</td>

                {/* Price */}
                <td className="p-3">
                  {currency}
                  {car.pricePerDay}/day
                </td>

                {/* Status */}
                <td className="p-3 max-md:hidden">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      car.isAvailable
                        ? "bg-green-100 text-green-500"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {car.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </td>

                {/* Actions */}
                <td className="flex items-center p-3">
                  <img
                    onClick={() => !actionLoading && toggleAvailablity(car._id)}
                    src={
                      car.isAvailable ? assets.eye_close_icon : assets.eye_icon
                    }
                    alt=""
                    className={`cursor-pointer ${
                      actionLoading === car._id ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                  <img
                    onClick={() => !actionLoading && handleDeleteClick(car._id)}
                    src={assets.delete_icon}
                    alt=""
                    className={`cursor-pointer ml-2 ${
                      actionLoading === car._id ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCarToDelete(null);
        }}
        onConfirm={deleteCar}
        title="Delete Car"
        message="Are you sure you want to delete this car? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ManageCars;
