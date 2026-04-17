const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
require("dotenv").config()

const OpenAI = require("openai")
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/* ================= MEMORY ================= */

const userMemory = {}

/* ================= HELPERS ================= */

const cityAliases = {
kathmandu:["kathmandu","ktm","valley"],
pokhara:["pokhara"],
lalitpur:["lalitpur","patan"],
bhaktapur:["bhaktapur"],
chitwan:["chitwan"],
butwal:["butwal"]
}

function detectCity(msg){
msg = msg.toLowerCase()
for(const city in cityAliases){
for(const alias of cityAliases[city]){
if(msg.includes(alias)) return city
}}
return null
}

function detectBudget(msg){
msg = msg.toLowerCase()

let lakh = msg.match(/(\d+)\s*lakh/)
if(lakh) return parseInt(lakh[1]) * 100000

let crore = msg.match(/(\d+)\s*crore/)
if(crore) return parseInt(crore[1]) * 10000000

let num = msg.match(/\d{6,}/)
if(num) return parseInt(num[0])

return null
}

/* ================= INTENT DETECTION ================= */

function detectIntent(msg){
msg = msg.toLowerCase()

if(/hi|hello|hey|namaste/.test(msg)) return "greeting"
if(/compare/.test(msg)) return "compare"
if(/investment/.test(msg)) return "investment"
if(/price|cost/.test(msg)) return "price"
if(/buy|find|search|show|land|house|property/.test(msg)) return "search"

return "general"
}

/* ================= DB SEARCH ================= */

async function searchProperties(filters){

try{

const collection = mongoose.connection.collection("properties")

let query = {}

if(filters.city){
query.location = { $regex: filters.city , $options:"i" }
}

if(filters.budget){
query.price = { $lte: filters.budget }
}

const results = await collection
.find(query)
.sort({ price: 1 })
.limit(5)
.toArray()

return results

}catch{
return []
}

}

/* ================= AI BRAIN ================= */

async function askAI(message, memory, properties, intent){

try{

const prompt = `
You are an advanced real estate AI assistant.

User message: "${message}"

Detected intent: ${intent}

User memory:
City: ${memory.city || "unknown"}
Budget: ${memory.budget || "unknown"}

Properties found: ${properties.length}

Instructions:
- ALWAYS respond naturally like a human assistant
- If greeting → greet properly
- If no city → ask for city
- If no budget → ask for budget
- If properties exist → recommend them smartly
- If none → guide user (DON'T repeat same line)
- Keep it short, premium, helpful
- NEVER say "adjust your budget" repeatedly
`

const response = await openai.chat.completions.create({
model: "gpt-4.1-mini",
messages: [{ role: "user", content: prompt }],
temperature: 0.7
})

return response.choices[0].message.content

}catch(err){
console.log("AI ERROR:", err.message)
return null
}

}

/* ================= SMART FALLBACK ================= */

function smartFallback(memory, properties){

if(properties.length){

let text = "🔥 Here are some options:\n\n"

properties.forEach(p=>{
text += `🏡 ${p.title}\n📍 ${p.location}\n💰 ${p.price} NPR\n\n`
})

return text
}

if(!memory.city && !memory.budget){
return "Tell me a city and budget like 'Kathmandu under 20 lakh' and I'll find the best properties."
}

if(!memory.city){
return "Which city are you interested in? (Kathmandu, Pokhara, Lalitpur...)"
}

if(!memory.budget){
return `Got it 👍 Looking in ${memory.city}. What's your budget?`
}

return `I couldn't find matches in ${memory.city} under your budget.\n\nTry increasing budget or exploring nearby areas.`
}

/* ================= MAIN ROUTE ================= */

router.post("/", async (req,res)=>{

try{

const message = req.body.message || ""
const userId = req.ip

if(!userMemory[userId]){
userMemory[userId] = {}
}

let memory = userMemory[userId]

/* ===== EXTRACT ===== */

const city = detectCity(message)
const budget = detectBudget(message)
const intent = detectIntent(message)

if(city) memory.city = city
if(budget) memory.budget = budget

/* ===== DB SEARCH ===== */

const properties = await searchProperties(memory)

/* ===== AI ===== */

let reply = await askAI(message, memory, properties, intent)

/* ===== FALLBACK SAFETY ===== */

if(!reply || reply.length < 5){
reply = smartFallback(memory, properties)
}

/* ===== SUGGESTIONS ===== */

let suggestions = []

if(!memory.city) suggestions.push("Kathmandu properties")
if(!memory.budget) suggestions.push("Under 20 lakh")

suggestions.push("Cheap land")
suggestions.push("Best investment areas")
suggestions.push("Compare properties")

/* ===== RESPONSE ===== */

res.json({
reply,
suggestions,
properties,
memory // useful for debugging frontend
})

}catch(err){

console.log(err)

res.status(500).json({
reply:"⚠️ AI system error. Try again.",
suggestions:["Retry"]
})

}

})

module.exports = router