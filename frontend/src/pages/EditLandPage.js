import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { API_URL } from "../constants";
import LandForm from "../components/LandForm";

const EditLandPage = ({ user }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { fetch(`${API_URL}/land/` + id).then(r => r.json()).then(d => setLand(d.land)); }, [id]);
  if (!user) return <Navigate to="/login" />;
  if (!land) return <div className="loading">Loading...</div>;
  if (land.ownerId !== user._id) return <Navigate to="/" />;
  const handleEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    const res = await fetch(`${API_URL}/edit-land/` + id, { method: "PUT", body: fd });
    const data = await res.json();
    if (data.success) { alert("Land updated successfully!"); navigate("/dashboard/listed"); }
    else alert(data.message || "Update failed");
  };
  return (<div className="auth-container wide"><h2>Edit Property</h2><LandForm initialData={land} onSubmit={handleEdit} submitLabel="Save Changes" /></div>);
};

export default EditLandPage;
