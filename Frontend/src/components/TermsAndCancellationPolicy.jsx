import React, { useState } from "react";

// ─── Orange Palette ───────────────────────────────────────────────
// Primary:   #ea580c (orange-600)
// Dark:      #9a3412 (orange-900)
// Mid:       #f97316 (orange-500)
// Light:     #fed7aa (orange-200)
// Pale:      #fff7ed (orange-50)
// Accent:    #fb923c (orange-400)
// ─────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20, 10, 5, 0.72)",
    backdropFilter: "blur(10px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    animation: "fadeIn 0.3s ease",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "26px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "92vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 40px 100px rgba(234,88,12,0.22), 0 0 0 1px rgba(255,255,255,0.08)",
    animation: "slideUp 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    background: "linear-gradient(135deg, #7c2d12 0%, #c2410c 45%, #f97316 100%)",
    padding: "28px 32px 26px",
    position: "relative",
    overflow: "hidden",
  },
  headerOrb1: {
    position: "absolute",
    top: "-50px",
    right: "-30px",
    width: "180px",
    height: "180px",
    background: "rgba(255,255,255,0.07)",
    borderRadius: "50%",
  },
  headerOrb2: {
    position: "absolute",
    bottom: "-70px",
    left: "-30px",
    width: "140px",
    height: "140px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "50%",
  },
  headerOrb3: {
    position: "absolute",
    top: "10px",
    left: "50%",
    width: "80px",
    height: "80px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "50%",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "100px",
    padding: "5px 13px",
    marginBottom: "14px",
  },
  headerBadgeText: {
    color: "#fed7aa",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.4px",
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  headerSub: {
    color: "#fed7aa",
    fontSize: "13px",
    margin: "5px 0 0",
    opacity: 0.9,
  },

  // ── Tabs ─────────────────────────────────────────────────────────
  tabContainer: {
    display: "flex",
    padding: "14px 20px 0",
    gap: "8px",
    background: "#fff7ed",
    borderBottom: "2px solid #fed7aa",
  },
  tab: (active) => ({
    flex: 1,
    padding: "10px 16px",
    borderRadius: "12px 12px 0 0",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
    transition: "all 0.2s ease",
    background: active ? "#ea580c" : "transparent",
    color: active ? "#ffffff" : "#9a3412",
    outline: "none",
    letterSpacing: "0.01em",
  }),

  // ── Body ─────────────────────────────────────────────────────────
  body: {
    overflowY: "auto",
    flex: 1,
    background: "#fffaf7",
  },
  sectionWrap: {
    padding: "20px 22px",
  },

  // ── Info box ─────────────────────────────────────────────────────
  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 15px",
    borderRadius: "12px",
    background: "#fff7ed",
    border: "1.5px solid #fed7aa",
    marginBottom: "16px",
    fontSize: "12.5px",
    color: "#9a3412",
    lineHeight: "1.55",
  },

  // ── Cancel cards ─────────────────────────────────────────────────
  cancelCard: (bgColor, borderColor) => ({
    background: bgColor,
    border: `1.5px solid ${borderColor}`,
    borderRadius: "16px",
    padding: "17px 20px",
    marginBottom: "12px",
    transition: "transform 0.22s ease, box-shadow 0.22s ease",
    cursor: "default",
  }),
  cancelCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  cancelCardTitle: (color) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    fontSize: "13.5px",
    color: color,
  }),
  cancelBadge: (bg, color) => ({
    background: bg,
    color: color,
    borderRadius: "100px",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  }),
  cancelDesc: {
    fontSize: "12.5px",
    color: "#57534e",
    lineHeight: "1.6",
    marginBottom: "10px",
  },
  cancelTimeline: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  timelineItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    fontSize: "12px",
    color: "#78716c",
  },
  timelineDot: (color) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    marginTop: "5px",
    flexShrink: 0,
  }),

  // ── Terms items ──────────────────────────────────────────────────
  termItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "13px 15px",
    borderRadius: "13px",
    marginBottom: "8px",
    background: "#ffffff",
    border: "1.5px solid #fed7aa",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  termIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "16px",
  },
  termTitle: {
    fontWeight: "700",
    fontSize: "13px",
    color: "#1c0a00",
    marginBottom: "3px",
  },
  termDesc: {
    fontSize: "11.5px",
    color: "#78716c",
    lineHeight: "1.5",
  },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    padding: "16px 22px 22px",
    borderTop: "2px solid #fed7aa",
    background: "#fff7ed",
  },
  checkboxRow: (active) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "13px 14px",
    borderRadius: "13px",
    background: active ? "#ffedd5" : "#ffffff",
    border: `1.5px solid ${active ? "#f97316" : "#fed7aa"}`,
    marginBottom: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  customCheckbox: (checked) => ({
    width: "21px",
    height: "21px",
    borderRadius: "7px",
    border: `2.5px solid ${checked ? "#ea580c" : "#fdba74"}`,
    background: checked
      ? "linear-gradient(135deg, #ea580c, #f97316)"
      : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
    marginTop: "1px",
    boxShadow: checked ? "0 2px 8px rgba(234,88,12,0.35)" : "none",
  }),
  checkText: {
    fontSize: "12.5px",
    color: "#7c2d12",
    fontWeight: "600",
    lineHeight: "1.5",
  },
  proceedBtn: (enabled) => ({
    width: "100%",
    padding: "15px",
    borderRadius: "14px",
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: "15px",
    fontWeight: "800",
    letterSpacing: "0.02em",
    background: enabled
      ? "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)"
      : "#e7e5e4",
    color: enabled ? "#ffffff" : "#a8a29e",
    transition: "all 0.25s ease",
    boxShadow: enabled
      ? "0 6px 22px rgba(234,88,12,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
      : "none",
  }),

  disputeNote: {
    marginTop: "12px",
    padding: "12px 15px",
    borderRadius: "12px",
    background: "#ffffff",
    border: "1px solid #fed7aa",
    fontSize: "12px",
    color: "#78716c",
    lineHeight: "1.6",
  },
};

