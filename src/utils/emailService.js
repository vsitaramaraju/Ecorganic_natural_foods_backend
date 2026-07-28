const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    // Create reset link with the token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px;">
          <h2 style="color: #2d5016; margin: 0;">Password Reset Request</h2>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="color: #333; font-size: 16px;">Hi ${userName},</p>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to reset it:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #0066cc; font-size: 12px; text-align: center; word-break: break-all;">
            ${resetLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          
          <p style="color: #888; font-size: 12px;">
            <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact our support team.
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Best regards,<br>
            <strong>Eco Organic Natural Foods Team</strong>
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #888;">
          <p>© 2024 Eco Organic Natural Foods. All rights reserved.</p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Password Reset Request - Eco Organic Natural Foods',
      html: htmlContent,
    });

    console.log(`Password reset email sent to ${email}`, response);
    return true;
  } catch (error) {
    console.error('Error sending password reset email with Resend:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = { sendPasswordResetEmail };
