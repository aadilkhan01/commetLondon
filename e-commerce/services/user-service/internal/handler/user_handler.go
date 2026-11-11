package handler

import (
	"github.com/dynamo-ecommerce/user-service/internal/models"
	"github.com/dynamo-ecommerce/user-service/internal/repository"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserHandler handles HTTP requests for user operations.
type UserHandler struct {
	repo *repository.UserRepository
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

// GetProfile returns the current user's profile.
// GET /api/v1/users/profile
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	email := c.Locals("email").(string)

	objID, _ := primitive.ObjectIDFromHex(userID)
	user, err := h.repo.FindByID(c.Context(), objID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Auto-create profile using the auth service ID so FindByID works on subsequent calls
			user, err = h.repo.UpsertByID(c.Context(), objID, bson.M{
				"$setOnInsert": bson.M{
					"_id":       objID,
					"email":     email,
					"addresses": []models.Address{},
					"wishlist":  []primitive.ObjectID{},
				},
			})
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"success": false, "error": fiber.Map{"code": 500, "message": "Failed to create profile"},
				})
			}
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get profile"},
			})
		}
	}

	return c.JSON(fiber.Map{"success": true, "data": user})
}

// UpdateProfile updates the current user's profile.
// PUT /api/v1/users/profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objID, _ := primitive.ObjectIDFromHex(userID)

	var req models.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	update := bson.M{}
	if req.FirstName != "" {
		update["firstName"] = req.FirstName
	}
	if req.LastName != "" {
		update["lastName"] = req.LastName
	}
	if req.Mobile != "" {
		update["mobile"] = req.Mobile
	}
	if req.ProfileImage != "" {
		update["profileImage"] = req.ProfileImage
	}

	if len(update) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "No fields to update"},
		})
	}

	if err := h.repo.UpdateProfile(c.Context(), objID, update); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update profile"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Profile updated successfully"})
}

// AddAddress adds a new address.
// POST /api/v1/users/addresses
func (h *UserHandler) AddAddress(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objID, _ := primitive.ObjectIDFromHex(userID)

	var req models.AddAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	address := models.Address{
		ID:           primitive.NewObjectID(),
		FullName:     req.FullName,
		Phone:        req.Phone,
		AddressLine1: req.AddressLine1,
		AddressLine2: req.AddressLine2,
		City:         req.City,
		State:        req.State,
		ZipCode:      req.ZipCode,
		Country:      req.Country,
		IsDefault:    req.IsDefault,
	}

	if err := h.repo.AddAddress(c.Context(), objID, address); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to add address"},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "message": "Address added successfully", "data": address,
	})
}

// UpdateAddress updates an existing address.
// PUT /api/v1/users/addresses/:id
func (h *UserHandler) UpdateAddress(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	addressID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid address ID"},
		})
	}

	var req models.AddAddressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	address := models.Address{
		ID:           addressID,
		FullName:     req.FullName,
		Phone:        req.Phone,
		AddressLine1: req.AddressLine1,
		AddressLine2: req.AddressLine2,
		City:         req.City,
		State:        req.State,
		ZipCode:      req.ZipCode,
		Country:      req.Country,
		IsDefault:    req.IsDefault,
	}

	if err := h.repo.UpdateAddress(c.Context(), userObjID, addressID, address); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update address"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Address updated successfully"})
}

// DeleteAddress removes an address.
// DELETE /api/v1/users/addresses/:id
func (h *UserHandler) DeleteAddress(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	addressID, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid address ID"},
		})
	}

	if err := h.repo.DeleteAddress(c.Context(), userObjID, addressID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to delete address"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Address deleted successfully"})
}

// AddToWishlist adds a product to the wishlist.
// POST /api/v1/users/wishlist/:productId
func (h *UserHandler) AddToWishlist(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	productID, err := primitive.ObjectIDFromHex(c.Params("productId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	if err := h.repo.AddToWishlist(c.Context(), userObjID, productID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to add to wishlist"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Added to wishlist"})
}

// RemoveFromWishlist removes a product from the wishlist.
// DELETE /api/v1/users/wishlist/:productId
func (h *UserHandler) RemoveFromWishlist(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	productID, err := primitive.ObjectIDFromHex(c.Params("productId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"},
		})
	}

	if err := h.repo.RemoveFromWishlist(c.Context(), userObjID, productID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to remove from wishlist"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Removed from wishlist"})
}

// GetWishlist returns the user's wishlist.
// GET /api/v1/users/wishlist
func (h *UserHandler) GetWishlist(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	wishlist, err := h.repo.GetWishlist(c.Context(), userObjID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get wishlist"},
		})
	}

	hexWishlist := make([]string, len(wishlist))
	for i, id := range wishlist {
		hexWishlist[i] = id.Hex()
	}

	return c.JSON(fiber.Map{"success": true, "data": hexWishlist})
}

// GetAddresses returns the user's saved addresses.
// GET /api/v1/users/addresses
func (h *UserHandler) GetAddresses(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	user, err := h.repo.FindByID(c.Context(), userObjID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.JSON(fiber.Map{"success": true, "data": []models.Address{}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get profile"},
		})
	}

	addresses := user.Addresses
	if addresses == nil {
		addresses = []models.Address{}
	}

	return c.JSON(fiber.Map{"success": true, "data": addresses})
}

// AddSavedCard adds a new saved card.
// POST /api/v1/users/cards
func (h *UserHandler) AddSavedCard(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objID, _ := primitive.ObjectIDFromHex(userID)

	var req models.AddSavedCardRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	card := models.SavedCard{
		ID:    req.ID,
		Brand: req.Brand,
		Last4: req.Last4,
		Bank:  req.Bank,
	}

	if err := h.repo.AddSavedCard(c.Context(), objID, card); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to add saved card"},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true, "message": "Card saved successfully", "data": card,
	})
}

// GetSavedCards returns the user's saved cards.
// GET /api/v1/users/cards
func (h *UserHandler) GetSavedCards(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	cards, err := h.repo.GetSavedCards(c.Context(), userObjID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.JSON(fiber.Map{"success": true, "data": []models.SavedCard{}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get saved cards"},
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": cards})
}

// LookupBin finds the bin details from database.
// GET /api/v1/users/bin/:bin
func (h *UserHandler) LookupBin(c *fiber.Ctx) error {
	binStr := c.Params("bin")
	if len(binStr) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "BIN must be at least 6 characters"},
		})
	}

	// We only need the first 6 digits for lookup
	binPrefix := binStr
	if len(binStr) > 6 {
		binPrefix = binStr[:6]
	}

	binInfo, err := h.repo.FindBinInfo(c.Context(), binPrefix)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 404, "message": "BIN not found"},
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to lookup BIN"},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"scheme":  binInfo.Scheme,
		"bank": fiber.Map{
			"name": binInfo.BankName,
		},
	})
}

// GetBanks retrieves the list of all available banks for Net Banking.
// GET /api/v1/users/banks
func (h *UserHandler) GetBanks(c *fiber.Ctx) error {
	banks, err := h.repo.GetAllBanks(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code": 500,
				"message": "Failed to fetch banks",
			},
		})
	}
	
	return c.JSON(fiber.Map{
		"success": true,
		"data":    banks,
	})
}

