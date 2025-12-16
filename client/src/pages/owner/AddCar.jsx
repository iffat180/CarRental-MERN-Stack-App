import React, { useState, useEffect } from "react";
import Title from "../../components/owner/Title";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const AddCar = () => {
  const { axios, currency } = useAppContext();

  const [image, setImage] = useState(null);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [car, setCar] = useState({
    brand: "",
    model: "",
    year: 0,
    pricePerDay: 0,
    category: "",
    transmission: "",
    fuel_type: "",
    seating_capacity: 0,
    location: "",
    description: "",
    mpg: "",
    trunk_capacity: "",
    tags: "",
    tagsArray: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mpg" || name === "trunk_capacity") {
      const numericValue = value === "" ? "" : Math.max(0, Number(value));
      setCar((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    if (name === "tags") {
      const tagsArray = value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      setCar((prev) => ({
        ...prev,
        tags: value,
        tagsArray,
      }));
      return;
    }

    setCar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (isLoading) return null;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      const payload = {
        ...car,
        mpg: car.mpg === "" ? undefined : Number(car.mpg),
        trunk_capacity:
          car.trunk_capacity === "" ? undefined : Number(car.trunk_capacity),
        tags: car.tagsArray && car.tagsArray.length ? car.tagsArray : [],
      };
      delete payload.tagsArray;

      formData.append("carData", JSON.stringify(payload));

      const { data } = await axios.post("/api/owner/add-car", formData);
      if (data.success) {
        toast.success(data.message);
        setImage(null);
        setCar({
          brand: "",
          model: "",
          year: 0,
          pricePerDay: 0,
          category: "",
          transmission: "",
          fuel_type: "",
          seating_capacity: 0,
          location: "",
          description: "",
          mpg: "",
          trunk_capacity: "",
          tags: "",
          tagsArray: [],
        });
      } else {
        toast.error("Please fill all fields");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const { data } = await axios.get("/api/user/cities");
        if (data.success) {
          setCities(data.cities);
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        // Fallback to empty array if fetch fails
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [axios]);

  return (
    <div className="px-4 py-10 md:px-10 flex-1">
      <Title
        title="Add New Car"
        subTitle="Fill in details to list a new car for booking, including pricing, availability, and car specifications."
      />

      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-5 text-gray-500 text-sm mt-6 max-w-xl"
        noValidate
      >
        {/* Car Image */}
        <div className="flex items-center gap-2 w-full">
          <label htmlFor="car-image" className="cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_icon}
              alt={image ? "Preview of car image to upload" : "Upload car image icon"}
              className="h-14 rounded"
            />
            <input
              type="file"
              id="car-image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
              aria-label="Upload car image"
            />
          </label>
          <p className="text-sm text-gray-500">Upload a picture of your car</p>
        </div>

        {/* Car Brand & Model */}
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border-0 p-0 m-0">
          <legend className="sr-only">Car Brand and Model</legend>
          <div className="flex flex-col w-full">
            <label htmlFor="car-brand">
              Brand <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="car-brand"
              type="text"
              placeholder="e.g. BMW, Mercedes, Audi..."
              required
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              value={car.brand}
              onChange={(e) => setCar({ ...car, brand: e.target.value })}
              aria-required="true"
            />
          </div>

          <div className="flex flex-col w-full">
            <label htmlFor="car-model">
              Model <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="car-model"
              type="text"
              placeholder="e.g. X5, E-Class, M4..."
              required
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              value={car.model}
              onChange={(e) => setCar({ ...car, model: e.target.value })}
              aria-required="true"
            />
          </div>
        </fieldset>

        {/* Car Year, Daily Price, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col w-full">
            <label>Year</label>
            <input
              type="number"
              placeholder="2025"
              required
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.year}
              onChange={(e) => setCar({ ...car, year: Number(e.target.value) })}
            />
          </div>

          <div className="flex flex-col w-full">
            <label>
              Daily Price <span>({currency})</span>
            </label>
            <input
              type="number"
              placeholder="100"
              required
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.pricePerDay}
              onChange={(e) =>
                setCar({ ...car, pricePerDay: Number(e.target.value) })
              }
            />
          </div>

          <div className="flex flex-col w-full">
            <label>Category</label>
            <select
              onChange={(e) => setCar({ ...car, category: e.target.value })}
              value={car.category}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select a category</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
            </select>
          </div>
        </div>

        {/* Transmission, Fuel Type, Seating Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col w-full">
            <label>Transmission</label>
            <select
              onChange={(e) => setCar({ ...car, transmission: e.target.value })}
              value={car.transmission}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select a transmission</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
              <option value="Semi-Automatic">Semi-Automatic</option>
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label>Fuel Type</label>
            <select
              onChange={(e) => setCar({ ...car, fuel_type: e.target.value })}
              value={car.fuel_type}
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            >
              <option value="">Select a fuel type</option>
              <option value="Gas">Gas</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label>Seating Capacity</label>
            <input
              type="number"
              placeholder="4"
              required
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.seating_capacity}
              onChange={(e) =>
                setCar({ ...car, seating_capacity: Number(e.target.value) })
              }
            />
          </div>
        </div>

        {/* Efficiency & Capacity Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex flex-col w-full">
            <label>MPG</label>
            <input
              type="number"
              name="mpg"
              min={0}
              placeholder="E.g. 22"
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.mpg}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col w-full">
            <label>Trunk (L)</label>
            <input
              type="number"
              name="trunk_capacity"
              min={0}
              placeholder="E.g. 450"
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.trunk_capacity}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col w-full sm:col-span-2 md:col-span-1">
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              placeholder="Luxury, AWD, Fuel Efficient"
              className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
              value={car.tags}
              onChange={handleChange}
            />
            <span className="text-xs text-gray-400 mt-1">
              Comma-separated tags help describe trip suitability
            </span>
          </div>
        </div>

        {/* Car Location */}
        <div className="flex flex-col w-full">
          <label>Location</label>
          <select
            onChange={(e) => setCar({ ...car, location: e.target.value })}
            value={car.location}
            disabled={isLoadingCities}
            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
          >
            <option value="">Select a location</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col w-full">
          <label>Description</label>
          <textarea
            rows={4}
            placeholder="Key features, condition, mileage, etc."
            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
            value={car.description}
            onChange={(e) => setCar({ ...car, description: e.target.value })}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          aria-disabled={isLoading}
          aria-busy={isLoading}
          className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Listing...' : 'List Your Car'}
        </button>
      </form>
    </div>
  );
};

export default AddCar;
