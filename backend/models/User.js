const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  bloodGroup: {
    type: String,
    required: false,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  location: {
    type: String,
    required: [true, 'Please add your location'],
  },
  coordinates: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], index: '2dsphere' },
  },
  phone: {
    type: String,
    required: [true, 'Please add a contact number'],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['donor', 'hospital', 'admin'],
    default: 'donor',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String,
  avatar: {
    type: String,
    default: '',
  },
  lastDonationDate: Date,
  nextEligibleDate: {
    type: Date,
    default: Date.now,
  },
  isMedicalHistoryClear: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ role: 1, isAvailable: 1, bloodGroup: 1 });

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
