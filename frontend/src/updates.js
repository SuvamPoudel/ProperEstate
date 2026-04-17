import React, { useState } from "react";

/* ================= 1. ADVANCED ESEWA UI ================= */
export const EsewaPaymentUI = ({ amount, description, onSuccess, onCancel }) => {
  const [step, setStep] = useState("form");

  const handlePayment = () => {
    setStep("processing");

    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2500);
  };

  return (
    <div className="esewa-overlay">
      <div className="esewa-box">
        {step === "form" && (
          <>
            <h2 style={{ color: "#41A124" }}>eSewa Payment</h2>
            <p>{description}</p>
            <h3>Rs. {amount}</h3>

            <input placeholder="eSewa ID" className="input" />
            <input placeholder="Password" type="password" className="input" />

            <button className="btn-esewa" onClick={handlePayment}>
              Pay Now
            </button>
            <button className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </>
        )}

        {step === "processing" && (
          <div className="center">
            <div className="spinner"></div>
            <p>Processing Payment...</p>
          </div>
        )}

        {step === "success" && (
          <div className="center success">
            <h2>✅ Payment Successful</h2>
            <p>Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= 2. EDIT LAND COMPONENT ================= */
export const EditLandModal = ({ land, onClose, onUpdated }) => {
  const [form, setForm] = useState({ ...land });

  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:5000/update-land/${land._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if ((await res.json()).success) {
      alert("Updated!");
      onUpdated();
      onClose();
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h2>Edit Property</h2>

        <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
        <input value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} />
        <input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} />

        <button className="btn-primary" onClick={handleUpdate}>Save Changes</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

/* ================= 3. NEPAL LOCATION FIELDS ================= */
export const NepalLocationFields = ({ formData, setFormData }) => {
  return (
    <>
      <input placeholder="Province (e.g. Bagmati)" 
        onChange={(e)=>setFormData({...formData, province:e.target.value})} />

      <input placeholder="District (e.g. Kathmandu)" 
        onChange={(e)=>setFormData({...formData, district:e.target.value})} />

      <input placeholder="City / Area" 
        onChange={(e)=>setFormData({...formData, city:e.target.value})} />

      <input placeholder="Owner Email" 
        onChange={(e)=>setFormData({...formData, email:e.target.value})} />
    </>
  );
};

/* ================= 4. EMAIL SENDER ================= */
export const sendEmailToOwner = async (email, message) => {
  await fetch("http://localhost:5000/send-email", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, message })
  });
};

/* ================= 5. HELP CENTER ================= */
export const HelpCenter = () => {
  const [msg, setMsg] = useState("");

  const sendHelp = async () => {
    await fetch("http://localhost:5000/send-email", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        email: "suvampoudel62@gmail.com",
        message: msg
      })
    });

    alert("Message sent!");
    setMsg("");
  };

  return (
    <div className="container">
      <h2>Help Center</h2>
      <textarea
        placeholder="Describe your problem..."
        value={msg}
        onChange={(e)=>setMsg(e.target.value)}
      />
      <button className="btn-primary" onClick={sendHelp}>
        Send Message
      </button>
    </div>
  );
};

/* ================= 6. CHAT STYLE SUGGESTOR ================= */
export const SmartChatSuggestor = () => {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! What do you need?" }
  ]);

  const options = [
    "Buy Land",
    "Rent Land",
    "Investment Advice",
    "Cheap Land"
  ];

  const handleOption = (opt) => {
    let reply = "";

    if (opt === "Buy Land") reply = "Kathmandu & Pokhara are best.";
    if (opt === "Cheap Land") reply = "Try Chitwan or Terai regions.";
    if (opt === "Investment Advice") reply = "Go for developing areas.";

    setMessages([
      ...messages,
      { from: "user", text: opt },
      { from: "bot", text: reply }
    ]);
  };

  return (
    <div className="chat-suggestor">
      <div className="chat-box">
        {messages.map((m,i)=>(
          <div key={i} className={m.from}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="chat-options">
        {options.map(o=>(
          <button key={o} onClick={()=>handleOption(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
};