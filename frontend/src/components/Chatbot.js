import React, { useState, useEffect, useRef } from "react"

export default function Chatbot({ user }) {

const [open, setOpen] = useState(false)
const [input, setInput] = useState("")
const [typing, setTyping] = useState(false)
const [loading, setLoading] = useState(false)

const [messages, setMessages] = useState([
{
sender: "bot",
text: "Hey 👋 I'm your smart real estate assistant.\nAsk me anything about properties.",
time: new Date().toLocaleTimeString()
}
])

const [suggestions, setSuggestions] = useState([
"Cheap land",
"Kathmandu properties",
"Under 20 lakh"
])

const bottomRef = useRef()

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [messages, typing])

function formatTime() {
return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage(textOverride) {

if (loading) return

const message = textOverride || input
if (!message.trim()) return

setMessages(prev => [...prev, {
sender: "user",
text: message,
time: formatTime()
}])

setInput("")
setTyping(true)
setLoading(true)

try {

const res = await fetch("http://localhost:5000/chatbot", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
message,
user: user?.name || "Guest"
})
})

const data = await res.json()

setTimeout(() => {

setTyping(false)
setLoading(false)

setMessages(prev => [
...prev,
{
sender: "bot",
text: data.reply,
properties: data.properties || [],
time: formatTime()
}
])

if (data.suggestions) setSuggestions(data.suggestions)

}, 800)

} catch {

setTyping(false)
setLoading(false)

setMessages(prev => [
...prev,
{ sender: "bot", text: "⚠️ Server error.", time: formatTime() }
])

}

}

return (
<>

<div className="bot-button" onClick={() => setOpen(!open)}>🤖</div>

{open && (

<div className="bot-window">

<div className="bot-header">
Estate AI
</div>

<div className="bot-messages">

{messages.map((m, i) => (
<div key={i} className={`msg ${m.sender}`}>

<div>{m.text}</div>

{/* PROPERTY CARDS 🔥 */}
{m.properties && m.properties.length > 0 && (
<div className="cards">
{m.properties.map((p, idx) => (
<div key={idx} className="card">
<img src={p.image || "https://via.placeholder.com/150"} alt="" />
<div className="card-info">
<b>{p.title || "Property"}</b>
<span>📍 {p.location}</span>
<span>💰 {p.price} NPR</span>
<button>View</button>
</div>
</div>
))}
</div>
)}

<div className="time">{m.time}</div>

</div>
))}

{typing && (
<div className="msg bot typing">
<div className="dot"></div>
<div className="dot"></div>
<div className="dot"></div>
</div>
)}

<div ref={bottomRef}></div>

</div>

{/* SUGGESTIONS */}
<div className="bot-suggestions">
{suggestions.map((s, i) => (
<div key={i} className="chip" onClick={() => sendMessage(s)}>
{s}
</div>
))}
</div>

{/* INPUT */}
<div className="bot-input">

<input
value={input}
onChange={(e) => setInput(e.target.value)}
placeholder="Ask anything..."
onKeyDown={(e) => e.key === "Enter" && sendMessage()}
/>

<button onClick={() => sendMessage()}>
➤
</button>

</div>

</div>

)}

<style>{`

.bot-button{
position:fixed;
bottom:25px;
right:25px;
width:65px;
height:65px;
background:#0f2c28;
color:#fff;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-size:28px;
cursor:pointer;
box-shadow:0 10px 25px rgba(0,0,0,.5);
}

.bot-window{
position:fixed;
right:20px;
bottom:100px;
width:340px;
height:460px;
background:#0e2622;
border-radius:15px;
display:flex;
flex-direction:column;
overflow:hidden;
box-shadow:0 20px 50px rgba(0,0,0,.7);
}

.bot-header{
background:#1d4d44;
color:#fff;
padding:12px;
text-align:center;
font-weight:bold;
}

.bot-messages{
flex:1;
overflow-y:auto;
padding:12px;
display:flex;
flex-direction:column;
gap:10px;
}

.msg{
padding:10px;
border-radius:10px;
max-width:80%;
font-size:13px;
position:relative;
}

.msg.bot{
background:#1b3f38;
color:#fff;
align-self:flex-start;
}

.msg.user{
background:#e2d2b3;
color:#000;
align-self:flex-end;
}

.time{
font-size:10px;
opacity:0.6;
margin-top:4px;
}

.cards{
margin-top:8px;
display:flex;
flex-direction:column;
gap:8px;
}

.card{
background:#143732;
border-radius:10px;
overflow:hidden;
}

.card img{
width:100%;
height:120px;
object-fit:cover;
}

.card-info{
padding:8px;
display:flex;
flex-direction:column;
gap:4px;
font-size:12px;
}

.card button{
margin-top:5px;
background:#2b5f56;
border:none;
color:white;
padding:6px;
border-radius:6px;
cursor:pointer;
}

.bot-suggestions{
display:flex;
flex-wrap:wrap;
gap:6px;
padding:8px;
background:#143732;
}

.chip{
background:#204c44;
color:white;
padding:6px 10px;
border-radius:20px;
font-size:11px;
cursor:pointer;
}

.chip:hover{
background:#2b5f56;
}

.bot-input{
display:flex;
border-top:1px solid #1d4d44;
}

.bot-input input{
flex:1;
background:#0e2622;
border:none;
color:white;
padding:10px;
outline:none;
}

.bot-input button{
background:#204c44;
border:none;
color:white;
padding:10px 15px;
cursor:pointer;
}

.typing{
display:flex;
gap:5px;
}

.dot{
width:6px;
height:6px;
background:white;
border-radius:50%;
animation:blink 1.2s infinite;
}

.dot:nth-child(2){animation-delay:.2s}
.dot:nth-child(3){animation-delay:.4s}

@keyframes blink{
0%{opacity:.2}
50%{opacity:1}
100%{opacity:.2}
}

`}</style>

</>
)
}