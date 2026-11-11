package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func main() {
	base := config.LoadBaseConfig()
	dbName := config.GetEnv("MONGODB_PRODUCTS_DB", "ecommerce-products")

	client, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		fmt.Printf("Failed to connect to MongoDB: %v\n", err)
		os.Exit(1)
	}
	defer database.DisconnectMongoDB(client)

	db := client.Database(dbName)
	ctx := context.Background()

	// ─── Seed Categories ────────────────────────────────────
	catCol := db.Collection("categories")
	catCount, _ := catCol.CountDocuments(ctx, bson.M{})
	if catCount == 0 {
		travelID := primitive.NewObjectID()
		backpacksID := primitive.NewObjectID()
		accessoriesID := primitive.NewObjectID()

		categories := []interface{}{
			bson.M{"_id": travelID, "name": "Travel", "slug": "travel", "description": "Travel luggage for every journey", "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"_id": backpacksID, "name": "Backpacks", "slug": "backpacks", "description": "Backpacks for work, school, and adventure", "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"_id": accessoriesID, "name": "Accessories", "slug": "accessories", "description": "Essential travel accessories", "createdAt": time.Now(), "updatedAt": time.Now()},
			// Sub-categories
			bson.M{"name": "Trolley Bags", "slug": "trolley-bags", "parentId": travelID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Cabin Bags", "slug": "cabin-bags", "parentId": travelID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Large Luggage", "slug": "large-luggage", "parentId": travelID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Laptop Backpack", "slug": "laptop-backpack", "parentId": backpacksID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Office Backpack", "slug": "office-backpack", "parentId": backpacksID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Casual Backpack", "slug": "casual-backpack", "parentId": backpacksID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Travel Organizers", "slug": "travel-organizers", "parentId": accessoriesID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Neck Pillows", "slug": "neck-pillows", "parentId": accessoriesID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Toiletry Kits", "slug": "toiletry-kits", "parentId": accessoriesID, "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "School Bags", "slug": "school-bags", "description": "Durable bags for students", "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Premium Luggage", "slug": "premium-luggage", "description": "Luxury travel luggage", "createdAt": time.Now(), "updatedAt": time.Now()},
			bson.M{"name": "Duffel Bags", "slug": "duffel-bags", "description": "Versatile duffel bags for travel and sport", "createdAt": time.Now(), "updatedAt": time.Now()},
		}
		catCol.InsertMany(ctx, categories)
		fmt.Println("✅ Seeded categories")
	} else {
		fmt.Println("⏭️  Categories already exist, skipping...")
	}

	// ─── Seed Products ──────────────────────────────────────
	prodCol := db.Collection("products")
	prodCount, _ := prodCol.CountDocuments(ctx, bson.M{})
	if prodCount == 0 {
		now := time.Now()
		products := []interface{}{
			bson.M{
				"name": "Voyager Pro 24\" Trolley", "slug": "voyager-pro-24-trolley", "brand": "DYNAMO",
				"category": "Travel", "subCategory": "Trolley Bags",
				"description": "The Voyager Pro 24\" is your ultimate travel companion. Built with a durable polycarbonate shell, 360° spinner wheels, and a TSA-approved lock. Features an expandable main compartment with compression straps and a fully-lined interior with multiple packing pockets.",
				"specifications": bson.M{"Material": "Polycarbonate", "Dimensions": "24 x 16 x 10 inches", "Weight": "8.5 lbs", "Capacity": "65L", "Wheels": "4 Double Spinner", "Lock": "TSA Combination Lock"},
				"features": []string{"Expandable design adds 2 extra inches", "Telescopic aluminum handle", "Top and side carry handles", "Interior mesh divider", "Waterproof zipper"},
				"images": []string{"/images/products/voyager-pro-1.jpg", "/images/products/voyager-pro-2.jpg", "/images/products/voyager-pro-3.jpg"},
				"price": 189.0, "discountPrice": 159.0, "stock": 45, "sku": "DYN-TRV-001",
				"ratings": 4.6, "reviewsCount": 128, "tags": []string{"trolley", "travel", "hardside", "spinner"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Midnight Black", "Navy Blue", "Burgundy"},
				"variants": []bson.M{
					{"id": "var-1", "color": "Midnight Black", "sku": "DYN-TRV-001-BLK", "stock": 15, "price": 189.0},
					{"id": "var-2", "color": "Navy Blue", "sku": "DYN-TRV-001-NVY", "stock": 20, "price": 189.0},
					{"id": "var-3", "color": "Burgundy", "sku": "DYN-TRV-001-BUR", "stock": 10, "price": 189.0},
				},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Explorer 28\" Hardside Spinner", "slug": "explorer-28-hardside-spinner", "brand": "DYNAMO",
				"category": "Travel", "subCategory": "Large Luggage",
				"description": "Go big with the Explorer 28\". This large-capacity hardside spinner is perfect for extended trips. The scratch-resistant textured finish and corner guards protect your luggage through any journey.",
				"specifications": bson.M{"Material": "ABS + Polycarbonate", "Dimensions": "28 x 19 x 12 inches", "Weight": "10.2 lbs", "Capacity": "95L", "Wheels": "4 Double Spinner", "Lock": "TSA Combination Lock"},
				"features": []string{"Scratch-resistant textured surface", "Reinforced corner guards", "Expandable up to 15%", "Wet pocket for toiletries", "Built-in ID tag holder"},
				"images": []string{"/images/products/explorer-28-1.jpg", "/images/products/explorer-28-2.jpg"},
				"price": 249.0, "stock": 30, "sku": "DYN-TRV-002",
				"ratings": 4.4, "reviewsCount": 87, "tags": []string{"large", "hardside", "spinner", "travel"},
				"isFeatured": true, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Charcoal", "Silver", "Rose Gold"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Swift Cabin 20\" Carry-On", "slug": "swift-cabin-20-carry-on", "brand": "DYNAMO",
				"category": "Travel", "subCategory": "Cabin Bags",
				"description": "The Swift Cabin meets every major airline's carry-on requirements. Ultra-lightweight yet sturdy, with a front laptop pocket for quick airport access. Perfect for business travelers and weekend getaways.",
				"specifications": bson.M{"Material": "Polycarbonate", "Dimensions": "20 x 14 x 9 inches", "Weight": "5.8 lbs", "Capacity": "38L", "Wheels": "4 Spinner", "Lock": "TSA Lock"},
				"features": []string{"Front-access laptop compartment", "Meets carry-on size requirements", "USB charging port pass-through", "Silent spinner wheels", "Lightweight frame"},
				"images": []string{"/images/products/swift-cabin-1.jpg", "/images/products/swift-cabin-2.jpg", "/images/products/swift-cabin-3.jpg"},
				"price": 149.0, "discountPrice": 129.0, "stock": 60, "sku": "DYN-TRV-003",
				"ratings": 4.8, "reviewsCount": 215, "tags": []string{"cabin", "carry-on", "lightweight", "business"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Matte Black", "White", "Ocean Blue"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Jetstream Cabin Spinner", "slug": "jetstream-cabin-spinner", "brand": "DYNAMO",
				"category": "Travel", "subCategory": "Cabin Bags",
				"description": "Engineered for the frequent flyer. The Jetstream features an innovative hinged front opening for easy packing and a structured interior with removable laundry bag.",
				"specifications": bson.M{"Material": "Polypropylene", "Dimensions": "21 x 14 x 9 inches", "Weight": "6.2 lbs", "Capacity": "40L", "Wheels": "4 Spinner"},
				"features": []string{"Hinged front opening", "Removable laundry bag", "Compression packing system", "Integrated scale handle", "Water-resistant shell"},
				"images": []string{"/images/products/jetstream-1.jpg", "/images/products/jetstream-2.jpg"},
				"price": 129.0, "stock": 40, "sku": "DYN-TRV-004",
				"ratings": 4.5, "reviewsCount": 93, "tags": []string{"cabin", "carry-on", "spinner"},
				"isFeatured": false, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Storm Gray", "Forest Green"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "TechPro 15.6\" Laptop Backpack", "slug": "techpro-156-laptop-backpack", "brand": "DYNAMO",
				"category": "Backpacks", "subCategory": "Laptop Backpack",
				"description": "Purpose-built for tech professionals. Features a padded 15.6\" laptop compartment, tablet sleeve, and dedicated pockets for cables, chargers, and accessories. Water-resistant 900D polyester construction.",
				"specifications": bson.M{"Material": "900D Polyester", "Dimensions": "18 x 12 x 7 inches", "Weight": "1.8 lbs", "Capacity": "28L", "Laptop Size": "Up to 15.6 inches"},
				"features": []string{"Padded laptop compartment", "Hidden anti-theft pocket", "USB charging port", "Breathable mesh back panel", "Luggage strap for trolley attachment"},
				"images": []string{"/images/products/techpro-1.jpg", "/images/products/techpro-2.jpg", "/images/products/techpro-3.jpg"},
				"price": 89.0, "discountPrice": 74.0, "stock": 80, "sku": "DYN-BPK-001",
				"ratings": 4.7, "reviewsCount": 342, "tags": []string{"laptop", "backpack", "tech", "work"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Dark Gray"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "CodeRunner Laptop Pack", "slug": "coderunner-laptop-pack", "brand": "DYNAMO",
				"category": "Backpacks", "subCategory": "Laptop Backpack",
				"description": "The CodeRunner is designed for developers and digital nomads. Extra-wide opening for easy access, built-in cable management, and enough room for your entire mobile office.",
				"specifications": bson.M{"Material": "Recycled 600D Polyester", "Dimensions": "19 x 13 x 8 inches", "Weight": "2.1 lbs", "Capacity": "32L", "Laptop Size": "Up to 16 inches"},
				"features": []string{"Extra-wide clamshell opening", "Built-in cable organizer", "Water bottle pocket", "Reflective accents for night visibility", "YKK zippers"},
				"images": []string{"/images/products/coderunner-1.jpg", "/images/products/coderunner-2.jpg"},
				"price": 109.0, "stock": 55, "sku": "DYN-BPK-002",
				"ratings": 4.6, "reviewsCount": 178, "tags": []string{"laptop", "backpack", "developer", "tech"},
				"isFeatured": false, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Black", "Navy"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Executive Slim Briefpack", "slug": "executive-slim-briefpack", "brand": "DYNAMO",
				"category": "Backpacks", "subCategory": "Office Backpack",
				"description": "Slim, professional, and refined. This briefcase-backpack hybrid features premium ballistic nylon, a structured silhouette, and dedicated compartments for your laptop, documents, and essentials.",
				"specifications": bson.M{"Material": "Ballistic Nylon", "Dimensions": "17 x 12 x 5 inches", "Weight": "2.4 lbs", "Capacity": "18L", "Laptop Size": "Up to 14 inches"},
				"features": []string{"Convertible briefcase/backpack", "Premium leather accents", "RFID-blocking pocket", "Magnetic closure flap", "Padded shoulder straps hide away"},
				"images": []string{"/images/products/executive-1.jpg", "/images/products/executive-2.jpg", "/images/products/executive-3.jpg"},
				"price": 129.0, "stock": 35, "sku": "DYN-BPK-003",
				"ratings": 4.5, "reviewsCount": 64, "tags": []string{"office", "business", "backpack", "slim"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": false,
				"colors": []string{"Black", "Cognac Brown"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Metro Business Backpack", "slug": "metro-business-backpack", "brand": "DYNAMO",
				"category": "Backpacks", "subCategory": "Office Backpack",
				"description": "The Metro is a no-nonsense business backpack with clean lines and smart organization. Fits perfectly under airplane seats and pairs with any professional wardrobe.",
				"specifications": bson.M{"Material": "Nylon Twill", "Dimensions": "16 x 11 x 6 inches", "Weight": "1.6 lbs", "Capacity": "20L", "Laptop Size": "Up to 15 inches"},
				"features": []string{"Quick-access front pocket", "Padded laptop sleeve", "Internal key clip", "Trolley pass-through strap", "Water-resistant coating"},
				"images": []string{"/images/products/metro-1.jpg", "/images/products/metro-2.jpg"},
				"price": 99.0, "discountPrice": 84.0, "stock": 70, "sku": "DYN-BPK-004",
				"ratings": 4.3, "reviewsCount": 156, "tags": []string{"office", "business", "commute", "backpack"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Heather Gray"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Roam 50L Duffel", "slug": "roam-50l-duffel", "brand": "DYNAMO",
				"category": "Duffel Bags", "subCategory": "Duffel Bags",
				"description": "Built for adventure. The Roam 50L duffel converts from a duffel to a backpack and features a rugged, water-resistant base. Perfect for weekend trips, gym sessions, or outdoor expeditions.",
				"specifications": bson.M{"Material": "1000D Cordura Nylon", "Dimensions": "24 x 13 x 13 inches", "Weight": "2.8 lbs", "Capacity": "50L"},
				"features": []string{"Converts to backpack mode", "Water-resistant molded base", "U-shaped main opening", "Shoe compartment", "External compression straps"},
				"images": []string{"/images/products/roam-duffel-1.jpg", "/images/products/roam-duffel-2.jpg", "/images/products/roam-duffel-3.jpg"},
				"price": 159.0, "stock": 25, "sku": "DYN-DUF-001",
				"ratings": 4.7, "reviewsCount": 89, "tags": []string{"duffel", "travel", "adventure", "convertible"},
				"isFeatured": true, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Black", "Olive", "Navy"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Weekender Canvas Duffel", "slug": "weekender-canvas-duffel", "brand": "DYNAMO",
				"category": "Duffel Bags", "subCategory": "Duffel Bags",
				"description": "Classic style meets modern functionality. This waxed canvas duffel with genuine leather accents is perfect for short trips. Features a spacious interior with internal organization pockets.",
				"specifications": bson.M{"Material": "Waxed Canvas + Leather", "Dimensions": "22 x 11 x 11 inches", "Weight": "2.2 lbs", "Capacity": "35L"},
				"features": []string{"Waxed canvas exterior", "Genuine leather handles and trim", "Detachable shoulder strap", "Interior zip pocket", "Metal feet for base protection"},
				"images": []string{"/images/products/weekender-1.jpg", "/images/products/weekender-2.jpg"},
				"price": 119.0, "stock": 20, "sku": "DYN-DUF-002",
				"ratings": 4.4, "reviewsCount": 67, "tags": []string{"duffel", "weekend", "canvas", "classic"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": false,
				"colors": []string{"Tan", "Charcoal"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "PackIt Travel Organizer Set", "slug": "packit-travel-organizer-set", "brand": "DYNAMO",
				"category": "Accessories", "subCategory": "Travel Organizers",
				"description": "Stay organized on every trip. This 6-piece set includes compression cubes, a shoe bag, a laundry bag, and a toiletry pouch. Made from lightweight, tear-resistant ripstop nylon.",
				"specifications": bson.M{"Material": "Ripstop Nylon", "Pieces": "6", "Weight": "0.8 lbs total"},
				"features": []string{"6-piece complete set", "Compression zippers", "Mesh panels for visibility", "Machine washable", "Fits most carry-on suitcases"},
				"images": []string{"/images/products/packit-1.jpg", "/images/products/packit-2.jpg"},
				"price": 39.0, "discountPrice": 32.0, "stock": 120, "sku": "DYN-ACC-001",
				"ratings": 4.8, "reviewsCount": 412, "tags": []string{"organizer", "packing", "cubes", "travel"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Teal", "Gray"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "CloudRest Neck Pillow", "slug": "cloudrest-neck-pillow", "brand": "DYNAMO",
				"category": "Accessories", "subCategory": "Neck Pillows",
				"description": "Memory foam comfort for long flights. The CloudRest features a 360° adjustable clasp, removable and washable cover, and compresses to half its size for easy packing.",
				"specifications": bson.M{"Material": "Memory Foam", "Cover": "Breathable Velour", "Weight": "0.5 lbs"},
				"features": []string{"360° adjustable clasp", "Memory foam core", "Removable washable cover", "Compresses to 50% size", "Snap-on carry loop"},
				"images": []string{"/images/products/cloudrest-1.jpg", "/images/products/cloudrest-2.jpg"},
				"price": 29.0, "stock": 150, "sku": "DYN-ACC-002",
				"ratings": 4.5, "reviewsCount": 234, "tags": []string{"neck pillow", "travel", "comfort", "flight"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Gray", "Navy", "Blush Pink"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "AquaShield Toiletry Kit", "slug": "aquashield-toiletry-kit", "brand": "DYNAMO",
				"category": "Accessories", "subCategory": "Toiletry Kits",
				"description": "Waterproof toiletry organizer with a hanging hook design. Multiple compartments keep your essentials organized, and the water-resistant lining protects against spills.",
				"specifications": bson.M{"Material": "PU-Coated Nylon", "Dimensions": "10 x 7 x 4 inches", "Weight": "0.6 lbs"},
				"features": []string{"Waterproof interior lining", "Hanging hook design", "Detachable mirror", "Clear TSA-friendly pouch included", "Multiple elastic loops for bottles"},
				"images": []string{"/images/products/aquashield-1.jpg", "/images/products/aquashield-2.jpg"},
				"price": 45.0, "stock": 85, "sku": "DYN-ACC-003",
				"ratings": 4.6, "reviewsCount": 142, "tags": []string{"toiletry", "waterproof", "organizer", "travel"},
				"isFeatured": false, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Black", "Navy"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Scholar Pro School Bag", "slug": "scholar-pro-school-bag", "brand": "DYNAMO",
				"category": "School Bags", "subCategory": "School Bags",
				"description": "Designed for students who mean business. The Scholar Pro features ergonomic S-curve straps, a padded back panel, and dedicated compartments for laptop, books, and stationery.",
				"specifications": bson.M{"Material": "600D Polyester", "Dimensions": "18 x 12 x 7 inches", "Weight": "1.4 lbs", "Capacity": "30L"},
				"features": []string{"Ergonomic S-curve straps", "Padded laptop sleeve (15 inches)", "Front organizer pocket", "Side water bottle pockets", "Reflective logo for safety"},
				"images": []string{"/images/products/scholar-1.jpg", "/images/products/scholar-2.jpg"},
				"price": 69.0, "discountPrice": 59.0, "stock": 100, "sku": "DYN-SCH-001",
				"ratings": 4.4, "reviewsCount": 198, "tags": []string{"school", "student", "backpack", "laptop"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Blue", "Red"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Campus Classic Backpack", "slug": "campus-classic-backpack", "brand": "DYNAMO",
				"category": "School Bags", "subCategory": "School Bags",
				"description": "The everyday essential. Clean design, durable construction, and just the right amount of organization. A versatile bag that works for school, college, and casual outings.",
				"specifications": bson.M{"Material": "Polyester", "Dimensions": "17 x 11 x 6 inches", "Weight": "1.1 lbs", "Capacity": "24L"},
				"features": []string{"Padded back panel", "Adjustable straps", "Front zippered pocket", "Internal sleeve for books", "Lightweight and durable"},
				"images": []string{"/images/products/campus-1.jpg", "/images/products/campus-2.jpg"},
				"price": 59.0, "stock": 90, "sku": "DYN-SCH-002",
				"ratings": 4.2, "reviewsCount": 267, "tags": []string{"school", "casual", "backpack", "everyday"},
				"isFeatured": false, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Black", "Gray", "Green", "Purple"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Prestige 24\" Aluminum Spinner", "slug": "prestige-24-aluminum-spinner", "brand": "DYNAMO",
				"category": "Premium Luggage", "subCategory": "Premium Luggage",
				"description": "Luxury meets durability. This all-aluminum spinner features a patented flex-fold divider system, Hinomoto silent wheels, and a lifetime warranty. The ultimate statement piece for discerning travelers.",
				"specifications": bson.M{"Material": "Aircraft-Grade Aluminum", "Dimensions": "24 x 16 x 10 inches", "Weight": "11.5 lbs", "Capacity": "58L", "Wheels": "4 Hinomoto Silent Casters", "Lock": "Dual TSA Lock"},
				"features": []string{"All-aluminum construction", "Patented flex-fold dividers", "Hinomoto silent caster wheels", "Dual TSA locks", "Lifetime warranty"},
				"images": []string{"/images/products/prestige-1.jpg", "/images/products/prestige-2.jpg", "/images/products/prestige-3.jpg"},
				"price": 449.0, "stock": 15, "sku": "DYN-PRM-001",
				"ratings": 4.9, "reviewsCount": 42, "tags": []string{"premium", "aluminum", "luxury", "spinner"},
				"isFeatured": true, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Silver", "Titanium", "Matte Black"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Heritage Leather Weekender", "slug": "heritage-leather-weekender", "brand": "DYNAMO",
				"category": "Premium Luggage", "subCategory": "Premium Luggage",
				"description": "Handcrafted from full-grain Italian leather, the Heritage Weekender develops a rich patina over time. Features brass hardware, a cotton-lined interior, and a detachable leather shoulder strap.",
				"specifications": bson.M{"Material": "Full-Grain Italian Leather", "Dimensions": "20 x 10 x 10 inches", "Weight": "3.5 lbs", "Capacity": "30L"},
				"features": []string{"Full-grain Italian leather", "Solid brass hardware", "Cotton canvas lining", "Develops patina with age", "Detachable leather shoulder strap"},
				"images": []string{"/images/products/heritage-1.jpg", "/images/products/heritage-2.jpg"},
				"price": 389.0, "stock": 10, "sku": "DYN-PRM-002",
				"ratings": 4.8, "reviewsCount": 28, "tags": []string{"premium", "leather", "weekender", "luxury"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": false,
				"colors": []string{"Cognac", "Dark Brown"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "TrailBlazer Hiking Pack 40L", "slug": "trailblazer-hiking-pack-40l", "brand": "DYNAMO",
				"category": "Backpacks", "subCategory": "Casual Backpack",
				"description": "Hit the trails with confidence. The TrailBlazer features a ventilated suspension system, rain cover, and hydration-compatible design. Ideal for day hikes and overnight adventures.",
				"specifications": bson.M{"Material": "Ripstop Nylon 210D", "Dimensions": "25 x 14 x 9 inches", "Weight": "2.6 lbs", "Capacity": "40L"},
				"features": []string{"Ventilated mesh back panel", "Integrated rain cover", "Hydration bladder compatible", "Trekking pole attachments", "Hip belt with zippered pockets"},
				"images": []string{"/images/products/trailblazer-1.jpg", "/images/products/trailblazer-2.jpg"},
				"price": 139.0, "discountPrice": 119.0, "stock": 35, "sku": "DYN-BPK-005",
				"ratings": 4.5, "reviewsCount": 76, "tags": []string{"hiking", "outdoor", "adventure", "backpack"},
				"isFeatured": false, "isNewArrival": true, "isBestSeller": false,
				"colors": []string{"Olive Green", "Black", "Red"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Urban Sling Crossbody", "slug": "urban-sling-crossbody", "brand": "DYNAMO",
				"category": "Accessories", "subCategory": "Travel Organizers",
				"description": "Hands-free convenience meets urban style. This compact sling crossbody fits your phone, wallet, keys, and more. RFID-blocking pocket keeps your cards safe.",
				"specifications": bson.M{"Material": "Water-Resistant Nylon", "Dimensions": "12 x 7 x 3 inches", "Weight": "0.4 lbs", "Capacity": "4L"},
				"features": []string{"RFID-blocking front pocket", "Adjustable crossbody strap", "Quick-access phone pocket", "Water-resistant exterior", "Anti-theft hidden zipper"},
				"images": []string{"/images/products/urban-sling-1.jpg", "/images/products/urban-sling-2.jpg"},
				"price": 69.0, "stock": 65, "sku": "DYN-ACC-004",
				"ratings": 4.3, "reviewsCount": 189, "tags": []string{"sling", "crossbody", "urban", "everyday"},
				"isFeatured": false, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Gray", "Khaki"},
				"createdAt": now, "updatedAt": now,
			},
			bson.M{
				"name": "Navigator 3-Piece Luggage Set", "slug": "navigator-3-piece-luggage-set", "brand": "DYNAMO",
				"category": "Travel", "subCategory": "Trolley Bags",
				"description": "Everything you need in one set. The Navigator includes 20\" carry-on, 24\" medium, and 28\" large spinners. All three nest inside each other for compact storage.",
				"specifications": bson.M{"Material": "Polycarbonate", "Includes": "20\" + 24\" + 28\"", "Total Weight": "24 lbs", "Lock": "TSA Combination Lock"},
				"features": []string{"3-piece nesting set", "Matching design across all sizes", "360° double spinner wheels", "Expandable on all sizes", "10-year warranty"},
				"images": []string{"/images/products/navigator-set-1.jpg", "/images/products/navigator-set-2.jpg", "/images/products/navigator-set-3.jpg"},
				"price": 499.0, "discountPrice": 399.0, "stock": 18, "sku": "DYN-TRV-005",
				"ratings": 4.7, "reviewsCount": 156, "tags": []string{"set", "trolley", "travel", "luggage", "family"},
				"isFeatured": true, "isNewArrival": false, "isBestSeller": true,
				"colors": []string{"Black", "Navy Blue", "Wine Red"},
				"createdAt": now, "updatedAt": now,
			},
		}
		prodCol.InsertMany(ctx, products)
		fmt.Println("✅ Seeded 20 products")
	} else {
		fmt.Printf("⏭️  %d products already exist, skipping...\n", prodCount)
	}

	fmt.Println("🎉 Database seeding complete!")
}
