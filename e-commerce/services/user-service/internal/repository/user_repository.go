package repository

import (
	"context"
	"time"

	"github.com/dynamo-ecommerce/user-service/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// UserRepository handles database operations for user profiles.
type UserRepository struct {
	collection    *mongo.Collection
	binCollection *mongo.Collection
	bankCollection *mongo.Collection
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(db *mongo.Database) *UserRepository {
	repo := &UserRepository{
		collection:    db.Collection("users"),
		binCollection: db.Collection("bins"),
		bankCollection: db.Collection("banks"),
	}
	repo.ensureIndexes()
	return repo
}

func (r *UserRepository) ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
}

// FindByID retrieves a user by their ID.
func (r *UserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmail retrieves a user by email.
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpsertByEmail creates or updates a user profile by email.
func (r *UserRepository) UpsertByEmail(ctx context.Context, email string, update bson.M) (*models.User, error) {
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var user models.User
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"email": email}, update, opts).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpsertByID creates or updates a user profile by ID, preserving the auth service ID.
func (r *UserRepository) UpsertByID(ctx context.Context, id primitive.ObjectID, update bson.M) (*models.User, error) {
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var user models.User
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": id}, update, opts).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateProfile updates user profile fields.
func (r *UserRepository) UpdateProfile(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updatedAt"] = time.Now()
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

// AddAddress appends a new address to the user's address list.
func (r *UserRepository) AddAddress(ctx context.Context, id primitive.ObjectID, address models.Address) error {
	res, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{
			"$push": bson.M{"addresses": address},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

// UpdateAddress updates a specific address in the user's address list.
func (r *UserRepository) UpdateAddress(ctx context.Context, userID, addressID primitive.ObjectID, address models.Address) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": userID, "addresses._id": addressID},
		bson.M{
			"$set": bson.M{
				"addresses.$": address,
				"updatedAt":   time.Now(),
			},
		},
	)
	return err
}

// DeleteAddress removes an address from the user's address list.
func (r *UserRepository) DeleteAddress(ctx context.Context, userID, addressID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{
			"$pull": bson.M{"addresses": bson.M{"_id": addressID}},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

// AddSavedCard appends a new saved card to the user's saved cards list.
func (r *UserRepository) AddSavedCard(ctx context.Context, id primitive.ObjectID, card models.SavedCard) error {
	res, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{
			"$push": bson.M{"savedCards": card},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

// GetSavedCards returns the user's saved cards.
func (r *UserRepository) GetSavedCards(ctx context.Context, userID primitive.ObjectID) ([]models.SavedCard, error) {
	user, err := r.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.SavedCards == nil {
		return []models.SavedCard{}, nil
	}
	return user.SavedCards, nil
}

// AddToWishlist adds a product ID to the user's wishlist.
func (r *UserRepository) AddToWishlist(ctx context.Context, userID, productID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{
			"$addToSet": bson.M{"wishlist": productID},
			"$set":      bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

// RemoveFromWishlist removes a product ID from the user's wishlist.
func (r *UserRepository) RemoveFromWishlist(ctx context.Context, userID, productID primitive.ObjectID) error {
	res, err := r.collection.UpdateOne(ctx,
		bson.M{"_id": userID},
		bson.M{
			"$pull": bson.M{"wishlist": productID},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

// GetWishlist returns the user's wishlist product IDs.
func (r *UserRepository) GetWishlist(ctx context.Context, userID primitive.ObjectID) ([]primitive.ObjectID, error) {
	user, err := r.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.Wishlist == nil {
		return []primitive.ObjectID{}, nil
	}
	return user.Wishlist, nil
}

// FindBinInfo looks up a BIN in the database.
func (r *UserRepository) FindBinInfo(ctx context.Context, bin string) (*models.BinInfo, error) {
	var info models.BinInfo
	err := r.binCollection.FindOne(ctx, bson.M{"bin": bin}).Decode(&info)
	if err != nil {
		return nil, err
	}
	return &info, nil
}

// SeedBinData inserts dummy data for internal BIN lookup testing.
func (r *UserRepository) SeedBinData(ctx context.Context) {
	// Check if already seeded
	count, err := r.binCollection.CountDocuments(ctx, bson.M{})
	if err == nil && count > 0 {
		return // Already seeded
	}

	bins := []interface{}{
		bson.M{"bin": "411111", "scheme": "Visa", "bankName": "HDFC BANK, LTD."},
		bson.M{"bin": "422222", "scheme": "Visa", "bankName": "STATE BANK OF INDIA"},
		bson.M{"bin": "511111", "scheme": "Mastercard", "bankName": "ICICI BANK LIMITED"},
		bson.M{"bin": "522222", "scheme": "Mastercard", "bankName": "AXIS BANK"},
		bson.M{"bin": "611111", "scheme": "Rupay", "bankName": "KOTAK MAHINDRA BANK"},
		bson.M{"bin": "601100", "scheme": "Discover", "bankName": "STATE BANK OF INDIA"},
	}


	r.binCollection.InsertMany(ctx, bins)
}

// GetAllBanks retrieves all seeded banks.
func (r *UserRepository) GetAllBanks(ctx context.Context) ([]models.Bank, error) {
	var banks []models.Bank
	cursor, err := r.bankCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err = cursor.All(ctx, &banks); err != nil {
		return nil, err
	}
	return banks, nil
}

// SeedBanksData seeds the database with the initial list of Indian banks.
func (r *UserRepository) SeedBanksData(ctx context.Context) {
	// Drop existing to apply the updated list
	r.bankCollection.DeleteMany(ctx, bson.M{})

	bankNames := []string{
		// Top 5 banks for radio buttons
		"Axis Bank", "HDFC Bank", "ICICI Bank", "Kotak Mahindra Bank", "State Bank of India",
		// The rest for the Other Banks modal
		"Airtel payments bank", "AU Small Finance Bank", "Bandhan Bank", "Bank of Baroda Corporate",
		"Bank of Baroda Retail Accounts", "Bank of India", "Bank of Maharashtra", "Canara Bank",
		"Catholic Syrian Bank", "Central Bank of India", "City Union Bank", "COSMOS Bank",
		"DCB BANK Personal", "Deutsche Bank", "Dhanlaxmi Bank", "Federal Bank", "IDFC FIRST Bank Limited",
		"Indian Bank", "Indian Overseas Bank", "IndusInd Bank", "Industrial Development Bank of India",
		"Jammu and kashmir Bank", "Jana Small Finance Bank", "Janata Sahakari Bank", "Karnataka Bank",
		"Karur Vysya - Corporate Netbanking", "Karur Vysya Bank", "Lakshmi Vilas Bank", "PayU Money",
		"Punjab and Sind Bank", "Punjab National Bank (Erstwhile Oriental Bank of Commerce)",
		"Punjab National Bank [Corporate]", "Punjab National Bank [Retail]", "Ratnakar Bank", "RBL",
		"Saraswat Bank", "Shamrao Vithal Bank", "South Indian Bank", "Standard Chartered Bank",
		"State Bank Of Bikaner and Jaipur", "State Bank of Hyderabad", "State Bank of Mysore",
		"State Bank of Patiala", "State Bank of Travancore", "Syndicate Bank", "Tamilnad Mercantile Bank",
		"UCO Bank", "Union Bank - Corporate Netbanking", "Union Bank of India (Erstwhile Andhra Bank)",
		"United Bank of India", "Vijaya Bank", "YES Bank",
	}

	var banksToInsert []interface{}
	for _, name := range bankNames {
		banksToInsert = append(banksToInsert, bson.M{"name": name})
	}

	r.bankCollection.InsertMany(ctx, banksToInsert)
}