// ─── Cancellation Policy Data ────────────────────────────────────
const cancelPolicies = [
  {
    id: "driver_cancel",
    icon: "🚗",
    title: "Driver Cancels Your Ride",
    badge: "100% Refund",
    badgeBg: "#dcfce7",
    badgeColor: "#15803d",
    cardBg: "#f0fdf4",
    cardBorder: "#86efac",
    titleColor: "#15803d",
    desc: "If your assigned driver cancels the ride for any reason, you will receive a full refund automatically — no questions asked.",
    timeline: [
      "Full amount refunded within 5–7 business days",
      "Refund credited to original payment method",
      "Confirmation email sent automatically",
    ],
    dotColor: "#22c55e",
  },
  {
    id: "user_cancel_before",
    icon: "⏰",
    title: "You Cancel Before Driver Departs",
    badge: "75% Refund",
    badgeBg: "#ffedd5",
    badgeColor: "#c2410c",
    cardBg: "#fff7ed",
    cardBorder: "#fdba74",
    titleColor: "#c2410c",
    desc: "If you cancel before the driver has started the trip towards your pickup, you receive 75% of the booking amount back.",
    timeline: [
      "25% cancellation fee is retained by Carzi",
      "Remaining 75% refunded within 5–7 business days",
      "Applicable only before driver departs",
    ],
    dotColor: "#f97316",
  },
  {
    id: "user_cancel_after",
    icon: "🚫",
    title: "You Cancel After Ride Starts",
    badge: "No Refund",
    badgeBg: "#fee2e2",
    badgeColor: "#dc2626",
    cardBg: "#fff5f5",
    cardBorder: "#fca5a5",
    titleColor: "#dc2626",
    desc: "Once the driver has departed towards your pickup location, cancellations are not eligible for any refund.",
    timeline: [
      "Full booking amount is non-refundable",
      "Partial trip charges still apply",
      "Contact support within 24 hrs for exceptional cases",
    ],
    dotColor: "#ef4444",
  },
];

// ─── Terms List ──────────────────────────────────────────────────
const termsList = [
  {
    icon: "📍",
    iconBg: "#fff7ed",
    title: "Pickup & Location",
    desc: "Be at the pickup point 5 minutes early. Delays over 15 minutes may incur waiting charges or trip cancellation.",
  },
  {
    icon: "💳",
    iconBg: "#fff7ed",
    title: "Payment Policy",
    desc: "All payments must be via QR code. Do not pay cash to the driver for pre-booked outstation trips.",
  },
  {
    icon: "🧳",
    iconBg: "#fff7ed",
    title: "Luggage Policy",
    desc: "Excess luggage beyond vehicle capacity may be declined. Inform us in advance for oversized or heavy items.",
  },
  {
    icon: "⭐",
    iconBg: "#fff7ed",
    title: "Driver Rating",
    desc: "Please rate your driver after the trip. Your feedback helps us maintain high service quality.",
  },
  {
    icon: "📱",
    iconBg: "#fff7ed",
    title: "Support & Contact",
    desc: "For issues during the trip, use in-app support. Emergency assistance is available 24/7.",
  },
  {
    icon: "🛡️",
    iconBg: "#fff7ed",
    title: "Safety & Compliance",
    desc: "Follow all traffic rules and driver instructions. Prohibited items inside the vehicle are strictly not allowed.",
  },
];

