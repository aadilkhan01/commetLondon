package types

// ─── Order Statuses ─────────────────────────────────────────

const (
	OrderStatusPending   = "PENDING"
	OrderStatusConfirmed = "CONFIRMED"
	OrderStatusPacked    = "PACKED"
	OrderStatusShipped   = "SHIPPED"
	OrderStatusDelivered = "DELIVERED"
	OrderStatusCancelled = "CANCELLED"
)

// ValidOrderStatuses contains all valid order status values.
var ValidOrderStatuses = []string{
	OrderStatusPending,
	OrderStatusConfirmed,
	OrderStatusPacked,
	OrderStatusShipped,
	OrderStatusDelivered,
	OrderStatusCancelled,
}

// OrderStatusTransitions defines valid status transitions.
var OrderStatusTransitions = map[string][]string{
	OrderStatusPending:   {OrderStatusConfirmed, OrderStatusCancelled},
	OrderStatusConfirmed: {OrderStatusPacked, OrderStatusCancelled},
	OrderStatusPacked:    {OrderStatusShipped, OrderStatusCancelled},
	OrderStatusShipped:   {OrderStatusDelivered},
	OrderStatusDelivered: {},
	OrderStatusCancelled: {},
}

// ─── User Roles ─────────────────────────────────────────────

const (
	RoleCustomer = "CUSTOMER"
	RoleAdmin    = "ADMIN"
)

// ─── Notification Types ─────────────────────────────────────

const (
	NotificationTypeEmail = "EMAIL"
	NotificationTypeSMS   = "SMS"
	NotificationTypePush  = "PUSH"
)

// ─── Notification Events ────────────────────────────────────

const (
	EventRegistration      = "REGISTRATION"
	EventOTP               = "OTP"
	EventOrderCreated      = "ORDER_CREATED"
	EventOrderStatusUpdate = "ORDER_STATUS_UPDATE"
)
