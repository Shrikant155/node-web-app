const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/profile_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mongoose Profile Schema & Model
const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, default: 'Not Provided' }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

// --- REST API ENDPOINTS ---

// 1. LOGIN / REGISTER (Name, Email, Phone)
app.post('/api/login', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required.' });
    }

    let profile = await Profile.findOne({ email });
    if (!profile) {
      profile = new Profile({ name, email, phone, address: 'Update your address' });
      await profile.save();
    }
    res.status(200).json({ message: 'Login successful', profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LIST ALL PROFILES (Read)
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE NEW PROFILE
app.post('/api/profiles', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const newProfile = new Profile({ name, email, phone, address });
    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. UPDATE PROFILE
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const updatedProfile = await Profile.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    );
    if (!updatedProfile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json(updatedProfile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE PROFILE
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    if (!deletedProfile) return res.status(404).json({ error: 'Profile not found' });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