// ─── Component ───────────────────────────────────────────────────
export default function TermsAndCancellationPolicy({ onAccept, onClose }) {
  const [activeTab, setActiveTab] = useState("cancellation");
  const [accepted, setAccepted] = useState(false);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(44px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .tcp-cancel-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(234,88,12,0.12);
        }
        .tcp-term-item:hover {
          border-color: #fb923c !important;
          box-shadow: 0 2px 12px rgba(234,88,12,0.08);
        }
        .tcp-proceed-btn:hover:not([disabled]) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(234,88,12,0.5) !important;
        }
        .tcp-proceed-btn:active:not([disabled]) {
          transform: translateY(0);
        }
        .tcp-checkbox-row:hover { filter: brightness(0.97); }
        .tcp-tab:hover:not(.tcp-tab-active) {
          background: #ffedd5 !important;
          color: #ea580c !important;
        }
        .tcp-body::-webkit-scrollbar { width: 5px; }
        .tcp-body::-webkit-scrollbar-track { background: #fff7ed; }
        .tcp-body::-webkit-scrollbar-thumb { background: #fdba74; border-radius: 99px; }
      `}</style>

      <div
        style={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
      >
        <div style={styles.modal}>

          {/* ── Header ─────────────────────────────────────── */}
          <div style={styles.header}>
            <div style={styles.headerOrb1} />
            <div style={styles.headerOrb2} />
            <div style={styles.headerOrb3} />
            <div style={styles.headerBadge}>
              <span style={{ fontSize: "11px" }}>📋</span>
              <span style={styles.headerBadgeText}>Before you pay</span>
            </div>
            <h2 style={styles.headerTitle}>Terms & Cancellation Policy</h2>
            <p style={styles.headerSub}>
              Please review our policies carefully before proceeding to payment.
            </p>
          </div>

          {/* ── Tabs ───────────────────────────────────────── */}
          <div style={styles.tabContainer}>
            {[
              { id: "cancellation", label: "🔄 Cancellation Policy" },
              { id: "terms",        label: "📝 Terms & Conditions"  },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`tcp-tab ${activeTab === id ? "tcp-tab-active" : ""}`}
                style={styles.tab(activeTab === id)}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Body ───────────────────────────────────────── */}
          <div className="tcp-body" style={styles.body}>

            {/* Cancellation Tab */}
            {activeTab === "cancellation" && (
              <div style={styles.sectionWrap}>
                <div style={styles.infoBox}>
                  <span>ℹ️</span>
                  <span>
                    Refunds go back to your original payment method. The amount
                    depends on <strong>who cancels</strong> and <strong>when</strong>.
                  </span>
                </div>

                {cancelPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="tcp-cancel-card"
                    style={styles.cancelCard(policy.cardBg, policy.cardBorder)}
                  >
                    <div style={styles.cancelCardHeader}>
                      <div style={styles.cancelCardTitle(policy.titleColor)}>
                        <span style={{ fontSize: "19px" }}>{policy.icon}</span>
                        {policy.title}
                      </div>
                      <span style={styles.cancelBadge(policy.badgeBg, policy.badgeColor)}>
                        {policy.badge}
                      </span>
                    </div>
                    <p style={styles.cancelDesc}>{policy.desc}</p>
                    <div style={styles.cancelTimeline}>
                      {policy.timeline.map((item, i) => (
                        <div key={i} style={styles.timelineItem}>
                          <div style={styles.timelineDot(policy.dotColor)} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={styles.disputeNote}>
                  🔒&nbsp;
                  <strong style={{ color: "#57534e" }}>Dispute Resolution:</strong>{" "}
                  Contact our support team within 48 hours of the trip date for refund
                  disputes. All final decisions rest with Carzi Holidays.
                </div>
              </div>
            )}

            {/* Terms Tab */}
            {activeTab === "terms" && (
              <div style={styles.sectionWrap}>
                <div style={styles.infoBox}>
                  <span>ℹ️</span>
                  <span>
                    By proceeding with payment you agree to all terms below.
                    These apply to all outstation bookings.
                  </span>
                </div>

                {termsList.map((term, i) => (
                  <div key={i} className="tcp-term-item" style={styles.termItem}>
                    <div style={{ ...styles.termIcon, background: term.iconBg }}>
                      {term.icon}
                    </div>
                    <div>
                      <div style={styles.termTitle}>{term.title}</div>
                      <div style={styles.termDesc}>{term.desc}</div>
                    </div>
                  </div>
                ))}

                <div style={styles.disputeNote}>
                  <strong style={{ color: "#57534e" }}>Governing Law:</strong>{" "}
                  These terms are governed by the laws of India. Disputes shall be
                  subject to courts in the applicable city. Carzi Holidays reserves
                  the right to amend these terms with prior notice.
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────── */}
          <div style={styles.footer}>
            {/* Checkbox */}
            <div
              className="tcp-checkbox-row"
              style={styles.checkboxRow(accepted)}
              onClick={() => setAccepted((v) => !v)}
            >
              <div style={styles.customCheckbox(accepted)}>
                {accepted && (
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path
                      d="M1 4L4.5 7.5L11 1"
                      stroke="white"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span style={styles.checkText}>
                I have read and agree to the{" "}
                <strong>Cancellation Policy</strong> and{" "}
                <strong>Terms & Conditions</strong>. I understand the refund
                rules before making payment.
              </span>
            </div>

            {/* Proceed button */}
            <button
              className="tcp-proceed-btn"
              style={styles.proceedBtn(accepted)}
              disabled={!accepted}
              onClick={() => accepted && onAccept && onAccept()}
            >
              {accepted
                ? "🚀 Proceed to Payment"
                : "Please accept terms to continue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}