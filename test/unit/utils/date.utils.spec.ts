import { DateUtils } from "src/utils/date.utils";

describe("DateUtils", () => {
  describe("addHours", () => {
    it("should add hours to a date", () => {
      const date = new Date("2024-01-01T10:00:00Z");
      const result = DateUtils.addHours(date, 5);
      const expectedTime = date.getTime() + (5 * 60 * 60 * 1000);
      expect(result.getTime()).toBe(expectedTime);
    });

    it("should handle negative hours", () => {
      const date = new Date("2024-01-01T10:00:00Z");
      const result = DateUtils.addHours(date, -3);
      const expectedTime = date.getTime() + (-3 * 60 * 60 * 1000);
      expect(result.getTime()).toBe(expectedTime);
    });

    it("should not mutate the original date", () => {
      const date = new Date("2024-01-01T10:00:00Z");
      const originalHours = date.getHours();
      DateUtils.addHours(date, 5);
      expect(date.getHours()).toBe(originalHours);
    });

    it("should handle day overflow", () => {
      const date = new Date("2024-01-01T22:00:00Z");
      const result = DateUtils.addHours(date, 5);
      expect(result.getDate()).toBe(2);
    });

    it("should handle month overflow", () => {
      const date = new Date("2024-01-31T23:00:00Z");
      const result = DateUtils.addHours(date, 2);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(1);
    });
  });
});

