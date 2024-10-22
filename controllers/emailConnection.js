const nodemailer = require("nodemailer");

const sendEmail = async (email, token, resetUrl, type) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject:
      type === "resetPassword"
        ? "Password Reset Request"
        : "Email Verification",
    html: `
      <h2>${
        type === "resetPassword" ? "Password Reset" : "Verify your Email"
      }</h2>
      <p>Please click the link below to ${
        type === "resetPassword" ? "reset your password" : "verify your email"
      }:</p>
      <a href="${resetUrl}">Click here to ${
      type === "resetPassword" ? "reset your password" : "verify your email"
    }</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
