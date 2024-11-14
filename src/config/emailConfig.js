const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ou use o serviço de email de sua preferência
  auth: {
    user: process.env.EMAIL_USER, // seu email
    pass: process.env.EMAIL_PASS, // senha do app gerada pelo provedor de email
  },
});

module.exports = transporter;
