package handler

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/dynamo-ecommerce/product-service/internal/models"
	"github.com/dynamo-ecommerce/product-service/internal/repository"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ProductHandler handles HTTP requests for products.
type ProductHandler struct {
	repo *repository.ProductRepository
}

// NewProductHandler creates a new ProductHandler.
func NewProductHandler(repo *repository.ProductRepository) *ProductHandler {
	return &ProductHandler{repo: repo}
}

// GetProducts returns paginated and filtered products.
// GET /api/v1/products
func (h *ProductHandler) GetProducts(c *fiber.Ctx) error {
	filter := models.ProductFilter{
		Category:    c.Query("category"),
		SubCategory: c.Query("subCategory"),
		Brand:       c.Query("brand"),
		Color:       c.Query("color"),
		Search:      c.Query("search"),
		SortBy:      c.Query("sortBy", "createdAt"),
		SortOrder:   c.Query("sortOrder", "desc"),
	}

	if p := c.Query("page"); p != "" {
		filter.Page, _ = strconv.Atoi(p)
	}
	if l := c.Query("limit"); l != "" {
		filter.Limit, _ = strconv.Atoi(l)
	}
	if min := c.Query("minPrice"); min != "" {
		filter.MinPrice, _ = strconv.ParseFloat(min, 64)
	}
	if max := c.Query("maxPrice"); max != "" {
		filter.MaxPrice, _ = strconv.ParseFloat(max, 64)
	}
	if r := c.Query("minRating"); r != "" {
		filter.MinRating, _ = strconv.ParseFloat(r, 64)
	}
	if inStock := c.Query("inStock"); inStock != "" {
		v := inStock == "true"
		filter.InStock = &v
	}
	if tags := c.Query("tags"); tags != "" {
		filter.Tags = strings.Split(tags, ",")
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 12
	}

	products, total, err := h.repo.FindWithFilter(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch products"},
		})
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))

	return c.JSON(fiber.Map{
		"success": true,
		"data":    products,
		"pagination": fiber.Map{
			"page":       filter.Page,
			"limit":      filter.Limit,
			"total":      total,
			"totalPages": totalPages,
			"hasNext":    filter.Page < totalPages,
			"hasPrev":    filter.Page > 1,
		},
	})
}

// GetProductBySlug returns a single product by slug or ID.
// GET /api/v1/products/:slug
func (h *ProductHandler) GetProductBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	product, err := h.repo.FindBySlug(c.Context(), slug)
	if err != nil {
		// Fallback: try to find by ObjectID
		if oid, parseErr := primitive.ObjectIDFromHex(slug); parseErr == nil {
			product, err = h.repo.FindByID(c.Context(), oid)
		}
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 404, "message": "Product not found"},
			})
		}
	}
	return c.JSON(fiber.Map{"success": true, "data": product})
}

// GetFeaturedProducts returns featured products.
// GET /api/v1/products/featured
func (h *ProductHandler) GetFeaturedProducts(c *fiber.Ctx) error {
	featured := true
	filter := models.ProductFilter{IsFeatured: &featured, Limit: 8, Page: 1}
	products, _, err := h.repo.FindWithFilter(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch featured products"},
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": products})
}

// GetNewArrivals returns new arrival products.
// GET /api/v1/products/new-arrivals
func (h *ProductHandler) GetNewArrivals(c *fiber.Ctx) error {
	newArrival := true
	filter := models.ProductFilter{IsNewArrival: &newArrival, Limit: 8, Page: 1}
	products, _, err := h.repo.FindWithFilter(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch new arrivals"},
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": products})
}

// GetBestSellers returns best-selling products.
// GET /api/v1/products/best-sellers
func (h *ProductHandler) GetBestSellers(c *fiber.Ctx) error {
	bestSeller := true
	filter := models.ProductFilter{IsBestSeller: &bestSeller, Limit: 8, Page: 1}
	products, _, err := h.repo.FindWithFilter(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch best sellers"},
		})
	}
	return c.JSON(fiber.Map{"success": true, "data": products})
}

// GetFilterOptions returns available filter values (brands, price range).
// GET /api/v1/products/filters
func (h *ProductHandler) GetFilterOptions(c *fiber.Ctx) error {
	brands, _ := h.repo.GetDistinctBrands(c.Context())
	colors, _ := h.repo.GetDistinctColors(c.Context())
	minPrice, maxPrice, _ := h.repo.GetPriceRange(c.Context())

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"brands":   brands,
			"colors":   colors,
			"minPrice": minPrice,
			"maxPrice": maxPrice,
		},
	})
}

// GetProductsByIDs returns products matching the given IDs.
// POST /api/v1/products/batch
func (h *ProductHandler) GetProductsByIDs(c *fiber.Ctx) error {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if len(req.IDs) == 0 {
		return c.JSON(fiber.Map{"success": true, "data": []interface{}{}})
	}

	// Cap at 50 IDs per request
	if len(req.IDs) > 50 {
		req.IDs = req.IDs[:50]
	}

	objectIDs := make([]primitive.ObjectID, 0, len(req.IDs))
	for _, id := range req.IDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			continue // Skip invalid IDs
		}
		objectIDs = append(objectIDs, objID)
	}

	products, err := h.repo.FindByIDs(c.Context(), objectIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch products"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": products})
}

