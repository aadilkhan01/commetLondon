package repository

import (
	"context"
	"time"

	"github.com/dynamo-ecommerce/auth-service/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AuthRepository handles all database operations for authentication.
type AuthRepository struct {
	credentials   *mongo.Collection
	refreshTokens *mongo.Collection
}

// NewAuthRepository creates a new AuthRepository.
func NewAuthRepository(db *mongo.Database) *AuthRepository {
	repo := &AuthRepository{
		credentials:   db.Collection("credentials"),
		refreshTokens: db.Collection("refresh_tokens"),
	}
	repo.ensureIndexes()
	return repo
}

// ensureIndexes creates necessary database indexes.
func (r *AuthRepository) ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	r.credentials.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "mobile", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "googleId", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
	})

	r.refreshTokens.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "userId", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "token", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "expiresAt", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(0),
		},
	})
}

// CreateCredential inserts a new user credential.
func (r *AuthRepository) CreateCredential(ctx context.Context, cred *models.Credential) (*models.Credential, error) {
	cred.CreatedAt = time.Now()
	cred.UpdatedAt = time.Now()

	result, err := r.credentials.InsertOne(ctx, cred)
	if err != nil {
		return nil, err
	}

	cred.ID = result.InsertedID.(primitive.ObjectID)
	return cred, nil
}

// FindByEmail finds a credential by email address.
func (r *AuthRepository) FindByEmail(ctx context.Context, email string) (*models.Credential, error) {
	var cred models.Credential
	err := r.credentials.FindOne(ctx, bson.M{"email": email}).Decode(&cred)
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

// FindByMobile finds a credential by mobile number.
func (r *AuthRepository) FindByMobile(ctx context.Context, mobile string) (*models.Credential, error) {
	var cred models.Credential
	err := r.credentials.FindOne(ctx, bson.M{"mobile": mobile}).Decode(&cred)
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

// FindByID finds a credential by ID.
func (r *AuthRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Credential, error) {
	var cred models.Credential
	err := r.credentials.FindOne(ctx, bson.M{"_id": id}).Decode(&cred)
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

// FindByGoogleID finds a credential by Google ID.
func (r *AuthRepository) FindByGoogleID(ctx context.Context, googleID string) (*models.Credential, error) {
	var cred models.Credential
	err := r.credentials.FindOne(ctx, bson.M{"googleId": googleID}).Decode(&cred)
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

// UpdatePassword updates the user's password.
func (r *AuthRepository) UpdatePassword(ctx context.Context, id primitive.ObjectID, hashedPassword string) error {
	_, err := r.credentials.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"password":  hashedPassword,
			"updatedAt": time.Now(),
		}},
	)
	return err
}

// VerifyEmail marks a user's email as verified.
func (r *AuthRepository) VerifyEmail(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.credentials.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"emailVerified": true,
			"isVerified":    true,
			"updatedAt":     time.Now(),
		}},
	)
	return err
}

// SaveRefreshToken stores a new refresh token.
func (r *AuthRepository) SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	token.CreatedAt = time.Now()
	_, err := r.refreshTokens.InsertOne(ctx, token)
	return err
}

// FindRefreshToken finds a refresh token by its value.
func (r *AuthRepository) FindRefreshToken(ctx context.Context, tokenStr string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.refreshTokens.FindOne(ctx, bson.M{"token": tokenStr}).Decode(&token)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

// DeleteRefreshToken removes a specific refresh token.
func (r *AuthRepository) DeleteRefreshToken(ctx context.Context, tokenStr string) error {
	_, err := r.refreshTokens.DeleteOne(ctx, bson.M{"token": tokenStr})
	return err
}

// DeleteAllRefreshTokens removes all refresh tokens for a user (logout everywhere).
func (r *AuthRepository) DeleteAllRefreshTokens(ctx context.Context, userID primitive.ObjectID) error {
	_, err := r.refreshTokens.DeleteMany(ctx, bson.M{"userId": userID})
	return err
}

// UpsertCredentialByMobile creates or updates a credential for mobile-based auth.
func (r *AuthRepository) UpsertCredentialByMobile(ctx context.Context, mobile string) (*models.Credential, error) {
	filter := bson.M{"mobile": mobile}
	update := bson.M{
		"$setOnInsert": bson.M{
			"mobile":         mobile,
			"provider":       "mobile",
			"role":           "CUSTOMER",
			"isVerified":     true,
			"mobileVerified": true,
			"createdAt":      time.Now(),
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var cred models.Credential
	err := r.credentials.FindOneAndUpdate(ctx, filter, update, opts).Decode(&cred)
	if err != nil {
		return nil, err
	}

	return &cred, nil
}
