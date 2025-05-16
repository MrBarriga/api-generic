require('dotenv').config();
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// 🔐 Debug das variáveis de ambiente (remova depois de testar)
console.log("🔐 EMAIL_USER:", process.env.EMAIL_USER);
console.log("🔐 EMAIL_PASS:", process.env.EMAIL_PASS);

// 🧱 Validação das credenciais
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL_USER ou EMAIL_PASS não definidos no .env");
  process.exit(1); // encerra a execução imediatamente
}

// 🚀 Criação do transporter SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📧 Função principal de envio
async function sendEmail({ to, subject, templateName, context }) {
  try {
    // Caminho do template EJS
    const templatePath = path.join(__dirname, "../views", `${templateName}.ejs`);

    // Renderizar HTML com contexto
    const htmlContent = await ejs.renderFile(templatePath, context);

    // Enviar o email
    await transporter.sendMail({
      from: `"Sr. Barriga API" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📨 Email enviado com sucesso para ${to}`);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw error; // relança o erro para o controller tratar
  }
}

module.exports = { sendEmail };
