package repository

import (
	"context"
	"math"
	"time"

	"github.com/dynamo-ecommerce/product-service/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ProductRepository handles database operations for products.
type ProductRepository struct {
	products   *mongo.Collection
	categories *mongo.Collection
	reviews    *mongo.Collection
}

// NewProductRepository creates a new ProductRepository.
func NewProductRepository(db *mongo.Database) *ProductRepository {
	repo := &ProductRepository{
		products:   db.Collection("products"),
		categories: db.Collection("categories"),
		reviews:    db.Collection("reviews"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *ProductRepository) ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	r.products.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "slug", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "category", Value: 1}}},
		{Keys: bson.D{{Key: "brand", Value: 1}}},
		{Keys: bson.D{{Key: "price", Value: 1}}},
		{Keys: bson.D{{Key: "ratings", Value: -1}}},
		{Keys: bson.D{{Key: "isFeatured", Value: 1}}},
		{Keys: bson.D{{Key: "isNewArrival", Value: 1}}},
		{Keys: bson.D{{Key: "isBestSeller", Value: 1}}},
		{Keys: bson.D{{Key: "sku", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{
			{Key: "name", Value: "text"},
			{Key: "description", Value: "text"},
			{Key: "tags", Value: "text"},
			{Key: "brand", Value: "text"},
		}},
	})

	r.reviews.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "productId", Value: 1}}},
		{Keys: bson.D{{Key: "userId", Value: 1}}},
	})

	r.categories.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "slug", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "parentId", Value: 1}}},
	})
}

// ─── Product Operations ─────────────────────────────────────

// Create inserts a new product.
func (r *ProductRepository) Create(ctx context.Context, product *models.Product) (*models.Product, error) {
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()
	result, err := r.products.InsertOne(ctx, product)
	if err != nil {
		return nil, err
	}
	product.ID = result.InsertedID.(primitive.ObjectID)
	return product, nil
}