// CreateProduct creates a new product (admin only).
// POST /api/v1/products
func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	var req models.CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))
	product := &models.Product{
		Name:           req.Name,
		Slug:           slug,
		Brand:          req.Brand,
		Category:       req.Category,
		SubCategory:    req.SubCategory,
		Description:    req.Description,
		Specifications: req.Specifications,
		Features:       req.Features,
		Images:         req.Images,
		Price:          req.Price,
		DiscountPrice:  req.DiscountPrice,
		Stock:          req.Stock,
		SKU:            req.SKU,
		Tags:           req.Tags,
		IsFeatured:     req.IsFeatured,
		IsNewArrival:   req.IsNewArrival,
		IsBestSeller:   req.IsBestSeller,
		Colors:         req.Colors,
		Variants:       req.Variants,
	}

	product, err := h.repo.Create(c.Context(), product)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to create product"},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "message": "Product created", "data": product,
	})
}

// UpdateProduct updates a product (admin only).
// PUT /api/v1/products/:id
func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	update := bson.M{}
	for k, v := range body {
		update[k] = v
	}

	if err := h.repo.Update(c.Context(), id, update); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update product"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Product updated"})
}

// DeleteProduct deletes a product (admin only).
// DELETE /api/v1/products/:id
func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	if err := h.repo.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to delete product"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Product deleted"})
}

// ─── Categories ─────────────────────────────────────────────

// GetCategories returns all categories.
// GET /api/v1/categories
func (h *ProductHandler) GetCategories(c *fiber.Ctx) error {
	categories, err := h.repo.GetAllCategories(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch categories"},
		})
	}

	// Build tree structure
	tree := buildCategoryTree(categories, nil)

	return c.JSON(fiber.Map{"success": true, "data": tree})
}

// CreateCategory creates a new category (admin only).
// POST /api/v1/categories
func (h *ProductHandler) CreateCategory(c *fiber.Ctx) error {
	var req models.CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))
	cat := &models.Category{
		Name:        req.Name,
		Slug:        slug,
		Description: req.Description,
		Image:       req.Image,
	}

	if req.ParentID != nil {
		parentObjID, err := primitive.ObjectIDFromHex(*req.ParentID)
		if err == nil {
			cat.ParentID = &parentObjID
		}
	}

	cat, err := h.repo.CreateCategory(c.Context(), cat)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to create category"},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "message": "Category created", "data": cat,
	})
}

// UpdateCategory updates a category (admin only).
// PUT /api/v1/categories/:id
func (h *ProductHandler) UpdateCategory(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid category ID"},
		})
	}

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	update := bson.M{}
	for k, v := range body {
		update[k] = v
	}

	if err := h.repo.UpdateCategory(c.Context(), id, update); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update category"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Category updated"})
}

// AdjustStock increments or decrements stock (internal use).
// POST /api/v1/products/internal/:id/stock
func (h *ProductHandler) AdjustStock(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	var req struct {
		Delta int    `json:"delta"`
		Color string `json:"color"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if err := h.repo.AdjustStock(c.Context(), id, req.Color, req.Delta); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update stock"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Stock adjusted"})
}

// DeleteCategory deletes a category (admin only).
// DELETE /api/v1/categories/:id
func (h *ProductHandler) DeleteCategory(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid category ID"},
		})
	}

	if err := h.repo.DeleteCategory(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to delete category"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Category deleted"})
}

// buildCategoryTree constructs a tree from flat categories.
func buildCategoryTree(categories []models.Category, parentID *primitive.ObjectID) []models.Category {
	var tree []models.Category
	for _, cat := range categories {
		if (parentID == nil && cat.ParentID == nil) || (parentID != nil && cat.ParentID != nil && *cat.ParentID == *parentID) {
			cat.Children = buildCategoryTree(categories, &cat.ID)
			tree = append(tree, cat)
		}
	}
	return tree
}

// AddReview handles adding a review for a product.
// POST /api/v1/products/:id/reviews
func (h *ProductHandler) AddReview(c *fiber.Ctx) error {
	productID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 401, "message": "Unauthorized"},
		})
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid user ID"},
		})
	}

	userName, ok := c.Locals("userName").(string)
	if !ok {
		userName = "Anonymous"
	}

	var req models.CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Rating must be between 1 and 5"},
		})
	}

	hasReviewed, err := h.repo.HasUserReviewedProduct(c.Context(), userObjID, productID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to check existing reviews"},
		})
	}
	if hasReviewed {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 409, "message": "You have already reviewed this product"},
		})
	}

	review := &models.Review{
		ProductID: productID,
		UserID:    userObjID,
		UserName:  userName,
		Rating:    req.Rating,
		Comment:   req.Comment,
		Images:    req.Images,
	}

	if err := h.repo.AddReview(c.Context(), review); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to add review"},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "message": "Review added successfully", "data": review,
	})
}

// GetProductReviews handles fetching reviews for a product.
// GET /api/v1/products/:id/reviews
func (h *ProductHandler) GetProductReviews(c *fiber.Ctx) error {
	productID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	reviews, err := h.repo.GetReviewsByProductID(c.Context(), productID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch reviews"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": reviews})
}

// GetReviewedProducts returns the product IDs reviewed by the logged-in user.
// GET /api/v1/products/reviews/me
func (h *ProductHandler) GetReviewedProducts(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 401, "message": "Unauthorized"},
		})
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid user ID"},
		})
	}

	productIDs, err := h.repo.GetReviewedProductIDs(c.Context(), userObjID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch reviewed products"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": productIDs})
}

// UploadImage handles image uploads for product reviews.
// POST /api/v1/products/upload
func (h *ProductHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Image file is required"},
		})
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to create upload directory"},
		})
	}

	filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(file.Filename))
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to save image"},
		})
	}

	// Build the public URL (assuming product-service is on 8083 or behind API gateway)
	// In production this would be an S3 URL. Here we'll return a relative path that the frontend can prefix.
	// We'll serve the /uploads directory via Fiber.
	imageURL := fmt.Sprintf("/uploads/%s", filename)

	return c.JSON(fiber.Map{
		"success": true,
		"data":    fiber.Map{"url": imageURL},
	})
}
