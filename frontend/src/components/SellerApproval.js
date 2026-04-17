import React, { useState } from "react";

const SellerApproval = ({ user }) => {
  const [lands, setLands] = useState([]);
  const [newLand, setNewLand] = useState({ title:"", location:"", price:"500" });

  const handleAddLand = () => {
    if (!newLand.title || !newLand.location) return alert("Fill all fields!");
    const land = { ...newLand, status: "pending", id: Date.now() };
    setLands(prev => [...prev, land]);
    alert("₹500 eSewa demo payment completed! Land pending admin approval.");
    setNewLand({ title:"", location:"", price:"500" });
  };

  const handleAdminApprove = (id) => {
    setLands(prev => prev.map(l => l.id === id ? { ...l, status: "approved" } : l));
    alert("Admin approved this land!");
  };

  return (
    <div className="seller-approval">
      <h3>List Your Land (Seller Flow)</h3>
      <input placeholder="Title" value={newLand.title} onChange={e=>setNewLand({...newLand,title:e.target.value})} />
      <input placeholder="Location" value={newLand.location} onChange={e=>setNewLand({...newLand,location:e.target.value})} />
      <button onClick={handleAddLand}>Pay ₹500 & Submit</button>

      <h4>Your Uploaded Lands</h4>
      {lands.length === 0 && <p>No uploads yet.</p>}
      {lands.map(l => (
        <div key={l.id} style={{border:"1px solid #ccc", margin:"5px", padding:"5px"}}>
          <strong>{l.title}</strong> - {l.location} - Status: {l.status}
          {l.status==="pending" && <button onClick={()=>handleAdminApprove(l.id)}>Admin Approve</button>}
        </div>
      ))}
    </div>
  );
};

export default SellerApproval;