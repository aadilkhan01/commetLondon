"use client";

export default function AnnouncementBar() {
  const messages = [
    "FREE SHIPPING ON ORDERS OVER $100",
    "★ NEW ARRIVALS — SHOP THE LATEST COLLECTION ★",
    "USE CODE GOCARRY15 FOR 15% OFF YOUR FIRST ORDER",
    "FREE SHIPPING ON ORDERS OVER $100",
    "★ NEW ARRIVALS — SHOP THE LATEST COLLECTION ★",
    "USE CODE GOCARRY15 FOR 15% OFF YOUR FIRST ORDER",
  ];

  return (
    <div className="announcement-bar">
      <div className="marquee">
        {messages.map((msg, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              padding: "0 40px",
              textTransform: "uppercase",
            }}
          >
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
