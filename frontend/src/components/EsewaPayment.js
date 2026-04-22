import React, { useState, useEffect } from "react";

const EsewaPayment = ({ amount, description, onSuccess, onCancel }) => {
  const [step, setStep] = useState("form"); // form | processing | success
  const [phone, setPhone] = useState("");
  const [mpin, setMpin] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  // Animate progress bar during processing
  useEffect(() => {
    if (step !== "processing") return;
    setProgress(0);
    const start = Date.now();
    const duration = 2400;
    const raf = () => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [step]);

  const handlePay = () => {
    setError("");
    if (!phone || phone.length < 10) { setError("Enter a valid eSewa ID or mobile number"); return; }
    if (!mpin || mpin.length < 4) { setError("Enter your MPIN (minimum 4 digits)"); return; }
    setStep("processing");
    setTimeout(() => setStep("success"), 2500);
    setTimeout(() => onSuccess(), 3200);
  };

  const handleMpinChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setMpin(val);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <div style={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#60BB46"/>
                <text x="20" y="27" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">e</text>
              </svg>
            </div>
            <div>
              <div style={styles.logoText}>eSewa</div>
              <div style={styles.logoSub}>Digital Wallet</div>
            </div>
          </div>
          {step === "form" && (
            <button style={styles.closeBtn} onClick={onCancel} title="Cancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Amount banner ── */}
        <div style={styles.amountBanner}>
          <div style={styles.amountLabel}>Total Payable</div>
          <div style={styles.amountValue}>NPR {amount.toLocaleString()}</div>
          <div style={styles.amountDesc}>{description}</div>
        </div>

        {/* ── Form ── */}
        {step === "form" && (
          <div style={styles.body}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>eSewa ID / Mobile Number</label>
              <div style={styles.phoneRow}>
                <div style={styles.countryCode}>
                  <span style={{fontSize:"1rem"}}>🇳🇵</span>
                  <span style={styles.countryNum}>+977</span>
                </div>
                <input
                  style={styles.phoneInput}
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  maxLength={10}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MPIN</label>
              <input
                style={styles.mpinInput}
                type="password"
                placeholder="Enter MPIN"
                value={mpin}
                maxLength={6}
                onChange={handleMpinChange}
                onKeyDown={e => e.key === "Enter" && handlePay()}
              />
              <div style={styles.mpinDots}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    ...styles.mpinDot,
                    background: i < mpin.length ? "#60BB46" : "rgba(255,255,255,0.15)"
                  }} />
                ))}
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button style={styles.payBtn} onClick={handlePay}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Pay NPR {amount.toLocaleString()}
            </button>

            <button style={styles.cancelBtn} onClick={onCancel}>Cancel Payment</button>

            <div style={styles.secureRow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60BB46" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={styles.secureText}>256-bit SSL Secured · Demo Mode</span>
            </div>
          </div>
        )}

        {/* ── Processing ── */}
        {step === "processing" && (
          <div style={styles.processingWrap}>
            <div style={styles.processingRing}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{animation:"esewaSpin 1s linear infinite"}}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(96,187,70,0.15)" strokeWidth="4"/>
                <circle cx="32" cy="32" r="28" fill="none" stroke="#60BB46" strokeWidth="4"
                  strokeDasharray="44 132" strokeLinecap="round"/>
              </svg>
              <div style={styles.processingLogo}>e</div>
            </div>
            <div style={styles.processingTitle}>Processing Payment</div>
            <div style={styles.processingDesc}>Please do not close this window</div>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${progress}%`}} />
            </div>
            <div style={styles.processingAmount}>NPR {amount.toLocaleString()}</div>
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div style={styles.successWrap}>
            <div style={styles.successRing}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="34" fill="rgba(96,187,70,0.12)" stroke="#60BB46" strokeWidth="2"/>
                <polyline points="22,36 32,46 50,28" fill="none" stroke="#60BB46" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{strokeDasharray:40, strokeDashoffset:0, animation:"esewaCheck 0.4s ease forwards"}}/>
              </svg>
            </div>
            <div style={styles.successTitle}>Payment Successful!</div>
            <div style={styles.successAmount}>NPR {amount.toLocaleString()}</div>
            <div style={styles.successDesc}>Transaction completed via eSewa</div>
            <div style={styles.successRef}>Ref: ESW{Date.now().toString().slice(-8)}</div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Powered by</span>
          <span style={styles.footerBrand}>eSewa</span>
          <span style={styles.footerDot}>·</span>
          <span style={styles.footerText}>F1Soft Group</span>
        </div>

      </div>

      <style>{`
        @keyframes esewaSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes esewaCheck {
          from { stroke-dashoffset: 40; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes esewaModalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "380px",
    background: "#1a1f2e",
    border: "1px solid rgba(96,187,70,0.25)",
    borderTop: "2px solid #60BB46",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(96,187,70,0.1)",
    animation: "esewaModalIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(96,187,70,0.05)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#60BB46",
    letterSpacing: "0.04em",
    lineHeight: 1,
  },
  logoSub: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.6rem",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginTop: "1px",
  },
  closeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  amountBanner: {
    padding: "16px",
    background: "linear-gradient(135deg, rgba(96,187,70,0.12) 0%, rgba(96,187,70,0.04) 100%)",
    borderBottom: "1px solid rgba(96,187,70,0.12)",
    textAlign: "center",
  },
  amountLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.6rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(96,187,70,0.7)",
    marginBottom: "4px",
  },
  amountValue: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#60BB46",
    letterSpacing: "0.02em",
    lineHeight: 1,
    marginBottom: "4px",
  },
  amountDesc: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.03em",
  },
  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  phoneRow: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  countryCode: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "0 10px",
    height: "40px",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  countryNum: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
  },
  phoneInput: {
    flex: 1,
    height: "40px",
    padding: "0 12px",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "0.06em",
  },
  mpinInput: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.2rem",
    letterSpacing: "0.3em",
    color: "#fff",
    boxSizing: "border-box",
  },
  mpinDots: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
    marginTop: "6px",
  },
  mpinDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "background 0.15s",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: "6px",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.72rem",
    color: "#ff6666",
    letterSpacing: "0.03em",
  },
  payBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    height: "44px",
    background: "linear-gradient(135deg, #60BB46 0%, #4da336 100%)",
    border: "none",
    borderRadius: "8px",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.88rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(96,187,70,0.3)",
    transition: "opacity 0.15s, transform 0.1s",
    marginTop: "4px",
  },
  cancelBtn: {
    width: "100%",
    height: "36px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
  },
  secureRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
  },
  secureText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.58rem",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.06em",
  },
  // Processing
  processingWrap: {
    padding: "32px 20px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  processingRing: {
    position: "relative",
    width: 64,
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  processingLogo: {
    position: "absolute",
    fontFamily: "Arial, sans-serif",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#60BB46",
  },
  processingTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#fff",
  },
  processingDesc: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.68rem",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.06em",
  },
  progressBar: {
    width: "100%",
    height: "3px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "2px",
    overflow: "hidden",
    marginTop: "4px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #60BB46, #8de070)",
    borderRadius: "2px",
    transition: "width 0.1s linear",
  },
  processingAmount: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(96,187,70,0.7)",
    letterSpacing: "0.06em",
  },
  // Success
  successWrap: {
    padding: "28px 20px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  successRing: {
    marginBottom: "4px",
  },
  successTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#60BB46",
  },
  successAmount: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.04em",
  },
  successDesc: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.04em",
  },
  successRef: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.62rem",
    color: "rgba(96,187,70,0.6)",
    letterSpacing: "0.1em",
    marginTop: "2px",
  },
  // Footer
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "10px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(0,0,0,0.2)",
  },
  footerText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.58rem",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.06em",
  },
  footerBrand: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "0.62rem",
    fontWeight: 700,
    color: "#60BB46",
    letterSpacing: "0.06em",
  },
  footerDot: {
    color: "rgba(255,255,255,0.2)",
    fontSize: "0.6rem",
  },
};

export default EsewaPayment;
