import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email, userId) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${userId}`;
  const html = `
    <h2>Email Verification</h2>
    <p>Click the link below to verify your email:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;
  await sendEmail(email, 'Verify Your Email', html);
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = `
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `;
  await sendEmail(email, 'Reset Your Password', html);
};

export const sendWelcomeEmail = async (email, username) => {
  const html = `
    <h2>Welcome to Bet360!</h2>
    <p>Hi ${username},</p>
    <p>Thank you for joining Bet360. Start placing bets and win big!</p>
  `;
  await sendEmail(email, 'Welcome to Bet360', html);
};

export const sendWithdrawalConfirmationEmail = async (email, amount, transactionId) => {
  const html = `
    <h2>Withdrawal Request Confirmed</h2>
    <p>Your withdrawal request of $${amount} has been received.</p>
    <p>Transaction ID: ${transactionId}</p>
    <p>We will process this within 2-3 business days.</p>
  `;
  await sendEmail(email, 'Withdrawal Confirmation', html);
};
