import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import "./App.css";
import ChatApp from "./components/chatting";

const getUserFromStorage = () => {
  const saved = localStorage.getItem("properEstateUser");
  return saved ? JSON.parse(saved) : null;
};

/* ===== ESEWA PAYMENT ===== */
const DummyEsewaPayment = ({ amount, description, onSuccess, onCancel }) => {
  const [step, setStep] = useState("form");
  const [mpin, setMpin] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const handlePay = () => {
    if (!phone || phone.length < 10) { setError("Enter a valid eSewa ID / phone number"); return; }
    if (!mpin || mpin.length < 4) { setError("Enter your MPIN (min 4 digits)"); return; }
    setError(""); setStep("processing");
    setTimeout(() => setStep("success"), 2500);
    setTimeout(() => onSuccess(), 3500);
  };
  return (
    <div className="esewa-overlay"><div className="esewa-modal">
      <div className="esewa-header">
        <div className="esewa-logo"><span className="esewa-logo-e">e</span>Sewa</div>
        <button className="esewa-close" onClick={onCancel}>&#x2715;</button>
      </div>
      {step === "form" && (
        <div className="esewa-body">
          <div className="esewa-amount-box">
            <p className="esewa-label">Total Amount</p>
            <h2 className="esewa-amount">NPR {amount.toLocaleString()}</h2>
            <p className="esewa-desc">{description}</p>
          </div>
          <div className="esewa-form">
            <label>eSewa ID / Mobile Number</label>
            <div className="esewa-input-row">
              <span className="esewa-flag">&#127475;&#127477; +977</span>
              <input type="tel" placeholder="98XXXXXXXX" value={phone} maxLength={10} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} />
            </div>
            <label style={{ marginTop: 14 }}>MPIN</label>
            <input type="password" className="esewa-mpin" placeholder="&#9679; &#9679; &#9679; &#9679;" maxLength={6} value={mpin} onChange={e => setMpin(e.target.value.replace(/\D/g, ""))} />
            {error && <p className="esewa-error">{error}</p>}
            <button className="esewa-pay-btn" onClick={handlePay}>Pay NPR {amount.toLocaleString()}</button>
            <button className="esewa-cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
          <p className="esewa-secure">Secured by eSewa - Demo Mode</p>
        </div>
      )}
      {step === "processing" && (<div className="esewa-processing"><div className="esewa-spinner"></div><p>Processing Payment...</p><p className="esewa-proc-sub">Please do not close this window</p></div>)}
      {step === "success" && (<div className="esewa-success"><div className="esewa-check">&#10003;</div><h3>Payment Successful!</h3><p>NPR {amount.toLocaleString()} paid via eSewa</p></div>)}
    </div></div>
  );
};

/* ===== SMART RENT ADVISOR ===== */
// NLP-style intent detection
function detectIntent(text) {
  const t = text.toLowerCase().trim();
  // Greetings
  if (t.match(/^(hi|hello|hey|namaste|namaskar|yo|sup|howdy|good morning|good evening|good afternoon|hola)/)) return { type: "greeting" };
  // Help with website navigation
  if (t.match(/how (do i|to|can i)|where (do i|can i|is)|what is|explain|guide|help me|navigate|use (the|this)|find|search|post|list|upload|add|create account|sign up|register|login|log in|book|rent|contact|chat|message|profile|edit|delete|save|wishlist|filter|browse/)) return { type: "website_help", text: t };
  // Seller account
  if (t.match(/seller|become.*seller|list.*property|post.*land|upload.*property|how.*post|want.*sell|want.*rent.*out/)) return { type: "become_seller" };
  // Buyer account
  if (t.match(/buyer|renter|tenant|how.*rent|want.*rent|looking.*rent|need.*place|find.*house|find.*flat|find.*room/)) return { type: "buyer_info" };
  // Cities
  if (t.match(/kathmandu|ktm|lalitpur|bhaktapur|patan/)) return { type: "city", city: "ktm" };
  if (t.match(/pokhara|lakeside/)) return { type: "city", city: "pkr" };
  if (t.match(/chitwan|bharatpur|narayanghat/)) return { type: "city", city: "chitwan" };
  if (t.match(/butwal|bhairahawa|rupandehi/)) return { type: "city", city: "butwal" };
  if (t.match(/biratnagar|morang|sunsari|itahari/)) return { type: "city", city: "biratnagar" };
  if (t.match(/pokhara|kaski/)) return { type: "city", city: "pkr" };
  // Property types
  if (t.match(/room|kotha|1bhk|single room|hostel|pg|paying guest/)) return { type: "property", prop: "room" };
  if (t.match(/flat|apartment|2bhk|3bhk|bhk|floor/)) return { type: "property", prop: "flat" };
  if (t.match(/house|bungalow|full house|ghar|makan/)) return { type: "property", prop: "house" };
  if (t.match(/shop|pasal|showroom|store|retail/)) return { type: "property", prop: "shop" };
  if (t.match(/office|karya|workspace|cowork/)) return { type: "property", prop: "office" };
  if (t.match(/warehouse|godown|storage|factory|industrial/)) return { type: "property", prop: "warehouse" };
  if (t.match(/restaurant|cafe|food|kitchen|dhaba/)) return { type: "property", prop: "restaurant" };
  if (t.match(/agri|farm|khet|agricultural|land|plot|field/)) return { type: "property", prop: "agri" };
  // Budget
  if (t.match(/cheap|sasto|affordable|low budget|budget|under 10|less than 10|10000|5000|8000/)) return { type: "budget", range: "low" };
  if (t.match(/mid|medium|moderate|10.*30|20.*40|15000|20000|25000/)) return { type: "budget", range: "mid" };
  if (t.match(/premium|luxury|high|expensive|above 30|50000|lakh|1 lakh/)) return { type: "budget", range: "high" };
  // Process/tips
  if (t.match(/process|how.*work|steps|procedure|tips|checklist|agreement|contract|advance|deposit|malpot|ward/)) return { type: "tips" };
  // Price inquiry
  if (t.match(/price|rate|cost|kati|kitna|how much|rent.*how|monthly|per month/)) return { type: "price_inquiry", text: t };
  // Comparison
  if (t.match(/best|better|compare|vs|versus|which.*city|which.*area|recommend|suggest/)) return { type: "recommendation", text: t };
  // Broker
  if (t.match(/broker|dalal|commission|agent|middleman|no broker|without broker/)) return { type: "broker" };
  // Thanks/bye
  if (t.match(/thank|thanks|dhanyabad|bye|goodbye|ok|okay|got it|understood|clear|perfect|great|awesome/)) return { type: "thanks" };
  return { type: "unknown", text: t };
}

function getResponse(intent, text) {
  switch (intent.type) {
    case "greeting":
      return { msg: "Namaste! I am your Nepal Rent Advisor.\n\nI can help you with:\n- Rental prices in any Nepal city\n- Finding the right property type\n- How to use ProperEstate\n- Renting tips and process\n\nWhat are you looking for today?", opts: [
        { l: "Find a rental property", n: "house" },
        { l: "Rental prices by city", n: "city" },
        { l: "How to use this website", n: "website_guide" },
        { l: "Renting tips", n: "tips" },
      ]};
    case "greeting":
      return { msg: "Namaste! How can I help you today?", opts: [{ l: "Find rental", n: "house" }, { l: "Prices", n: "city" }, { l: "Website help", n: "website_guide" }] };
    case "broker":
      return { msg: "Great question! ProperEstate is 100% broker-free.\n\nBrokers make you broke - that is why we built this platform.\n\nHere you connect DIRECTLY with property owners. No middlemen, no hidden commissions, no broker fees.\n\nJust find a property you like, click 'Request to Rent', and talk directly to the owner via our chat feature.", opts: [{ l: "Browse properties", n: "root" }, { l: "How to rent", n: "tips" }] };
    case "become_seller":
      return { msg: "To list your property on ProperEstate:\n\n1. Go to your Profile (top right avatar)\n2. Scroll to 'Become a Seller' section\n3. Upload your Citizenship / NID / Passport\n4. Wait for admin verification (usually 24hrs)\n5. Once approved, click 'List Property' in the sidebar\n\nYou will need to pay Rs. 1000 platform commission when listing.", opts: [{ l: "Renting process tips", n: "tips" }, { l: "Back to main menu", n: "root" }] };
    case "buyer_info":
      return { msg: "As a buyer/renter on ProperEstate:\n\n1. Browse properties on the home page\n2. Use filters to narrow by location, type, budget\n3. Click any property for full details\n4. Click 'Request to Rent' to send a booking request\n5. Pay Rs. 5000 security deposit via eSewa\n6. Chat directly with the owner\n\nNo broker fees ever!", opts: [{ l: "Browse by city", n: "city" }, { l: "Browse by budget", n: "budget" }, { l: "Renting tips", n: "tips" }] };
    case "website_help":
      return getWebsiteHelp(text || "");
    case "city":
      const cityMap = { ktm: "city_ktm", pkr: "city_pkr", chitwan: "city_chitwan", butwal: "city_butwal", biratnagar: "city_biratnagar" };
      return RENT_TREE[cityMap[intent.city]] || RENT_TREE.city;
    case "property":
      const propMap = { room: "house_1bhk", flat: "house_2bhk", house: "house_full", shop: "comm_shop", office: "comm_office", warehouse: "comm_warehouse", restaurant: "comm_restaurant", agri: "agri" };
      return RENT_TREE[propMap[intent.prop]] || RENT_TREE.house;
    case "budget":
      const budMap = { low: "bud_low", mid: "bud_mid", high: "bud_high" };
      return RENT_TREE[budMap[intent.range]] || RENT_TREE.budget;
    case "tips":
      return RENT_TREE.tips;
    case "price_inquiry":
      return { msg: "I can give you rental prices! Which city or property type are you asking about?\n\nFor example: 'room in Kathmandu' or 'shop in Pokhara'", opts: [
        { l: "Kathmandu prices", n: "city_ktm" },
        { l: "Pokhara prices", n: "city_pkr" },
        { l: "Chitwan prices", n: "city_chitwan" },
        { l: "All cities", n: "city" },
      ]};
    case "recommendation":
      return { msg: "For the best rental value in Nepal:\n\nBest overall value: Pokhara (growing city, lower prices than KTM)\nBest for work: Kathmandu (most jobs, best connectivity)\nBest affordable: Chitwan, Butwal (good infrastructure, low rent)\nBest for business: Birgunj, Biratnagar (trade routes)\n\nWhat is your priority - work, lifestyle, or business?", opts: [
        { l: "Work / Career", n: "city_ktm" },
        { l: "Lifestyle / Tourism", n: "city_pkr" },
        { l: "Affordable living", n: "city_chitwan" },
        { l: "Business / Trade", n: "city_biratnagar" },
      ]};
    case "thanks":
      return { msg: "You are welcome! Feel free to ask anything else about renting in Nepal. Good luck finding your perfect property!", opts: [{ l: "Start over", n: "root" }] };
    default:
      return getSmartFallback(text || "");
  }
}

function getWebsiteHelp(text) {
  if (text.match(/search|find|browse|look/)) return { msg: "To search for properties:\n\n1. Use the search bar at the top of the page\n2. Type a city name, area, or property type\n3. Live suggestions will appear as you type\n4. Click a suggestion to go directly to that property\n\nOr use the Filters button below the search to filter by location, type, and price range.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/post|list|upload|add.*property|create.*listing/)) return { msg: "To list a property for rent:\n\n1. First become a verified seller (Profile > Become Seller)\n2. Click 'List Property' in the left sidebar\n3. Fill in all property details\n4. Upload property photo and Lalpurja document\n5. Pay Rs. 1000 platform commission via eSewa\n6. Wait for admin approval (24-48 hours)\n\nOnce approved, your property goes live!", opts: [{ l: "Become a seller", n: "root" }, { l: "Back", n: "root" }] };
  if (text.match(/book|rent|request|contact.*owner/)) return { msg: "To rent a property:\n\n1. Find a property you like\n2. Click 'Details' to see full info\n3. Click 'Request to Rent'\n4. Enter how long you want to rent (months/years)\n5. Pay Rs. 5000 security deposit via eSewa\n6. The owner gets notified by email\n7. Chat with the owner directly using the chat button\n\nThe owner will accept or reject your request.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/chat|message|talk.*owner|contact/)) return { msg: "To chat with a property owner:\n\n1. Go to any property details page\n2. Click 'Chat with Owner' button\n3. A chat window opens at the bottom right\n4. Type your message and press Enter\n\nYou can also access all your chats by clicking the chat icon in the navigation bar (top right).\n\nNote: Messages auto-delete 1 minute after being read.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/profile|edit.*profile|change.*name|change.*photo|avatar/)) return { msg: "To edit your profile:\n\n1. Click your avatar photo in the top right\n2. Or click 'My Profile' in the sidebar\n3. Click the camera icon to change your photo\n4. Update your name and phone number\n5. Click 'Save Changes'\n\nNote: Email cannot be changed after registration.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/save|wishlist|favorite|heart/)) return { msg: "To save properties to your wishlist:\n\n1. On any property card, click the heart icon\n2. Or on the property details page, click 'Add to Wishlist'\n3. Access your saved properties via Dashboard > My Saved Wishlist\n\nYou must be logged in to save properties.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/login|sign in|account|register|sign up/)) return { msg: "To create an account:\n\n1. Click 'Login' in the top right\n2. Click 'Create an account'\n3. Enter your name, email, and password\n4. Click Register\n\nNew accounts are Buyer accounts by default.\nTo become a seller, go to Profile > Become a Seller.\n\nAlready have an account? Just click Login and enter your credentials.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/filter|price.*range|category|type/)) return { msg: "To filter properties:\n\n1. On the home page, click 'Filters' button\n2. Set location (city or area name)\n3. Choose property type (Residential/Commercial/Agricultural)\n4. Set minimum and maximum rent per month\n5. Filters apply instantly\n\nClick 'Refresh' to reload all properties.", opts: [{ l: "Back to main menu", n: "root" }] };
  if (text.match(/booking.*request|request.*status|my.*request|pending/)) return { msg: "To check your booking requests:\n\n1. Click 'Requests' in the navigation bar (bell icon)\n2. You will see all incoming rental requests for your properties\n3. Click Accept or Reject for each request\n4. The renter gets notified by email automatically\n\nAs a renter, you can see your request status on the property details page.", opts: [{ l: "Back to main menu", n: "root" }] };
  return { msg: "I can help you navigate ProperEstate! What do you need help with?", opts: [
    { l: "How to search properties", n: "website_guide" },
    { l: "How to list a property", n: "website_guide" },
    { l: "How to rent a property", n: "website_guide" },
    { l: "How to chat with owner", n: "website_guide" },
    { l: "Account and profile", n: "website_guide" },
  ]};
}

function getSmartFallback(text) {
  const t = text.toLowerCase();
  // Try to extract any useful keywords
  if (t.length < 3) return { msg: "Could you tell me more? I am here to help with Nepal rentals and using this website.", opts: [{ l: "Show main menu", n: "root" }] };
  if (t.match(/\d+/)) {
    const num = parseInt(t.match(/\d+/)[0]);
    if (num < 10000) return { msg: "For a budget under Rs. " + num.toLocaleString() + "/month, you can find rooms in smaller cities like Chitwan, Butwal, or Biratnagar. Kathmandu outskirts also have options in this range.", opts: [{ l: "Affordable options", n: "bud_low" }, { l: "Back", n: "root" }] };
    if (num < 30000) return { msg: "With Rs. " + num.toLocaleString() + "/month budget, you have good options! You can get a 2BHK flat in Pokhara, Chitwan, or Kathmandu mid-areas.", opts: [{ l: "Mid-range options", n: "bud_mid" }, { l: "Back", n: "root" }] };
    return { msg: "With Rs. " + num.toLocaleString() + "/month, you can access premium properties in Kathmandu prime areas or commercial spaces in major cities.", opts: [{ l: "Premium options", n: "bud_high" }, { l: "Back", n: "root" }] };
  }
  return { msg: "I am not sure I understood that. I can help you with:\n\n- Rental prices in Nepal cities\n- Finding the right property type\n- How to use ProperEstate website\n- Renting tips and process\n\nTry asking something like 'room in Kathmandu' or 'how do I post a property'", opts: [
    { l: "Show main menu", n: "root" },
    { l: "Rental prices", n: "city" },
    { l: "Website help", n: "website_guide" },
  ]};
}

const RENT_TREE = {
  root: { msg: "Namaste! I am your Nepal Rent Advisor.\n\nWhat are you looking for?", opts: [
    { l: "Find a House / Flat to Rent", n: "house" },
    { l: "Rent Commercial Space", n: "commercial" },
    { l: "Rent Agricultural Land", n: "agri" },
    { l: "Rental Prices by City", n: "city" },
    { l: "Rent by Budget", n: "budget" },
    { l: "How to Use This Website", n: "website_guide" },
    { l: "Renting Tips & Process", n: "tips" },
  ]},
  house: { msg: "Renting a house or flat. Which type?", opts: [
    { l: "Single Room / 1BHK", n: "house_1bhk" },
    { l: "2-3 BHK Flat / Apartment", n: "house_2bhk" },
    { l: "Full House / Bungalow", n: "house_full" },
    { l: "Back", n: "root" },
  ]},
  house_1bhk: { msg: "Single Room / 1BHK Rent in Nepal:\n\nKathmandu (Koteshwor, Baneshwor): Rs. 8,000-18,000/mo\nKathmandu (Kirtipur, Balkhu): Rs. 5,000-10,000/mo\nPokhara: Rs. 5,000-12,000/mo\nChitwan (Bharatpur): Rs. 4,000-9,000/mo\nButwal / Bhairahawa: Rs. 3,500-8,000/mo\n\nTip: Rooms near colleges/hospitals rent faster. Always get a written agreement.", opts: [{ l: "Renting Process", n: "tips" }, { l: "Back", n: "house" }] },
  house_2bhk: { msg: "2-3 BHK Flat Rent in Nepal:\n\nKathmandu prime (Lazimpat, Maharajgunj): Rs. 25,000-60,000/mo\nKathmandu mid (Balaju, Kalanki): Rs. 15,000-30,000/mo\nPokhara Lakeside: Rs. 18,000-40,000/mo\nChitwan: Rs. 10,000-22,000/mo\nButwal: Rs. 8,000-18,000/mo\n\nTip: Furnished flats cost 20-40% more. Check water supply and parking.", opts: [{ l: "Renting Process", n: "tips" }, { l: "Back", n: "house" }] },
  house_full: { msg: "Full House / Bungalow Rent:\n\nKathmandu (Patan, Bhaktapur): Rs. 40,000-1.5 Lakh/mo\nPokhara: Rs. 30,000-80,000/mo\nChitwan: Rs. 20,000-50,000/mo\n\nTip: Full houses usually require 2-3 months advance + 1 month deposit.", opts: [{ l: "Back", n: "house" }] },
  commercial: { msg: "Commercial space rental. What type?", opts: [
    { l: "Shop / Showroom", n: "comm_shop" },
    { l: "Office Space", n: "comm_office" },
    { l: "Warehouse / Godown", n: "comm_warehouse" },
    { l: "Restaurant Space", n: "comm_restaurant" },
    { l: "Back", n: "root" },
  ]},
  comm_shop: { msg: "Shop / Showroom Rent:\n\nKathmandu (New Road, Thamel): Rs. 50,000-3 Lakh/mo\nKathmandu (Ring Road facing): Rs. 30,000-1.5 Lakh/mo\nPokhara Lakeside: Rs. 25,000-80,000/mo\nChitwan Highway: Rs. 15,000-50,000/mo\nButwal, Biratnagar: Rs. 10,000-40,000/mo\n\nTip: Road frontage doubles the rent. Check footfall before signing.", opts: [{ l: "Back", n: "commercial" }] },
  comm_office: { msg: "Office Space Rent:\n\nKathmandu (Durbarmarg, Hattisar): Rs. 60-150/sqft/mo\nKathmandu (Pulchowk, Jhamsikhel): Rs. 40-90/sqft/mo\nPokhara: Rs. 30-70/sqft/mo\n\nTip: Co-working spaces in Kathmandu start at Rs. 5,000/desk/mo.", opts: [{ l: "Back", n: "commercial" }] },
  comm_warehouse: { msg: "Warehouse / Godown Rent:\n\nKathmandu (Balaju, Thankot): Rs. 15-35/sqft/mo\nBirgunj (India border): Rs. 8-20/sqft/mo\nBiratnagar: Rs. 10-25/sqft/mo\n\nTip: Check road access for trucks. Birgunj is best for import/export.", opts: [{ l: "Back", n: "commercial" }] },
  comm_restaurant: { msg: "Restaurant Space Rent:\n\nThamel (tourist area): Rs. 80,000-3 Lakh/mo\nJhamsikhel / Sanepa: Rs. 50,000-1.5 Lakh/mo\nPokhara Lakeside: Rs. 40,000-1 Lakh/mo\n\nTip: Check kitchen ventilation rules, water supply, and parking.", opts: [{ l: "Back", n: "commercial" }] },
  agri: { msg: "Agricultural Land Rent in Nepal:\n\nChitwan / Nawalpur: Rs. 8,000-25,000/kattha/year\nRupandehi / Kapilvastu: Rs. 6,000-20,000/kattha/year\nSunsari / Morang: Rs. 7,000-22,000/kattha/year\nKailali / Kanchanpur: Rs. 4,000-15,000/kattha/year\n\nTip: Terai land is most fertile. Always register at local Malpot office.", opts: [{ l: "Renting Process", n: "tips" }, { l: "Back", n: "root" }] },
  city: { msg: "Which city are you looking to rent in?", opts: [
    { l: "Kathmandu", n: "city_ktm" },
    { l: "Pokhara", n: "city_pkr" },
    { l: "Chitwan", n: "city_chitwan" },
    { l: "Butwal / Bhairahawa", n: "city_butwal" },
    { l: "Biratnagar", n: "city_biratnagar" },
    { l: "Back", n: "root" },
  ]},
  city_ktm: { msg: "Kathmandu Rental Market 2025:\n\nTrend: Prices up 12% from last year\nRoom: Rs. 6,000-18,000/mo\n2BHK Flat: Rs. 18,000-50,000/mo\nOffice: Rs. 40-150/sqft/mo\nShop (Ring Road): Rs. 30,000-1.5L/mo\n\nHot areas: Baluwatar, Jhamsikhel, Lazimpat\nAffordable: Kirtipur, Balkhu, Thankot\n\nTip: Demand exceeds supply - act fast on good listings!", opts: [{ l: "Back", n: "city" }] },
  city_pkr: { msg: "Pokhara Rental Market 2025:\n\nTrend: Tourism recovery boosting rents\nRoom: Rs. 5,000-12,000/mo\n2BHK Flat: Rs. 15,000-35,000/mo\nShop (Lakeside): Rs. 25,000-80,000/mo\n\nHot areas: Lakeside, Birauta, Newroad\nAffordable: Hemja, Lekhnath, Pokhara-6\n\nTip: Lakeside rents spike in tourist season (Oct-Feb).", opts: [{ l: "Back", n: "city" }] },
  city_chitwan: { msg: "Chitwan Rental Market 2025:\n\nRoom: Rs. 4,000-9,000/mo\n2BHK Flat: Rs. 10,000-22,000/mo\nShop (Narayanghat): Rs. 15,000-50,000/mo\nAgri land: Rs. 8,000-25,000/kattha/year\n\nHot areas: Bharatpur-10, Narayanghat\nTip: Chitwan is growing fast - great value vs Kathmandu.", opts: [{ l: "Back", n: "city" }] },
  city_butwal: { msg: "Butwal / Bhairahawa Rental Market:\n\nRoom: Rs. 3,500-8,000/mo\n2BHK Flat: Rs. 8,000-18,000/mo\nShop (Highway): Rs. 10,000-40,000/mo\n\nTip: Bhairahawa airport expansion is driving up commercial rents.", opts: [{ l: "Back", n: "city" }] },
  city_biratnagar: { msg: "Biratnagar Rental Market:\n\nRoom: Rs. 4,000-10,000/mo\n2BHK Flat: Rs. 10,000-22,000/mo\nWarehouse: Rs. 10-25/sqft/mo\nShop: Rs. 12,000-45,000/mo\n\nTip: Industrial zone has affordable warehouse space.", opts: [{ l: "Back", n: "city" }] },
  budget: { msg: "What is your monthly rental budget?", opts: [
    { l: "Under Rs. 10,000/mo", n: "bud_low" },
    { l: "Rs. 10,000-30,000/mo", n: "bud_mid" },
    { l: "Above Rs. 30,000/mo", n: "bud_high" },
    { l: "Back", n: "root" },
  ]},
  bud_low: { msg: "Under Rs. 10,000/month - best options:\n\nSingle room in Kathmandu outskirts (Kirtipur, Balkhu)\n1BHK in Pokhara (Hemja, Lekhnath)\nRoom in Chitwan, Butwal, Biratnagar\nAgricultural land in Terai (per year basis)\n\nTip: Share accommodation to cut costs.", opts: [{ l: "Back", n: "budget" }] },
  bud_mid: { msg: "Rs. 10,000-30,000/month - best options:\n\n2BHK flat in Kathmandu mid-areas\n2BHK in Pokhara Lakeside area\nSmall shop in Chitwan / Butwal\nFull house in Biratnagar / Butwal\n\nTip: This budget gets you a comfortable flat in most cities outside Kathmandu prime.", opts: [{ l: "Back", n: "budget" }] },
  bud_high: { msg: "Above Rs. 30,000/month - premium options:\n\n3BHK furnished flat in Kathmandu prime\nCommercial shop in Thamel / Lakeside\nFull bungalow in Pokhara\nOffice space in Durbarmarg / Hattisar\n\nTip: Negotiate 10-15% discount for 2+ year lease agreements.", opts: [{ l: "Back", n: "budget" }] },
  tips: { msg: "Nepal Renting Process and Tips:\n\n1. Find property - Visit in person\n2. Negotiate rent + advance (usually 2-3 months)\n3. Sign written agreement (Bhaada Salaami Patra)\n4. Register at local ward office if more than 1 year\n5. Keep receipts of all payments\n\nImportant:\n- Always get a written contract\n- Clarify who pays electricity/water\n- Check for hidden charges\n- Malpot registration protects both parties", opts: [
    { l: "Pre-Rental Checklist", n: "tips_checklist" },
    { l: "Back", n: "root" }
  ]},
  tips_checklist: { msg: "Pre-Rental Checklist:\n\nProperty Check:\n- Water supply (24hr or tanker?)\n- Electricity load shedding schedule\n- Internet availability\n- Parking space\n- Roof condition (leaks in monsoon?)\n\nDocument Check:\n- Owner citizenship copy\n- Land ownership certificate (Lalpurja)\n- Previous tenant references\n\nCost Check:\n- Monthly rent amount\n- Advance deposit (refundable?)\n- Maintenance charges\n- Electricity/water included?", opts: [{ l: "Back", n: "tips" }] },
  website_guide: { msg: "How can I help you use ProperEstate?", opts: [
    { l: "How to search for properties", n: "wg_search" },
    { l: "How to list / post a property", n: "wg_post" },
    { l: "How to rent / book a property", n: "wg_book" },
    { l: "How to chat with owner", n: "wg_chat" },
    { l: "Account and profile help", n: "wg_account" },
    { l: "Back", n: "root" },
  ]},
  wg_search: { msg: "To search for properties:\n\n1. Use the search bar at the top of the page\n2. Type a city name, area, or property type\n3. Live suggestions appear as you type\n4. Click a suggestion to go directly to that property\n\nOr use the Filters button to filter by location, type, and price range.", opts: [{ l: "Back to website guide", n: "website_guide" }] },
  wg_post: { msg: "To list a property for rent:\n\n1. First become a verified seller (Profile > Become Seller)\n2. Upload your Citizenship / NID / Passport\n3. Wait for admin approval (24-48 hours)\n4. Click 'List Property' in the left sidebar\n5. Fill in all property details\n6. Pay Rs. 1000 platform commission via eSewa\n7. Wait for admin approval of your listing\n\nOnce approved, your property goes live!", opts: [{ l: "Back to website guide", n: "website_guide" }] },
  wg_book: { msg: "To rent a property:\n\n1. Find a property you like on the home page\n2. Click 'Details' to see full information\n3. Click 'Request to Rent'\n4. Enter how long you want to rent (months/years)\n5. Pay Rs. 5000 security deposit via eSewa\n6. The owner gets notified by email\n7. Chat with the owner using the chat button\n\nThe owner will accept or reject your request.", opts: [{ l: "Back to website guide", n: "website_guide" }] },
  wg_chat: { msg: "To chat with a property owner:\n\n1. Go to any property details page\n2. Click 'Chat with Owner' button\n3. A chat window opens at the bottom right\n4. Type your message and press Enter\n\nYou can also access all chats by clicking the chat icon in the navigation bar.\n\nNote: Messages auto-delete 1 minute after being read to save database space.", opts: [{ l: "Back to website guide", n: "website_guide" }] },
  wg_account: { msg: "Account help:\n\nCreate account: Click Login > Create an account\nNew accounts are Buyer accounts by default\n\nBecome a Seller:\n1. Go to Profile (top right avatar)\n2. Scroll to 'Become a Seller'\n3. Upload your ID document\n4. Wait for admin verification\n\nEdit profile: Click your avatar > My Profile\nChange photo: Click camera icon on your avatar", opts: [{ l: "Back to website guide", n: "website_guide" }] },
};

/* ===== SMART SUGGESTOR COMPONENT ===== */
const SmartSuggestor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [freeInput, setFreeInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (isOpen && chatLog.length === 0) {
      const root = RENT_TREE.root;
      setChatLog([{ from: "bot", text: root.msg, opts: root.opts }]);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isTyping]);

  const addBotResponse = (response) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatLog(prev => [...prev, { from: "bot", text: response.msg, opts: response.opts }]);
    }, 600);
  };

  const handleOption = (opt) => {
    const node = RENT_TREE[opt.n];
    if (!node) return;
    setChatLog(prev => [...prev, { from: "user", text: opt.l }]);
    addBotResponse(node);
  };

  const handleReset = () => {
    setChatLog([{ from: "bot", text: RENT_TREE.root.msg, opts: RENT_TREE.root.opts }]);
  };

  const submitFree = (e) => {
    e.preventDefault();
    const text = freeInput.trim();
    if (!text) return;
    setFreeInput("");
    setChatLog(prev => [...prev, { from: "user", text }]);
    const intent = detectIntent(text);
    const response = getResponse(intent, text);
    addBotResponse(response);
  };

  return (
    <>
      <button className="suggestor-trigger-btn" onClick={() => setIsOpen(!isOpen)}>
        Rent Advisor
      </button>
      {isOpen && (
        <div className="suggestor-panel">
          <div className="suggestor-header">
            <span>Nepal Rent Advisor</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleReset} title="Restart" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>&#8635;</button>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>&#x2715;</button>
            </div>
          </div>
          <div className="suggestor-messages">
            {chatLog.map((msg, i) => (
              <div key={i} className={"suggestor-msg " + msg.from}>
                <div className="suggestor-bubble">{msg.text}</div>
                {msg.from === "bot" && msg.opts && i === chatLog.length - 1 && !isTyping && (
                  <div className="suggestor-options">
                    {msg.opts.map((opt, j) => (
                      <button key={j} className="suggestor-opt-btn" onClick={() => handleOption(opt)}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="suggestor-msg bot">
                <div className="suggestor-typing"><span></span><span></span><span></span></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form className="suggestor-input-row" onSubmit={submitFree}>
            <input value={freeInput} onChange={e => setFreeInput(e.target.value)} placeholder="Type anything..." className="suggestor-free-input" />
            <button type="submit" className="suggestor-send-btn">&#10148;</button>
          </form>
        </div>
      )}
    </>
  );
};

/* ===== HELP CENTER ===== */
const HelpCenter = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await fetch("http://localhost:5000/help-center", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setSent(true);
    } catch { alert("Failed to send. Please try again."); }
    setLoading(false);
  };
  return (
    <div className="help-center-page container">
      <h2 className="page-title">Help Center</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>Have a question or issue? Send us a message and we will get back to you.</p>
      {sent ? (
        <div className="help-success">
          <div style={{ fontSize: 48 }}>OK</div>
          <h3>Message Sent!</h3>
          <p>We will respond to your email shortly.</p>
          <button className="btn-primary" onClick={() => setSent(false)}>Send Another</button>
        </div>
      ) : (
        <form className="help-form" onSubmit={handleSubmit}>
          <div className="form-group"><label>Your Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" /></div>
          <div className="form-group"><label>Your Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></div>
          <div className="form-group"><label>Message</label><textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue or question..." /></div>
          <button className="btn-primary full-width" type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message"}</button>
        </form>
      )}
    </div>
  );
};

/* ===== LIVE SEARCH BAR ===== */
const SearchBar = ({ onSearch }) => {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch("http://localhost:5000/search-live?q=" + encodeURIComponent(query));
      const data = await res.json();
      if (data.success) setSuggestions(data.results);
    } catch { setSuggestions([]); }
  }, []);
  const handleChange = (e) => {
    const val = e.target.value; setQ(val); setShowSug(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };
  const handleSelect = (land) => { setQ(land.title); setShowSug(false); setSuggestions([]); navigate("/land/" + land._id); };
  const handleSearch = () => { setShowSug(false); onSearch(q); };
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="search-wrapper" ref={wrapRef}>
      <div className="search-container-classic">
        <input className="search-input-classic" placeholder="Search city, area, property type..." value={q} onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && handleSearch()} onFocus={() => q.length >= 2 && setShowSug(true)} autoComplete="off" />
        <button className="search-btn-classic" onClick={handleSearch}>&#128269;</button>
      </div>
      {showSug && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((s) => (
            <div key={s._id} className="search-sug-item" onMouseDown={() => handleSelect(s)}>
              <img src={s.image ? "http://localhost:5000/uploads/" + s.image : "https://via.placeholder.com/40"} className="sug-thumb" alt="" />
              <div className="sug-info">
                <span className="sug-title">{s.title}</span>
                <span className="sug-loc">{[s.city, s.district].filter(Boolean).join(", ") || s.location} - {s.category}</span>
              </div>
              <span className="sug-price">Rs. {parseInt(s.price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== LAND CARD ===== */
const LandCard = ({ land, user, toggleSave, showActions = false, onDelete }) => {
  const isSaved = user?.savedLands?.includes(land._id);
  const navigate = useNavigate();
  return (
    <div className="land-card">
      <div className="land-image" onClick={() => navigate("/land/" + land._id)}>
        <img src={land.image ? "http://localhost:5000/uploads/" + land.image : "https://via.placeholder.com/400"} alt="land" />
        <div className="card-badge">{land.category || "Plot"}</div>
      </div>
      <div className="land-info">
        <h3>{land.title}</h3>
        <p className="loc-text">{[land.city, land.district, land.province].filter(Boolean).join(", ") || land.location}</p>
        <div className="price-tag">Rs. {parseInt(land.price).toLocaleString()}/mo</div>
        {user?._id === land.ownerId && (<p style={{ fontSize: "0.8rem", color: land.status === "approved" ? "green" : "orange" }}>Status: {land.status?.toUpperCase()}</p>)}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}>
          <button className="btn-outline" onClick={() => navigate("/land/" + land._id)}>Details</button>
          {toggleSave && !showActions && (<button className="save-btn" onClick={(e) => { e.stopPropagation(); toggleSave(land._id); }}>{isSaved ? "&#10084;" : "&#9825;"}</button>)}
          {showActions && user?._id === land.ownerId && (<button className="btn-outline" onClick={() => navigate("/edit-land/" + land._id)}>&#9998; Edit</button>)}
          {showActions && (<button className="btn-danger" onClick={() => onDelete(land._id)}>Delete</button>)}
        </div>
      </div>
    </div>
  );
};

/* ===== FILTER BAR ===== */
const FilterBar = ({ onFilter, refreshList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 200000, location: "", category: "" });
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters); onFilter(newFilters);
  };
  return (
    <div className="filter-wrapper">
      <button className="btn-outline filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>&#9881; Filters {isOpen ? "&#9652;" : "&#9662;"}</button>
      {isOpen && (
        <div className="filter-dropdown-content">
          <div className="filter-group"><label>Location</label><input name="location" placeholder="e.g. Kathmandu" value={filters.location} onChange={handleChange} /></div>
          <div className="filter-group"><label>Type</label>
            <select name="category" value={filters.category} onChange={handleChange}>
              <option value="">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Agricultural">Agricultural</option>
            </select>
          </div>
          <div className="filter-group price-slider-group"><label>Min Rent/mo</label>
            <div className="price-input-row">
              <input type="number" name="minPrice" min="0" value={filters.minPrice} onChange={handleChange} className="num-input" />
              <input type="range" name="minPrice" min="0" max="200000" step="1000" value={filters.minPrice} onChange={handleChange} className="slider" />
            </div>
          </div>
          <div className="filter-group price-slider-group"><label>Max Rent/mo</label>
            <div className="price-input-row">
              <input type="number" name="maxPrice" min="0" value={filters.maxPrice} onChange={handleChange} className="num-input" />
              <input type="range" name="maxPrice" min="0" max="200000" step="1000" value={filters.maxPrice} onChange={handleChange} className="slider" />
            </div>
          </div>
          <button className="btn-refresh" onClick={refreshList}>&#128260; Refresh</button>
        </div>
      )}
    </div>
  );
};

/* ===== NEPAL LOCATIONS ===== */
const NEPAL_LOCATIONS = {
  "Bagmati": ["Kathmandu", "Lalitpur", "Bhaktapur", "Makwanpur", "Sindhuli", "Ramechhap", "Dolakha", "Rasuwa", "Nuwakot", "Kavrepalanchok", "Sindhupalchok", "Chitwan"],
  "Gandaki": ["Kaski", "Syangja", "Parbat", "Baglung", "Myagdi", "Mustang", "Manang", "Lamjung", "Tanahu", "Gorkha", "Nawalpur"],
  "Lumbini": ["Rupandehi", "Kapilvastu", "Nawalparasi West", "Palpa", "Arghakhanchi", "Gulmi", "Pyuthan", "Rolpa", "Rukum East", "Dang", "Banke", "Bardiya"],
  "Koshi": ["Morang", "Sunsari", "Jhapa", "Ilam", "Taplejung", "Sankhuwasabha", "Solukhumbu", "Okhaldhunga", "Khotang", "Bhojpur", "Dhankuta", "Terhathum", "Panchthar", "Udayapur"],
  "Madhesh": ["Sarlahi", "Mahottari", "Dhanusha", "Siraha", "Saptari", "Parsa", "Bara", "Rautahat"],
  "Sudurpashchim": ["Kanchanpur", "Kailali", "Dadeldhura", "Doti", "Achham", "Bajhang", "Bajura", "Baitadi", "Darchula"],
  "Karnali": ["Surkhet", "Dailekh", "Jajarkot", "Dolpa", "Humla", "Jumla", "Kalikot", "Mugu", "Rukum West", "Salyan"],
};

/* ===== LAND FORM ===== */
const LandForm = ({ initialData = {}, onSubmit, submitLabel = "Submit Listing" }) => {
  const [province, setProvince] = useState(initialData.province || "");
  const [district, setDistrict] = useState(initialData.district || "");
  const districts = province ? NEPAL_LOCATIONS[province] || [] : [];
  return (
    <form onSubmit={onSubmit} encType="multipart/form-data">
      <div className="form-grid">
        <input name="title" placeholder="Property Title" required defaultValue={initialData.title || ""} />
        <input name="price" type="number" placeholder="Monthly Rent (Rs.)" required defaultValue={initialData.price || ""} />
        <input name="areaSize" placeholder="Area Size (e.g. 5 aana)" required defaultValue={initialData.areaSize || ""} />
        <select name="category" required defaultValue={initialData.category || "Residential"}>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Agricultural">Agricultural</option>
        </select>
        <select name="province" required value={province} onChange={e => { setProvince(e.target.value); setDistrict(""); }}>
          <option value="">Select Province</option>
          {Object.keys(NEPAL_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="district" required value={district} onChange={e => setDistrict(e.target.value)} disabled={!province}>
          <option value="">Select District</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input name="city" placeholder="City / VDC / Tole" required defaultValue={initialData.city || ""} />
        <input name="location" placeholder="Specific Location / Landmark" required defaultValue={initialData.location || ""} />
        <input name="ownerName" placeholder="Owner Name" required defaultValue={initialData.ownerName || ""} />
        <input name="ownerPhone" placeholder="Contact Phone (10 digits)" required pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" defaultValue={initialData.ownerPhone || ""} />
        <input name="ownerEmail" type="email" placeholder="Owner Email" required defaultValue={initialData.ownerEmail || ""} />
        <div className="form-full">
          <label style={{ fontSize: "0.8rem", color: "#666" }}>Map Location (Google Maps link, city name, or Lat/Lng)</label>
          <input name="mapUrl" placeholder="e.g. Kathmandu, Nepal OR 27.7172, 85.3240" defaultValue={initialData.mapUrl || ""} />
        </div>
      </div>
      <textarea name="description" placeholder="Detailed Description..." rows="4" style={{ width: "100%", marginTop: "10px" }} defaultValue={initialData.description || ""}></textarea>
      <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block" }}>Property Image {initialData.image ? "(leave blank to keep current)" : "(Public)"}</label>
          <input type="file" name="image" accept="image/*" {...(!initialData.image ? { required: true } : {})} />
        </div>
        {!initialData._id && (
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", color: "red", fontWeight: "bold" }}>Lalpurja Document (Admin Only)</label>
            <input type="file" name="lalpurja" required />
          </div>
        )}
      </div>
      <button className="btn-primary full-width" style={{ marginTop: "20px" }} type="submit">{submitLabel}</button>
    </form>
  );
};

/* ===== LAND DETAILS PAGE ===== */
const LandDetailsPage = ({ user, toggleSave, onChatWith }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [owner, setOwner] = useState(null);
  const [rentDuration, setRentDuration] = useState("");
  const [rentMonths, setRentMonths] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/land/" + id).then(res => res.json()).then(async data => {
      setLand(data.land);
      if (data.land?.ownerId) {
        const ur = await fetch("http://localhost:5000/user/" + data.land.ownerId);
        const ud = await ur.json();
        if (ud.success) setOwner(ud.user);
      }
    });
  }, [id]);

  const handleBookingRequest = async () => {
    if (!rentDuration) { alert("Please specify the rental duration."); return; }
    setShowPayment(false);
    const body = { landId: land._id, buyerId: user._id, sellerId: land.ownerId, paymentAmount: 5000, rentDuration, rentDurationMonths: rentMonths };
    const res = await fetch("http://localhost:5000/book-land", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if ((await res.json()).success) alert("Booking Request Sent! The owner will be notified via email.");
  };

  const handleRequestClick = () => {
    if (!user) return navigate("/login");
    if (user._id === land.ownerId) return alert("You are the owner of this property.");
    if (!rentDuration) { alert("Please enter the rental duration before requesting."); return; }
    setShowPayment(true);
  };

  if (!land) return <div className="loading">Loading details...</div>;

  return (
    <div className="details-page container">
      {showPayment && (<DummyEsewaPayment amount={5000} description={"Booking Request for: " + land.title} onSuccess={handleBookingRequest} onCancel={() => setShowPayment(false)} />)}
      <button className="back-btn" onClick={() => navigate(-1)}>&#8592; Back</button>
      <div className="details-grid">
        <div className="details-left">
          <div className="image-container-fixed">
            <img className="main-img" src={land.image ? "http://localhost:5000/uploads/" + land.image : "https://via.placeholder.com/600"} alt={land.title} />
          </div>
          <div className="details-desc"><h2>About Property</h2><p>{land.description || "No description provided."}</p></div>
          {land.mapUrl && (
            <div className="details-map-section">
              <h3>Property Location</h3>
              <iframe width="100%" height="400" style={{ border: 0, borderRadius: "8px" }} loading="lazy" allowFullScreen src={"https://maps.google.com/maps?q=" + encodeURIComponent(land.mapUrl) + "&output=embed"}></iframe>
            </div>
          )}
        </div>
        <div className="details-right">
          <div className="info-box sticky-box">
            <h1>{land.title}</h1>
            <h2 className="price-lg">Rs. {parseInt(land.price).toLocaleString()}<span style={{ fontSize: "1rem", fontWeight: 400, color: "#888" }}>/month</span></h2>
            <p className="category-tag">{land.category}</p>
            <hr />
            <div className="meta-grid">
              <div className="meta-item"><span>&#128205; Province</span><strong>{land.province || "N/A"}</strong></div>
              <div className="meta-item"><span>&#128506; District</span><strong>{land.district || "N/A"}</strong></div>
              <div className="meta-item"><span>&#127961; City</span><strong>{land.city || "N/A"}</strong></div>
              <div className="meta-item"><span>&#128204; Location</span><strong>{land.location}</strong></div>
              <div className="meta-item"><span>&#128208; Area</span><strong>{land.areaSize || "N/A"}</strong></div>
            </div>
            <hr />
            <h3>Owner Contact</h3>
            <div className="owner-box">
              <p><strong>{land.ownerName}</strong></p>
              <p>{land.ownerPhone}</p>
              {land.ownerEmail && <p>{land.ownerEmail}</p>}
            </div>
            <hr />
            <div className="rent-duration-box">
              <label className="rent-dur-label">Rental Duration</label>
              <div className="rent-dur-row">
                <input type="number" min="1" max="120" value={rentMonths} onChange={e => { setRentMonths(parseInt(e.target.value) || 1); setRentDuration(e.target.value + " months"); }} className="rent-dur-input" placeholder="e.g. 6" />
                <select className="rent-dur-select" onChange={e => { const unit = e.target.value; setRentDuration(rentMonths + " " + unit); }}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {rentDuration && <p className="rent-dur-preview">Duration: {rentDuration}</p>}
            </div>
            <div className="action-row-vertical">
              <button className="btn-primary full-width" onClick={handleRequestClick}>&#128203; Request to Rent</button>
              {user && user._id !== land.ownerId && owner && (
                <button className="btn-secondary full-width" onClick={() => onChatWith(owner)}>&#128172; Chat with Owner</button>
              )}
              <button className="btn-secondary full-width" onClick={() => toggleSave(land._id)}>
                {user?.savedLands?.includes(land._id) ? "&#10084; Remove from Wishlist" : "&#9825; Add to Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== EDIT LAND PAGE ===== */
const EditLandPage = ({ user }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { fetch("http://localhost:5000/land/" + id).then(r => r.json()).then(d => setLand(d.land)); }, [id]);
  if (!user) return <Navigate to="/login" />;
  if (!land) return <div className="loading">Loading...</div>;
  if (land.ownerId !== user._id) return <Navigate to="/" />;
  const handleEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    const res = await fetch("http://localhost:5000/edit-land/" + id, { method: "PUT", body: fd });
    const data = await res.json();
    if (data.success) { alert("Land updated successfully!"); navigate("/dashboard/listed"); }
    else alert(data.message || "Update failed");
  };
  return (<div className="auth-container wide"><h2>Edit Property</h2><LandForm initialData={land} onSubmit={handleEdit} submitLabel="Save Changes" /></div>);
};

/* ===== BECOME SELLER SECTION (inside Profile) ===== */
const BecomeSellerSection = ({ user, setUser }) => {
  const [docType, setDocType] = useState("citizenship");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert("Please upload your document."); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("userId", user._id);
    fd.append("sellerDocType", docType);
    fd.append("sellerDoc", file);
    const res = await fetch("http://localhost:5000/become-seller", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("properEstateUser", JSON.stringify(data.user));
      setDone(true);
    } else alert(data.message || "Failed");
    setLoading(false);
  };

  if (user.accountType === "seller") return (
    <div className="seller-status-box approved">
      <div className="seller-status-icon">&#10003;</div>
      <h3>Verified Seller Account</h3>
      <p>You can list properties for rent on ProperEstate.</p>
    </div>
  );

  if (user.accountType === "seller_pending" || done) return (
    <div className="seller-status-box pending">
      <div className="seller-status-icon">&#8987;</div>
      <h3>Verification Pending</h3>
      <p>Your documents are under review. Admin will verify within 24-48 hours.</p>
    </div>
  );

  return (
    <div className="become-seller-box">
      <h3>Become a Seller</h3>
      <p>Upload a valid ID document to list properties for rent.</p>
      <form onSubmit={handleSubmit} className="seller-form">
        <div className="profile-field">
          <label>Document Type</label>
          <select value={docType} onChange={e => setDocType(e.target.value)} className="seller-select">
            <option value="citizenship">Citizenship Certificate</option>
            <option value="nid">National ID (NID)</option>
            <option value="passport">Passport</option>
          </select>
        </div>
        <div className="profile-field">
          <label>Upload Document (Photo / Scan)</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} required />
        </div>
        <button className="btn-primary full-width" type="submit" disabled={loading}>{loading ? "Uploading..." : "Submit for Verification"}</button>
      </form>
    </div>
  );
};

/* ===== ADMIN DASHBOARD ===== */
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [lands, setLands] = useState([]);
  const [view, setView] = useState("pending");
  const fetchAdminData = () => {
    fetch("http://localhost:5000/admin/users").then(res => res.json()).then(d => setUsers(d.users));
    fetch("http://localhost:5000/admin/all-lands").then(res => res.json()).then(d => setLands(d.lands));
  };
  useEffect(() => { fetchAdminData(); }, []);
  const handleVerify = async (id, status) => {
    if (!window.confirm("Mark this land as " + status + "?")) return;
    await fetch("http://localhost:5000/admin/verify-land/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const deleteLand = async (id) => {
    if (!window.confirm("Delete this land?")) return;
    await fetch("http://localhost:5000/admin/delete-land/" + id, { method: "DELETE" });
    fetchAdminData();
  };
  const deleteUser = async (id) => {
    if (!window.confirm("Delete User AND their lands?")) return;
    await fetch("http://localhost:5000/admin/delete-user/" + id, { method: "DELETE" });
    fetchAdminData();
  };
  const verifySeller = async (id, status) => {
    await fetch("http://localhost:5000/admin/verify-seller/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAdminData();
  };
  const setAccountType = async (id, accountType) => {
    await fetch("http://localhost:5000/admin/set-account-type/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountType }) });
    fetchAdminData();
  };
  const pendingSellers = users.filter(u => u.accountType === "seller_pending");
  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <div onClick={() => setView("pending")} className={view === "pending" ? "active" : ""}>Pending Lands</div>
        <div onClick={() => setView("sellers")} className={view === "sellers" ? "active" : ""}>
          Seller Requests {pendingSellers.length > 0 && <span className="admin-badge">{pendingSellers.length}</span>}
        </div>
        <div onClick={() => setView("lands")} className={view === "lands" ? "active" : ""}>All Lands</div>
        <div onClick={() => setView("users")} className={view === "users" ? "active" : ""}>Manage Users</div>
      </div>
      <div className="admin-content">
        <h1>{view === "lands" ? "All Listed Properties" : view === "users" ? "Registered Users" : view === "sellers" ? "Seller Verification Requests" : "Pending Land Verifications"}</h1>
        {view === "pending" && (
          <div className="users-list">
            {lands.filter(l => l.status === "pending").map(l => (
              <div key={l._id} className="user-row" style={{ flexDirection: "column", gap: "10px" }}>
                <div className="user-info">
                  <strong>{l.title}</strong> - {[l.city, l.district, l.province].filter(Boolean).join(", ") || l.location} (Owner: {l.ownerName})
                  {l.ownerEmail && <span style={{ color: "#666", fontSize: "0.85rem" }}> - {l.ownerEmail}</span>}
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <a href={"http://localhost:5000/uploads/" + l.lalpurjaImage} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Lalpurja</a>
                  <button className="btn-primary" onClick={() => handleVerify(l._id, "approved")}>Approve</button>
                  <button className="btn-danger-sm" onClick={() => handleVerify(l._id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
            {lands.filter(l => l.status === "pending").length === 0 && <p>No pending lands.</p>}
          </div>
        )}
        {view === "sellers" && (
          <div className="users-list">
            {pendingSellers.length === 0 && <p>No pending seller requests.</p>}
            {pendingSellers.map(u => (
              <div key={u._id} className="user-row" style={{ flexDirection: "column", gap: "10px" }}>
                <div className="user-info">
                  <strong>{u.name}</strong> - {u.email}
                  <span style={{ marginLeft: 8, color: "#888", fontSize: "0.85rem" }}>Doc: {u.sellerDocType}</span>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {u.sellerDoc && <a href={"http://localhost:5000/uploads/" + u.sellerDoc} target="_blank" rel="noreferrer" style={{ color: "blue" }}>View Document</a>}
                  <button className="btn-primary" onClick={() => verifySeller(u._id, "approved")}>Approve Seller</button>
                  <button className="btn-danger-sm" onClick={() => verifySeller(u._id, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === "lands" && (
          <div className="lands-grid">
            {lands.map(l => (<div key={l._id}><LandCard land={l} showActions={true} onDelete={deleteLand} /><p style={{ textAlign: "center", marginTop: "5px", fontWeight: "bold" }}>Status: {l.status}</p></div>))}
          </div>
        )}
        {view === "users" && (
          <div className="users-list">
            {users.map(u => (
              <div key={u._id} className="user-row">
                <div className="user-info">
                  <strong>{u.name}</strong>
                  <span>{u.email}</span>
                  <span style={{ fontSize: "0.8rem", color: u.accountType === "seller" ? "green" : u.accountType === "seller_pending" ? "orange" : "#888" }}>
                    {u.accountType || "buyer"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {u.accountType !== "seller" && <button className="btn-primary" style={{ fontSize: "0.8rem", padding: "6px 10px" }} onClick={() => setAccountType(u._id, "seller")}>Make Seller</button>}
                  {u.accountType === "seller" && <button className="btn-outline" style={{ fontSize: "0.8rem", padding: "6px 10px" }} onClick={() => setAccountType(u._id, "buyer")}>Revoke Seller</button>}
                  <button className="btn-danger-sm" onClick={() => deleteUser(u._id)}>Ban</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== PROFILE PAGE ===== */
const ProfilePage = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [file, setFile] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved] = useState(false);
  const validatePhone = (val) => { if (val && !/^[0-9]{10}$/.test(val)) setPhoneError("Phone must be exactly 10 digits"); else setPhoneError(""); };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setPhoneError("Phone must be exactly 10 digits"); return; }
    const data = new FormData();
    data.append("userId", user._id); data.append("name", formData.name); data.append("phone", formData.phone);
    if (file) data.append("avatar", file);
    const res = await fetch("http://localhost:5000/update-profile", { method: "POST", body: data });
    const result = await res.json();
    if (result.success) { setUser(result.user); localStorage.setItem("properEstateUser", JSON.stringify(result.user)); setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };
  if (!user) return <Navigate to="/login" />;
  const avatarSrc = file ? URL.createObjectURL(file) : (user.avatar ? "http://localhost:5000/uploads/" + user.avatar : null);
  return (
    <div className="profile-page-wrapper">
      <div className="profile-cover"><div className="profile-cover-gradient"></div></div>
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="profile-avatar-img" /> : <div className="profile-avatar-placeholder">{user.name?.[0]?.toUpperCase() || "U"}</div>}
          </div>
          <input type="file" id="avatarInput" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          <label htmlFor="avatarInput" className="profile-camera-btn" title="Change photo">&#128247;</label>
        </div>
        <div className="profile-user-meta">
          <h2 className="profile-display-name">{user.name}</h2>
          <p className="profile-display-email">{user.email}</p>
          <span className="profile-role-badge">{user.role === "admin" ? "Admin" : user.accountType === "seller" ? "Verified Seller" : user.accountType === "seller_pending" ? "Seller Pending" : "Buyer"}</span>
        </div>
        <form className="profile-form-new" onSubmit={handleUpdate}>
          <div className="profile-field">
            <label>Full Name</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#128100;</span>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" required />
            </div>
          </div>
          <div className="profile-field">
            <label>Phone Number</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#128222;</span>
              <input value={formData.phone} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setFormData({ ...formData, phone: v }); validatePhone(v); }} placeholder="10-digit phone number" maxLength={10} inputMode="numeric" />
            </div>
            {phoneError && <p className="profile-field-error">{phoneError}</p>}
            {formData.phone && !phoneError && formData.phone.length === 10 && (<p className="profile-field-ok">Valid phone number</p>)}
          </div>
          <div className="profile-field readonly">
            <label>Email Address</label>
            <div className="profile-input-wrap">
              <span className="profile-input-icon">&#9993;</span>
              <input value={user.email} disabled />
            </div>
            <p className="profile-field-hint">Email cannot be changed</p>
          </div>
          <button className={"profile-save-btn " + (saved ? "saved" : "")} type="submit">{saved ? "Saved!" : "Save Changes"}</button>
        </form>
        <div style={{ padding: "0 28px 28px" }}>
          <BecomeSellerSection user={user} setUser={setUser} />
        </div>
      </div>
    </div>
  );
};

/* ===== MAIN APP ===== */
function App() {
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [user, setUser] = useState(getUserFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState({ uploaded: [], saved: [], bookings: [] });
  const [showDashMenu, setShowDashMenu] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [cachedAddFormData, setCachedAddFormData] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchLands = async () => {
    try {
      const res = await fetch("http://localhost:5000/lands");
      const data = await res.json();
      setLands(data.lands); setFilteredLands(data.lands);
    } catch (err) { console.error("Failed to fetch lands", err); }
  };

  const fetchDashboardData = async () => {
    if (user?._id) {
      fetch("http://localhost:5000/user-dashboard/" + user._id).then(r => r.json()).then(d => {
        setDashData(prev => ({ ...prev, uploaded: d.uploaded, saved: d.saved }));
      });
      fetch("http://localhost:5000/seller/bookings/" + user._id).then(r => r.json()).then(d => {
        setDashData(prev => ({ ...prev, bookings: d.bookings }));
        const pending = (d.bookings || []).filter(b => b.status === "pending").length;
        setBookingCount(pending);
      });
    }
  };

  useEffect(() => { fetchLands(); }, []);
  useEffect(() => { fetchDashboardData(); }, [user, location.pathname]);

  const toggleSave = async (landId) => {
    if (!user) return navigate("/login");
    const res = await fetch("http://localhost:5000/toggle-save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user._id, landId }) });
    const data = await res.json();
    const updatedUser = { ...user, savedLands: data.savedLands };
    setUser(updatedUser); localStorage.setItem("properEstateUser", JSON.stringify(updatedUser));
  };

  const handleAuth = async (e, type) => {
    e.preventDefault();
    const body = type === "login"
      ? { email: e.target.email.value, password: e.target.password.value }
      : { name: e.target.name.value, email: e.target.email.value, password: e.target.password.value };
    const res = await fetch("http://localhost:5000/" + type, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      setUser(data.user); localStorage.setItem("properEstateUser", JSON.stringify(data.user));
      if (data.user.role === "admin") navigate("/admin"); else navigate("/");
    } else alert(data.message || "Error");
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem("properEstateUser"); navigate("/login"); setSidebarOpen(false); };

  const applyFilters = (filters) => {
    let temp = [...lands];
    if (filters.location) temp = temp.filter(l => (l.location || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.city || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.district || "").toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.minPrice) temp = temp.filter(l => l.price >= parseInt(filters.minPrice));
    if (filters.maxPrice) temp = temp.filter(l => l.price <= parseInt(filters.maxPrice));
    if (filters.category) temp = temp.filter(l => l.category === filters.category);
    setFilteredLands(temp);
  };

  const handleGlobalSearch = (query) => {
    const lowerQ = query.toLowerCase();
    const results = lands.filter(l => (l.title || "").toLowerCase().includes(lowerQ) || (l.location || "").toLowerCase().includes(lowerQ) || (l.city || "").toLowerCase().includes(lowerQ) || (l.district || "").toLowerCase().includes(lowerQ) || (l.province || "").toLowerCase().includes(lowerQ));
    setFilteredLands(results); navigate("/");
  };

  const respondToBooking = async (id, status) => {
    await fetch("http://localhost:5000/seller/respond-booking/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchDashboardData();
  };

  const initiateAddLand = (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (user.accountType && user.accountType !== "seller" && user.role !== "admin") {
      alert("You need a verified Seller account to list properties.\n\nGo to Profile > Become a Seller to apply.");
      return;
    }
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    setCachedAddFormData(fd); setShowAddPayment(true);
  };

  const completeAddLand = async () => {
    setShowAddPayment(false);
    const res = await fetch("http://localhost:5000/add-land", { method: "POST", body: cachedAddFormData });
    if ((await res.json()).success) { alert("Property Listed! Waiting for Admin Verification."); await fetchLands(); navigate("/"); }
  };

  return (
    <div className="app-root">
      {showAddPayment && (<DummyEsewaPayment amount={1000} description={"ProperEstate Platform Commission (Listing Fee)"} onSuccess={completeAddLand} onCancel={() => setShowAddPayment(false)} />)}
      <SmartSuggestor />
      {user && <ChatApp user={user} initialOther={chatTarget} />}

      <div className={"sidebar-overlay " + (sidebarOpen ? "open" : "")} onClick={() => setSidebarOpen(false)}></div>
      <div className={"sidebar " + (sidebarOpen ? "open" : "")}>
        <h2 className="sidebar-logo">ProperEstate</h2>
        <div className="sidebar-link" onClick={() => { navigate("/"); setSidebarOpen(false); }}>&#127968; Home Explore</div>
        {user?.role === "admin" && <div className="sidebar-link admin-link" onClick={() => { navigate("/admin"); setSidebarOpen(false); }}>&#128737; Admin Panel</div>}
        <div className="sidebar-link" onClick={() => { navigate("/profile"); setSidebarOpen(false); }}>&#128100; My Profile</div>
        <div className="sidebar-link" onClick={() => { navigate("/add-land"); setSidebarOpen(false); }}>&#43; List Property</div>
        <div className="sidebar-link" onClick={() => { navigate("/help"); setSidebarOpen(false); }}>&#10067; Help Center</div>
        {user && <div className="sidebar-link logout" onClick={handleLogout}>Logout</div>}
      </div>

      <header className="header">
        <div className="nav-bar">
          <div className="nav-left">
            <div onClick={() => setSidebarOpen(true)} className="menu-icon">&#9776;</div>
            <div className="logo" onClick={() => navigate("/")}>ProperEstate</div>
          </div>
          <SearchBar onSearch={handleGlobalSearch} />
          <div className="nav-right">
            {user && (
              <>
                <button className="nav-chat-btn" onClick={() => { /* open chat */ document.querySelector('.chat-fab')?.click(); }} title="Messages">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </button>
                <button className="nav-requests-btn" onClick={() => navigate("/dashboard/requests")} title="Rental Requests">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {bookingCount > 0 && <span className="nav-requests-badge">{bookingCount}</span>}
                </button>
              </>
            )}
            {!user ? (
              <button className="btn-primary" onClick={() => navigate("/login")}>Login</button>
            ) : (
              <div className="user-menu" onMouseEnter={() => setShowDashMenu(true)} onMouseLeave={() => setShowDashMenu(false)}>
                <div className="nav-item">Dashboard</div>
                {showDashMenu && (
                  <div className="dropdown-menu">
                    <div onClick={() => navigate("/dashboard/listed")}>My Listed Assets</div>
                    <div onClick={() => navigate("/dashboard/saved")}>My Saved Wishlist</div>
                  </div>
                )}
                <img onClick={() => navigate("/profile")} src={user.avatar ? "http://localhost:5000/uploads/" + user.avatar : "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name) + "&background=1a3c34&color=fff"} className="nav-avatar" alt="avatar" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={
            <>
              <div className="hero">
                <h1>Brokers make you Broke</h1>
                <p className="hero-sub">Choose ProperEstate — Broker-free, directly from owner to renter.</p>
              </div>
              <div className="container">
                <FilterBar onFilter={applyFilters} refreshList={fetchLands} />
                <div className="lands-grid">
                  {filteredLands.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} />)}
                  {filteredLands.length === 0 && <p className="no-res">No properties match your filters.</p>}
                </div>
              </div>
            </>
          } />
          <Route path="/land/:id" element={<LandDetailsPage user={user} toggleSave={toggleSave} onChatWith={(owner) => { setChatTarget(owner); }} />} />
          <Route path="/edit-land/:id" element={<EditLandPage user={user} />} />
          <Route path="/login" element={
            <div className="auth-container"><h2>Login</h2>
              <form onSubmit={(e) => handleAuth(e, "login")}>
                <input name="email" placeholder="Email" /><input name="password" type="password" placeholder="Password" />
                <button className="btn-primary full-width">Sign In</button>
              </form>
              <p onClick={() => navigate("/signup")} className="auth-link">Create an account</p>
            </div>
          } />
          <Route path="/signup" element={
            <div className="auth-container"><h2>Sign Up</h2>
              <form onSubmit={(e) => handleAuth(e, "signup")}>
                <input name="name" placeholder="Name" /><input name="email" placeholder="Email" /><input name="password" type="password" placeholder="Password" />
                <button className="btn-primary full-width">Register</button>
              </form>
              <p onClick={() => navigate("/login")} className="auth-link">Have an account?</p>
            </div>
          } />
          <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/dashboard/listed" element={
            <div className="container"><h2 className="page-title">My Listed Assets</h2>
              <div className="lands-grid">
                {dashData.uploaded?.length > 0
                  ? dashData.uploaded.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} showActions={true} onDelete={async (id) => { if (window.confirm("Delete?")) { await fetch("http://localhost:5000/admin/delete-land/" + id, { method: "DELETE" }); fetchDashboardData(); } }} />)
                  : <p>No uploads yet.</p>}
              </div>
            </div>
          } />
          <Route path="/dashboard/saved" element={
            <div className="container"><h2 className="page-title">My Saved Wishlist</h2>
              <div className="lands-grid">
                {dashData.saved?.length > 0 ? dashData.saved.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} />) : <p>No saved lands.</p>}
              </div>
            </div>
          } />
          <Route path="/dashboard/requests" element={
            <div className="container"><h2 className="page-title">Rental Requests</h2>
              <div className="users-list">
                {dashData.bookings?.length > 0 ? dashData.bookings.map(b => (
                  <div key={b._id} className="user-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <p><strong>Property:</strong> {b.landId?.title}</p>
                    <p><strong>Renter:</strong> {b.buyerId?.name} | <strong>Email:</strong> {b.buyerId?.email}</p>
                    {b.rentDuration && <p><strong>Duration:</strong> {b.rentDuration}</p>}
                    <p><strong>Status:</strong> <span style={{ fontWeight: "bold", color: b.status === "pending" ? "orange" : b.status === "accepted" ? "green" : "red" }}>{b.status?.toUpperCase()}</span></p>
                    {b.status === "pending" && (
                      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                        <button className="btn-primary" onClick={() => respondToBooking(b._id, "accepted")}>Accept</button>
                        <button className="btn-danger-sm" onClick={() => respondToBooking(b._id, "rejected")}>Reject (Refund)</button>
                      </div>
                    )}
                  </div>
                )) : <p>No rental requests yet.</p>}
              </div>
            </div>
          } />
          <Route path="/admin" element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/add-land" element={
            !user ? <Navigate to="/login" /> :
            <div className="auth-container wide">
              <h2>List New Property for Rent</h2>
              <LandForm onSubmit={initiateAddLand} submitLabel="Submit Listing and Pay Rs.1000 Commission" />
            </div>
          } />
        </Routes>
      </main>

      <footer className="footer">
        <h2>PROPERESTATE</h2>
        <p>2026 Premium Rental Platform - Nepal - Broker Free</p>
      </footer>
    </div>
  );
}

export default function AppWrapper() { return <BrowserRouter><App /></BrowserRouter>; }
