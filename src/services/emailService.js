// src/services/emailService.js
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, templateName, context }) {
  // Caminho do template EJS
  const templatePath = path.join(__dirname, "../views", `${templateName}.ejs`);
  
  // Renderizar o conteúdo HTML do template com o EJS
  const htmlContent = await ejs.renderFile(templatePath, context);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
  });
}

module.exports = { sendEmail };
