"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "var(--color-bg-white)",
        padding: "32px",
        width: "100%",
        maxWidth: "400px",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
      }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "24px",
            lineHeight: 1,
            color: "var(--color-text-muted)"
          }}
        >
          &times;
        </button>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "14px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "16px",
          borderBottom: "1px solid var(--color-border-light)",
          paddingBottom: "12px"
        }}>
          {title}
        </h3>
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)"
        }}>
          {children}
        </div>
        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: "100%", marginTop: "24px" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
