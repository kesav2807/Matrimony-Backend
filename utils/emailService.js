const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send OTP email to user
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - user's name for personalization
 */
const sendOTPEmail = async (to, otp, name = 'User') => {
    const mailOptions = {
        from: `"Madurai Matrimony" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🔐 Your Password Reset OTP – Madurai Matrimony',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
          <style>
             @media screen and (max-width: 600px) {
                 .container { margin: 10px !important; width: auto !important; }
                 .otp-code { font-size: 32px !important; letter-spacing: 8px !important; }
             }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:'Inter', Arial, sans-serif;-webkit-font-smoothing:antialiased;">
          <!-- High-Fidelity App Wrapper -->
          <div style="background: linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.95)), url('https://res.cloudinary.com/dybqmcgdz/image/upload/q_auto/f_auto/v1775358231/ea805e4d-2cd4-4f96-bf47-f66e5773aef5.png'); background-size: cover; background-position: center; padding: 40px 0; min-height: 100vh;">
            
            <div class="container" style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:0;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);border: 1px solid #f1f5f9;position:relative;">
              <!-- FOR MOBILE: On very small screens, we make it feel native by removing some rounded corners and adding side padding -->
              <style>
                @media screen and (max-width: 480px) {
                  .container { border-radius: 0 !important; width: 100% !important; border: none !important; }
                  .otp-box { border-radius: 12px !important; padding: 30px 15px !important; }
                  .otp-code { font-size: 38px !important; letter-spacing: 10px !important; }
                  .content-padding { padding: 40px 15px !important; }
                  .header-padding { padding: 50px 15px !important; }
                }
              </style>

              <!-- High-Authority Header with Branded Image Background -->
              <div class="header-padding" style="background: linear-gradient(rgba(128, 0, 0, 0.3), rgba(128, 0, 0, 0.5)), url('https://res.cloudinary.com/dybqmcgdz/image/upload/q_auto/f_auto/v1775358231/ea805e4d-2cd4-4f96-bf47-f66e5773aef5.png'); background-size: cover; background-position: center; padding: 60px 40px; text-align:center; border-bottom: 3px solid #d4af37;">
                <div style="width:72px;height:72px;background:#ffffff;border-radius:20px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 24px rgba(0,0,0,0.4);border: 2px solid #d4af37;">
                  <span style="font-size:36px;">💍</span>
                </div>
                <h1 style="color:#ffffff;margin:0;font-size:30px;font-family:'Playfair Display', serif;letter-spacing:1px;font-weight:700;text-shadow: 0 2px 8px rgba(0,0,0,0.5);">Madurai Matrimony</h1>
                <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:700;text-shadow: 0 1px 4px rgba(0,0,0,0.3);">Elite Access Token</p>
              </div>
  
              <!-- Modern Body Content -->
              <div class="content-padding" style="padding:60px 45px;">
                <div style="margin-bottom:35px;">
                    <p style="color:#111827;font-size:20px;margin:0 0 10px;font-weight:700;">Hello, ${name}</p>
                    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0;">
                      To keep your matrimony journey elite and secure, please verify your identity using the verification code below. 
                    </p>
                </div>

                <!-- High-Contrast OTP Area -->
                <div class="otp-box" style="background:#f9fafb;border: 1px solid #e5e7eb;border-radius:24px;padding:45px 20px;text-align:center;margin-bottom:40px;">
                  <p style="margin:0 0 15px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#800000;text-transform:uppercase;">One-Time Verification Code</p>
                  <div class="otp-code" style="font-size:52px;font-weight:800;letter-spacing:12px;color:#111827;font-family:'Courier New', monospace;">${otp}</div>
                  <div style="margin-top:20px;">
                    <span style="font-size:13px;color:#6b7280;font-weight:500;">⌛ Valid for 10 minutes</span>
                  </div>
                </div>
  
                <!-- Clean Security Note -->
                <div style="border-left:3px solid #800000;padding-left:20px;margin:40px 0;">
                   <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">
                      <strong style="color:#111827;">Action Required:</strong> Never disclose this code to anyone. Our support team will never ask for it.
                   </p>
                </div>
                
                <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:40px;">
                  IF YOU DID NOT REQUEST THIS CODE, PLEASE DISREGARD THIS MESSAGE.
                </p>
              </div>
  
              <!-- Premium App Footer -->
              <div style="background:#fefefe;padding:40px 30px;text-align:center;border-top:1px solid #f3f4f6;">
                <p style="color:#111827;font-size:14px;margin:0 0 8px;font-weight:700;">Madurai Matrimony</p>
                <p style="color:#9ca3af;font-size:10px;margin:0;line-height:1.6;letter-spacing:0.5px;">
                   Trusted Heritage Partner since 1998.<br/>
                   Exclusively serving elite profiles in Madurai.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('❌ Email send failed:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = { sendOTPEmail };
