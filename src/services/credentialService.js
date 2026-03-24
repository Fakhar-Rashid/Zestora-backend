const crypto = require('crypto');

const prisma = require('../config/database');
const env = require('../config/env');
const AppError = require('../utils/appError');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

const getKey = () => Buffer.from(env.encryptionKey, 'hex');

const encrypt = (plainObject) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const json = JSON.stringify(plainObject);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decrypt = (encryptedString) => {
  const [ivHex, authTagHex, encrypted] = encryptedString.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

const create = async (userId, { name, type, service, data }) => {
  const encryptedData = encrypt(data);
  return prisma.credential.create({
    data: { userId, name, type, service, encryptedData },
    select: { id: true, name: true, type: true, service: true, createdAt: true },
  });
};

const list = async (userId, service) => {
  const where = { userId };
  if (service) {
    const services = Array.isArray(service) ? service : service.split(',');
    where.service = services.length === 1 ? services[0] : { in: services };
  }
  return prisma.credential.findMany({
    where,
    select: { id: true, name: true, type: true, service: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (userId, credentialId) => {
  if (!credentialId) {
    throw new AppError('No credential ID provided. Please configure a credential in the node settings.', 400);
  }
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });
  if (!credential || credential.userId !== userId) {
    throw new AppError('Credential not found', 404);
  }
  return credential;
};

const getDecrypted = async (userId, credentialId) => {
  const credential = await getById(userId, credentialId);
  return decrypt(credential.encryptedData);
};

const update = async (userId, credentialId, updates) => {
  await getById(userId, credentialId);
  const data = {};
  if (updates.name) data.name = updates.name;
  if (updates.type) data.type = updates.type;
  if (updates.service) data.service = updates.service;
  if (updates.data) data.encryptedData = encrypt(updates.data);
  return prisma.credential.update({
    where: { id: credentialId },
    data,
    select: { id: true, name: true, type: true, service: true, createdAt: true },
  });
};

const remove = async (userId, credentialId) => {
  await getById(userId, credentialId);
  return prisma.credential.delete({ where: { id: credentialId } });
};

module.exports = { encrypt, decrypt, create, list, getById, getDecrypted, update, remove };
