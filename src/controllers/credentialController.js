const credentialService = require('../services/credentialService');
const { sendSuccess } = require('../utils/responseHelper');

const create = async (req, res, next) => {
  try {
    const credential = await credentialService.create(req.user.id, req.body);
    sendSuccess(res, credential, 'Credential created', 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const credentials = await credentialService.list(req.user.id, req.query.service);
    sendSuccess(res, credentials);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const credential = await credentialService.getDecrypted(req.user.id, req.params.id);
    sendSuccess(res, credential);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const credential = await credentialService.update(req.user.id, req.params.id, req.body);
    sendSuccess(res, credential, 'Credential updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await credentialService.remove(req.user.id, req.params.id);
    sendSuccess(res, null, 'Credential deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getById, update, remove };
