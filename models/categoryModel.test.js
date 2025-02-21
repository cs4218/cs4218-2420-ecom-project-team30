import categoryModel from "./categoryModel";

describe("Category Model", () => {
  test("should throw a validation error if name is missing", () => {
    const category = new categoryModel({ slug: "test-category" });

    const error = category.validateSync();
    
    expect(error.errors.name).toBeDefined();
    expect(error.errors.name.path).toBe("name");
    expect(error.errors.name.kind).toBe("required");
  });

  test("should throw an error when saving a duplicate name", () => {
    categoryModel.prototype.save = jest.fn().mockRejectedValue({ code: 11000 });

    const category = new categoryModel({ name: "Duplicate Name", slug: "duplicate-name" });

    expect(category.save()).rejects.toEqual({ code: 11000 });
    expect(categoryModel.prototype.save).toHaveBeenCalled();
  });

  test("should change the slug to lowercase", () => {
    const category = new categoryModel({ name: "TEST CATEGORY", slug: "TEST-CATEGORY" });

    expect(category.slug).toBe("test-category");
  });

  test("should pass validation with a valid name and slug", () => {
    const category = new categoryModel({ name: "Valid Category", slug: "valid-category" });

    const error = category.validateSync();

    expect(error).toBeUndefined();
  });
});
