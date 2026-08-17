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
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
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

const sendContactFormEmail = async (name, userEmail, subject, message) => {
  try {
    // Send email to admin
    const adminHtmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2d5016; padding: 20px; text-align: center; border-radius: 5px;">
          <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="color: #333; font-size: 16px; font-weight: bold;">Contact Details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px; font-weight: bold; color: #2d5016; width: 120px;">Name:</td>
              <td style="padding: 10px; color: #333;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px; font-weight: bold; color: #2d5016; width: 120px;">Email:</td>
              <td style="padding: 10px; color: #333;">${userEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 10px; font-weight: bold; color: #2d5016; width: 120px;">Subject:</td>
              <td style="padding: 10px; color: #333;">${subject}</td>
            </tr>
          </table>
          
          <p style="color: #333; font-size: 14px; font-weight: bold; margin-top: 20px;">Message:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2d5016; border-radius: 3px;">
            <p style="color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
              ${message}
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px;">
            <strong>Note:</strong> This is an automated message from your contact form. Please respond to ${userEmail} directly.
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            Sent on: ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #888;">
          <p>© 2024 Eco Organic Natural Foods. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email to user (confirmation)
    const userHtmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2d5016; padding: 20px; text-align: center; border-radius: 5px;">
          <h2 style="color: white; margin: 0;">We Received Your Message</h2>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="color: #333; font-size: 16px;">Hi ${name},</p>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Thank you for reaching out to us! We have received your message and will get back to you as soon as possible.
          </p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2d5016; border-radius: 3px; margin: 20px 0;">
            <p style="color: #333; font-weight: bold; margin: 0 0 10px 0;">Your Message Summary:</p>
            <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #555; font-size: 14px; margin: 5px 0; white-space: pre-wrap; word-wrap: break-word;">
              ${message}
            </p>
          </div>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Our team typically responds within 24-48 hours. If you have an urgent matter, please call us or visit our office.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px;">
            Best regards,<br>
            <strong>Eco Organic Natural Foods Team</strong>
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            © 2024 Eco Organic Natural Foods. All rights reserved.
          </p>
        </div>
      </div>
    `;

    // Send to admin
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.ADMIN_EMAIL || 'ecorganicplanet@gmail.com',
      replyTo: userEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: adminHtmlContent,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: userEmail,
      subject: 'We Received Your Message - Eco Organic Natural Foods',
      html: userHtmlContent,
    });

    console.log(`Contact form emails sent successfully for: ${name} (${userEmail})`);
    return true;
  } catch (error) {
    console.error('Error sending contact form emails with Resend:', error);
    throw new Error('Failed to send contact form emails');
  }
};

module.exports = { sendPasswordResetEmail, sendContactFormEmail };
