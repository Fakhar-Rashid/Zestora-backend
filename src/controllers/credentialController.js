const credentialService = require('../services/credentialService');
const whatsappClientManager = require('../services/whatsappClientManager');
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
    await whatsappClientManager.disconnect(req.params.id).catch(() => {});
    await credentialService.remove(req.user.id, req.params.id);
    sendSuccess(res, null, 'Credential deleted');
  } catch (err) {
    next(err);
  }
};

const whatsappConnect = async (req, res, next) => {
  try {
    await credentialService.getById(req.user.id, req.params.id);
    await whatsappClientManager.connect(req.params.id);
    sendSuccess(res, whatsappClientManager.getStatus(req.params.id), 'Connecting WhatsApp');
  } catch (err) {
    next(err);
  }
};

const whatsappStatus = async (req, res, next) => {
  try {
    await credentialService.getById(req.user.id, req.params.id);
    const status = whatsappClientManager.getStatus(req.params.id);

    if (status.status === 'ready' && status.phoneNumber) {
      try {
        await credentialService.update(req.user.id, req.params.id, {
          data: { phoneNumber: status.phoneNumber },
        });
      } catch (e) { /* non-fatal */ }
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    sendSuccess(res, status);
  } catch (err) {
    next(err);
  }
};

const whatsappDisconnect = async (req, res, next) => {
  try {
    await credentialService.getById(req.user.id, req.params.id);
    await whatsappClientManager.disconnect(req.params.id);
    sendSuccess(res, null, 'WhatsApp disconnected');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  whatsappConnect,
  whatsappStatus,
  whatsappDisconnect,
};
