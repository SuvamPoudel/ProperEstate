const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"ProperEstate" <${process.env.EMAIL_USER}>`,
      to, subject, html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

const sendBookingRequestEmail = async (ownerEmail, ownerName, buyerName, buyerEmail, landTitle) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px;">
      <h2 style="color:#1a5c4f;">🏡 New Booking Request - ProperEstate</h2>
      <p>Hello <strong>${ownerName}</strong>,</p>
      <p>You have received a new booking request for your property:</p>
      <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #41A124;margin:20px 0;">
        <p><strong>Property:</strong> ${landTitle}</p>
        <p><strong>Buyer Name:</strong> ${buyerName}</p>
        <p><strong>Buyer Email:</strong> ${buyerEmail}</p>
      </div>
      <p>Please log in to ProperEstate to accept or reject this request.</p>
      <p style="color:#888;font-size:12px;">ProperEstate Team</p>
    </div>`;
  return sendEmail(ownerEmail, `New Booking Request for "${landTitle}"`, html);
};

const sendBookingResponseEmail = async (buyerEmail, buyerName, landTitle, status) => {
  const color = status === 'accepted' ? '#41A124' : '#e53935';
  const icon = status === 'accepted' ? '✅' : '❌';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px;">
      <h2 style="color:${color};">${icon} Booking ${status === 'accepted' ? 'Accepted' : 'Rejected'} - ProperEstate</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>Your booking request for <strong>${landTitle}</strong> has been <strong style="color:${color};">${status}</strong>.</p>
      ${status === 'rejected' ? '<p>Your payment of Rs. 5000 will be refunded within 3-5 business days.</p>' : '<p>The owner will contact you shortly to proceed further.</p>'}
      <p style="color:#888;font-size:12px;">ProperEstate Team</p>
    </div>`;
  return sendEmail(buyerEmail, `Booking ${status} for "${landTitle}"`, html);
};

const sendLandApprovalEmail = async (ownerEmail, ownerName, landTitle, status) => {
  const color = status === 'approved' ? '#41A124' : '#e53935';
  const icon = status === 'approved' ? '✅' : '❌';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px;">
      <h2 style="color:${color};">${icon} Land Listing ${status === 'approved' ? 'Approved' : 'Rejected'} - ProperEstate</h2>
      <p>Hello <strong>${ownerName}</strong>,</p>
      <p>Your land listing <strong>${landTitle}</strong> has been <strong style="color:${color};">${status}</strong> by our admin team.</p>
      ${status === 'approved' ? '<p>Your property is now live and visible to buyers!</p>' : '<p>Please contact support if you have questions about the rejection.</p>'}
      <p style="color:#888;font-size:12px;">ProperEstate Team</p>
    </div>`;
  return sendEmail(ownerEmail, `Land Listing ${status}: "${landTitle}"`, html);
};

const sendHelpCenterEmail = async (senderName, senderEmail, message) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:10px;">
      <h2 style="color:#1a5c4f;">📩 New Help Center Message - ProperEstate</h2>
      <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
      <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #41A124;margin:20px 0;">
        <p>${message}</p>
      </div>
    </div>`;
  return sendEmail('suvampoudel62@gmail.com', `Help Center: Message from ${senderName}`, html);
};

module.exports = { sendEmail, sendBookingRequestEmail, sendBookingResponseEmail, sendLandApprovalEmail, sendHelpCenterEmail };
