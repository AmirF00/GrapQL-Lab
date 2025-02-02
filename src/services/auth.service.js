const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AuthenticationError } = require('apollo-server-express');

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static async signUp(input) {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AuthenticationError('User already exists');
    }

    const user = new User(input);
    await user.save();

    const token = this.generateToken(user);
    return { token, user };
  }

  static async signIn(input) {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid password');
    }

    const token = this.generateToken(user);
    return { token, user };
  }
}

module.exports = AuthService;
