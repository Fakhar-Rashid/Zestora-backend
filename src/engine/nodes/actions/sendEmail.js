const nodemailer = require('nodemailer');

const BaseNode = require('../baseNode');
const { resolveTemplate } = require('./whatsappSend');

class SendEmail extends BaseNode {
  static getMeta() {
    return {
      label: 'Send Email',
      category: 'actions',
      icon: 'mail',
      color: '#ef4444',
      description: 'Send an email via SMTP',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        {
          key: 'credentialId',
          type: 'credential',
          service: 'smtp',
          label: 'SMTP Credential',
          required: true,
        },
        {
          key: 'to',
          type: 'string',
          label: 'Recipient Email',
          required: true,
        },
        {
          key: 'subject',
          type: 'string',
          label: 'Subject',
          required: true,
        },
        {
          key: 'body',
          type: 'textarea',
          label: 'Email Body',
          required: true,
        },
      ],
    };
  }

  async execute(inputData) {
    const { credentialId, to, subject, body } = this.config;

    const credential = await this.context.credentialService.getDecrypted(
      this.context.userId,
      credentialId,
    );

    const { host, port, user, pass } = credential;

    const resolvedTo = resolveTemplate(to, inputData);
    const resolvedSubject = resolveTemplate(subject, inputData);
    const resolvedBody = resolveTemplate(body, inputData);

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: user,
      to: resolvedTo,
      subject: resolvedSubject,
      text: resolvedBody,
    });

    return {
      success: true,
      messageId: info.messageId || null,
      to: resolvedTo,
    };
  }
}

module.exports = SendEmail;