// FindByID retrieves a product by ID.
func (r *ProductRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Product, error) {
	var product models.Product
	err := r.products.FindOne(ctx, bson.M{"_id": id}).Decode(&product)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// FindBySlug retrieves a product by slug.
func (r *ProductRepository) FindBySlug(ctx context.Context, slug string) (*models.Product, error) {
	var product models.Product
	err := r.products.FindOne(ctx, bson.M{"slug": slug}).Decode(&product)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// FindWithFilter retrieves products with filtering, sorting, and pagination.
func (r *ProductRepository) FindWithFilter(ctx context.Context, filter models.ProductFilter) ([]models.Product, int64, error) {
	query := bson.M{}

	if filter.Category != "" {
		query["category"] = filter.Category
	}
	if filter.SubCategory != "" {
		query["subCategory"] = filter.SubCategory
	}
	if filter.Brand != "" {
		query["brand"] = filter.Brand
	}
	if filter.Color != "" {
		query["colors"] = filter.Color
	}
	if filter.MinPrice > 0 || filter.MaxPrice > 0 {
		priceQuery := bson.M{}
		if filter.MinPrice > 0 {
			priceQuery["$gte"] = filter.MinPrice
		}
		if filter.MaxPrice > 0 {
			priceQuery["$lte"] = filter.MaxPrice
		}
		query["price"] = priceQuery
	}
	if filter.MinRating > 0 {
		query["ratings"] = bson.M{"$gte": filter.MinRating}
	}
	if filter.InStock != nil && *filter.InStock {
		query["stock"] = bson.M{"$gt": 0}
	}
	if filter.IsFeatured != nil {
		query["isFeatured"] = *filter.IsFeatured
	}
	if filter.IsNewArrival != nil {
		query["isNewArrival"] = *filter.IsNewArrival
	}
	if filter.IsBestSeller != nil {
		query["isBestSeller"] = *filter.IsBestSeller
	}
	if filter.Search != "" {
		query["$text"] = bson.M{"$search": filter.Search}
	}
	if len(filter.Tags) > 0 {
		query["tags"] = bson.M{"$in": filter.Tags}
	}

	// Count total
	total, err := r.products.CountDocuments(ctx, query)
	if err != nil {
		return nil, 0, err
	}

	// Sort
	sort := bson.D{}
	if filter.SortBy != "" {
		order := 1
		if filter.SortOrder == "desc" {
			order = -1
		}
		sort = append(sort, bson.E{Key: filter.SortBy, Value: order})
	} else {
		sort = append(sort, bson.E{Key: "createdAt", Value: -1})
	}

	// Pagination
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 12
	}
	skip := (page - 1) * limit

	opts := options.Find().
		SetSort(sort).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := r.products.Find(ctx, query, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, 0, err
	}

	if products == nil {
		products = []models.Product{}
	}

	return products, total, nil
}

// Update updates a product.
func (r *ProductRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updatedAt"] = time.Now()
	_, err := r.products.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

// AdjustStock increments or decrements the stock atomically (supporting variant stock).
func (r *ProductRepository) AdjustStock(ctx context.Context, id primitive.ObjectID, color string, delta int) error {
	if color != "" {
		res, err := r.products.UpdateOne(ctx,
			bson.M{"_id": id, "variants.color": color},
			bson.M{
				"$inc": bson.M{
					"stock":            delta,
					"variants.$.stock": delta,
				},
			},
		)
		if err == nil && res.MatchedCount > 0 {
			return nil
		}
	}
	_, err := r.products.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$inc": bson.M{"stock": delta}})
	return err
}

// Delete removes a product.
func (r *ProductRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.products.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// FindByIDs retrieves multiple products by their IDs.
func (r *ProductRepository) FindByIDs(ctx context.Context, ids []primitive.ObjectID) ([]models.Product, error) {
	if len(ids) == 0 {
		return []models.Product{}, nil
	}

	cursor, err := r.products.Find(ctx, bson.M{"_id": bson.M{"$in": ids}})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}

	if products == nil {
		products = []models.Product{}
	}

	return products, nil
}

// GetDistinctBrands returns all unique brands.
func (r *ProductRepository) GetDistinctBrands(ctx context.Context) ([]string, error) {
	results, err := r.products.Distinct(ctx, "brand", bson.M{})
	if err != nil {
		return nil, err
	}
	brands := make([]string, len(results))
	for i, r := range results {
		brands[i] = r.(string)
	}
	return brands, nil
}

// GetDistinctColors returns all unique product colors.
func (r *ProductRepository) GetDistinctColors(ctx context.Context) ([]string, error) {
	results, err := r.products.Distinct(ctx, "colors", bson.M{})
	if err != nil {
		return nil, err
	}
	colors := []string{}
	for _, val := range results {
		if str, ok := val.(string); ok && str != "" {
			colors = append(colors, str)
		}
	}
	return colors, nil
}

// GetPriceRange returns the min and max product prices.
func (r *ProductRepository) GetPriceRange(ctx context.Context) (float64, float64, error) {
	// Min
	var minResult struct{ Price float64 }
	opts := options.FindOne().SetSort(bson.D{{Key: "price", Value: 1}})
	err := r.products.FindOne(ctx, bson.M{}, opts).Decode(&minResult)
	if err != nil {
		return 0, 0, err
	}

	// Max
	var maxResult struct{ Price float64 }
	opts = options.FindOne().SetSort(bson.D{{Key: "price", Value: -1}})
	err = r.products.FindOne(ctx, bson.M{}, opts).Decode(&maxResult)
	if err != nil {
		return 0, 0, err
	}

	return math.Floor(minResult.Price), math.Ceil(maxResult.Price), nil
}

// BulkInsert inserts multiple products at once (for seeding).
func (r *ProductRepository) BulkInsert(ctx context.Context, products []interface{}) error {
	_, err := r.products.InsertMany(ctx, products)
	return err
}

// ─── Category Operations ────────────────────────────────────

// CreateCategory inserts a new category.
func (r *ProductRepository) CreateCategory(ctx context.Context, cat *models.Category) (*models.Category, error) {
	cat.CreatedAt = time.Now()
	cat.UpdatedAt = time.Now()
	result, err := r.categories.InsertOne(ctx, cat)
	if err != nil {
		return nil, err
	}
	cat.ID = result.InsertedID.(primitive.ObjectID)
	return cat, nil
}

// GetAllCategories retrieves all categories.
func (r *ProductRepository) GetAllCategories(ctx context.Context) ([]models.Category, error) {
	cursor, err := r.categories.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []models.Category
	if err := cursor.All(ctx, &categories); err != nil {
		return nil, err
	}
	if categories == nil {
		categories = []models.Category{}
	}
	return categories, nil
}

// UpdateCategory updates a category.
func (r *ProductRepository) UpdateCategory(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updatedAt"] = time.Now()
	_, err := r.categories.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

// DeleteCategory removes a category.
func (r *ProductRepository) DeleteCategory(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.categories.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// BulkInsertCategories inserts multiple categories (for seeding).
func (r *ProductRepository) BulkInsertCategories(ctx context.Context, cats []interface{}) error {
	_, err := r.categories.InsertMany(ctx, cats)
	return err
}

// CountProducts returns the total product count.
func (r *ProductRepository) CountProducts(ctx context.Context) (int64, error) {
	return r.products.CountDocuments(ctx, bson.M{})
}

// CountCategories returns the total category count.
func (r *ProductRepository) CountCategories(ctx context.Context) (int64, error) {
	return r.categories.CountDocuments(ctx, bson.M{})
}

// AddReview adds a review to a product and updates the product's rating.
func (r *ProductRepository) AddReview(ctx context.Context, review *models.Review) error {
	review.CreatedAt = time.Now()
	_, err := r.reviews.InsertOne(ctx, review)
	if err != nil {
		return err
	}

	// Calculate the new average rating
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"productId": review.ProductID}}},
		{{Key: "$group", Value: bson.M{
			"_id": "$productId",
			"avgRating": bson.M{"$avg": "$rating"},
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.reviews.Aggregate(ctx, pipeline)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	var result []struct {
		ID        primitive.ObjectID `bson:"_id"`
		AvgRating float64            `bson:"avgRating"`
		Count     int                `bson:"count"`
	}

	if err = cursor.All(ctx, &result); err != nil {
		return err
	}

	if len(result) > 0 {
		_, err = r.products.UpdateOne(
			ctx,
			bson.M{"_id": review.ProductID},
			bson.M{"$set": bson.M{
				"ratings":      result[0].AvgRating,
				"reviewsCount": result[0].Count,
			}},
		)
		return err
	}

	return nil
}

// GetReviewsByProductID retrieves reviews for a given product ID.
func (r *ProductRepository) GetReviewsByProductID(ctx context.Context, productID primitive.ObjectID) ([]models.Review, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.reviews.Find(ctx, bson.M{"productId": productID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reviews []models.Review
	if err := cursor.All(ctx, &reviews); err != nil {
		return nil, err
	}
	if reviews == nil {
		reviews = []models.Review{}
	}
	return reviews, nil
}

// HasUserReviewedProduct checks if a user has already reviewed a given product.
func (r *ProductRepository) HasUserReviewedProduct(ctx context.Context, userID, productID primitive.ObjectID) (bool, error) {
	count, err := r.reviews.CountDocuments(ctx, bson.M{"userId": userID, "productId": productID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetReviewedProductIDs returns a list of product IDs reviewed by a user.
func (r *ProductRepository) GetReviewedProductIDs(ctx context.Context, userID primitive.ObjectID) ([]string, error) {
	cursor, err := r.reviews.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reviews []models.Review
	if err := cursor.All(ctx, &reviews); err != nil {
		return nil, err
	}

	productIDs := make([]string, 0, len(reviews))
	for _, rev := range reviews {
		productIDs = append(productIDs, rev.ProductID.Hex())
	}
	return productIDs, nil
}
