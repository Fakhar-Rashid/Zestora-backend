const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = require('../config/database');
const env = require('../config/env');
const AppError = require('../utils/appError');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const signup = async ({ email, password, firstName, lastName }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  const token = generateToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const token = generateToken(user);
  const { passwordHash, ...userData } = user;
  return { user: userData, token };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = { signup, login, getMe };
