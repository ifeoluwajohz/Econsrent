require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;
const app = express();
const route = require("./routes/route");
const adminRoute = require("./routes/adminRoute");
const cors = require('cors')
// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true
}));




// Middleware
app.use(express.json());

// Error Handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ err: err.message });
});

// MongoDB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Econsrent database is now active'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// Routes
app.use('/', route);
app.use('/admin', adminRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
