import Category from "../model/category.model.js";

export const addCategory = (req, res) => {
  const { name, description } = req.body;
  try {
    if (req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    const newCategory = new Category({ name, description });
    newCategory.save();
    res
      .status(201)
      .json({ message: "Category added successfully", category: newCategory });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markCategoryAsSubCategory = async (req, res) => {
  const { categoryId, parentCategoryId } = req.body;
  try {
    if (req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    const category = await Category.findById(categoryId);
    const parentCategory = await Category.findById(parentCategoryId);

    if (!category || !parentCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.parentCategory = parentCategoryId;
    await category.save();

    res
      .status(200)
      .json({ message: "Category marked as sub-category successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    const categories = await Category.find();
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSubCategories = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const subCategories = await Category.find({ parentCategory: categoryId });
    res.status(200).json({ subCategories });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  const { categoryId, name, description, parentCategoryId } = req.body;
  if (!categoryId) {
    return res.status(400).json({ message: "Category ID is required" });
  }
  if (!name && !description && !parentCategoryId) {
    return res.status(400).json({
      message:
        "At least one field (name, description, parentCategoryId) must be provided for update",
    });
  }
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (name) category.name = name;
    if (description) category.description = description;
    if (parentCategoryId !== undefined)
      category.parentCategory = parentCategoryId;

    await category.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.body;
  try {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
