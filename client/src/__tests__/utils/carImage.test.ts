import { describe, it, expect } from "vitest";
import { carImage } from "../../utils/carImage";

const CDN = "https://d3c38yoff69w1u.cloudfront.net/cars";

describe("carImage", () => {
  it("maps a seeded photo to the small WebP for cards", () => {
    expect(carImage(`${CDN}/car17.jpg`)).toBe("/cars/car17-640.webp");
    expect(carImage(`${CDN}/car7.png`)).toBe("/cars/car7-640.webp");
  });

  it("uses the 1200px version for the large size", () => {
    expect(carImage(`${CDN}/car2.jpg`, "large")).toBe("/cars/car2-1200.webp");
  });

  it("leaves other URLs (owner uploads) untouched", () => {
    const upload = "https://example.com/uploads/my-car.jpg";
    expect(carImage(upload)).toBe(upload);
    expect(carImage("https://d3c38yoff69w1u.cloudfront.net/optimized/x-large.jpg")).toBe(
      "https://d3c38yoff69w1u.cloudfront.net/optimized/x-large.jpg"
    );
  });

  it("returns an empty string for missing values", () => {
    expect(carImage(undefined)).toBe("");
    expect(carImage(null)).toBe("");
  });
});
