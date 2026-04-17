const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('HELLO! Server is working!');
});

app.listen(5000, () => {
  console.log('✅ Simple server running on port 5000');
});