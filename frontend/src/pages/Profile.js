import React, { useState } from "react";

function Profile({ user, setUser }) {
  const [preview, setPreview] = useState(null);

  const updateProfile = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    form.append("userId", user._id);

    fetch("http://localhost:5000/update-profile", {
      method: "POST",
      body: form,
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        alert("Profile updated");
      });
  };

  return (
    <div className="card large-card">
      <h2>My Profile</h2>

      {user.avatar && (
        <img
          src={`http://localhost:5000/uploads/${user.avatar}`}
          alt=""
          style={{ width: 120, borderRadius: "50%" }}
        />
      )}

      <form onSubmit={updateProfile} encType="multipart/form-data">
        <input name="name" defaultValue={user.name} />
        <input name="phone" defaultValue={user.phone} />

        <input
          type="file"
          name="avatar"
          onChange={(e) =>
            setPreview(URL.createObjectURL(e.target.files[0]))
          }
        />

        {preview && <img src={preview} alt="" width="100" />}

        <button>Save</button>
      </form>
    </div>
  );
}

export default Profile;