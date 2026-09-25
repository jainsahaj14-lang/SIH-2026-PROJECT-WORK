const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cognicare_ner_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a caregiver, healthworker, or admin
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, preferredLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: role || 'caregiver',
      preferredLanguage: preferredLanguage || 'en',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        linkedPatients: user.linkedPatients,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Email + password login for caregivers & healthworkers
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // If user has linked patients, populate basic info
    const populatedUser = await User.findById(user._id).populate({
      path: 'linkedPatients',
      populate: { path: 'userId', select: 'name phone' },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        linkedPatients: populatedUser.linkedPatients,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

/**
 * @route   POST /api/auth/patient-login
 * @desc    Simplified PIN login for elderly patients (no complex passwords)
 * @access  Public
 */
router.post('/patient-login', async (req, res) => {
  try {
    const { pin, name } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: 'Please enter your 4-digit PIN' });
    }

    const query = { role: 'patient', pin: pin.trim() };
    if (name) {
      query.name = new RegExp(`^${name.trim()}$`, 'i');
    }

    let user = await User.findOne(query);

    // If query by name+PIN fails, try by PIN only if unique
    if (!user) {
      const pinMatches = await User.find({ role: 'patient', pin: pin.trim() });
      if (pinMatches.length === 1) {
        user = pinMatches[0];
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'PIN not recognized. Please check with your caregiver or try again.',
      });
    }

    const patient = await Patient.findOne({ userId: user._id });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        patientId: patient?._id,
      },
      patient: patient || null,
    });
  } catch (err) {
    console.error('Patient PIN login error:', err);
    res.status(500).json({ success: false, message: 'Server error during patient PIN login' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    let patientData = null;
    if (req.user.role === 'patient') {
      patientData = await Patient.findOne({ userId: req.user._id });
    } else {
      await req.user.populate({
        path: 'linkedPatients',
        populate: { path: 'userId', select: 'name phone' },
      });
    }

    res.json({
      success: true,
      user: req.user,
      patient: patientData,
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
});

module.exports = router;
