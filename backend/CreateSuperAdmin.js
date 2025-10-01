// create_superadmin.js
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const { hashPassword } = require('./bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * Validates password strength
 * @param {string} pwd - Password to validate
 * @returns {boolean} - Whether the password meets strength requirements
 */
function assertStrong(pwd = '') {
  // Quick, pragmatic check; replace with zxcvbn if you like
  const longEnough = pwd.length >= 12;
  const hasMix = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  return longEnough && hasMix && hasSymbol;
}

async function createSuperAdmin() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
    if (!process.env.SUPERADMIN_EMAIL) throw new Error('SUPERADMIN_EMAIL missing');
    if (!process.env.SUPERADMIN_PASSWORD) throw new Error('SUPERADMIN_PASSWORD missing');
    
    // Validate password strength
    if (!assertStrong(process.env.SUPERADMIN_PASSWORD)) {
      throw new Error('Password too weak. Must be at least 12 characters with uppercase, lowercase, numbers, and symbols.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const hashedPassword = await hashPassword(process.env.SUPERADMIN_PASSWORD);
    
    // Allow custom name or default
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';
    
    const superAdmin = await UserModel.create({
      name,
      email: process.env.SUPERADMIN_EMAIL,
      password: hashedPassword,
      role: 'superadmin'
    });
    
    console.log('Superadmin created successfully:', {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role
    });
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

createSuperAdmin();