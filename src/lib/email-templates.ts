export function generateOTPVerificationEmail(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 32px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; font-weight: 500; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 16px; margin-top: 0; }
    .otp-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6b21a8; margin: 0; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 13px; color: #64748b; margin: 0; }
    .warning { font-size: 13px; color: #ef4444; margin-top: 16px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MINERVA</h1>
      <div class="logo-sub">IIM LUCKNOW ACADEMIC PORTAL</div>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email Address</h2>
      <p>Please use the following One-Time Password (OTP) to complete your registration process. This code is valid for <strong>10 minutes</strong>.</p>
      
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>
      
      <p>If you did not request this verification, please ignore this email or contact support if you have concerns.</p>
      <p class="warning">Never share your OTP with anyone, including staff.</p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; ${new Date().getFullYear()} Minerva - IIM Lucknow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generatePasswordResetEmail(otp: string): string {
  return generateOTPVerificationEmail(otp).replace(
    'Verify Your Email Address',
    'Password Reset Request'
  ).replace(
    'complete your registration process',
    'reset your password'
  );
}

export function generateWelcomeEmail(name: string, role: string): string {
  const roleDisplay = role.replace('_', ' ');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #6b21a8; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; font-weight: 500; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0; }
    .accent { color: #6b21a8; }
    .info-box { background-color: #f8fafc; border-left: 4px solid #6b21a8; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .btn { display: inline-block; background-color: #6b21a8; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 24px; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 13px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MINERVA</h1>
      <div class="logo-sub">IIM LUCKNOW ACADEMIC PORTAL</div>
    </div>
    <div class="content">
      <h2 class="title">Welcome to Minerva, <span class="accent">${name}</span>!</h2>
      <p>Your profile has been successfully verified and activated. You can now access the academic portal with your credentials.</p>
      
      <div class="info-box">
        <strong>Account Type:</strong> ${roleDisplay}<br>
        <strong>Status:</strong> Active
      </div>
      
      <p>As part of the Minerva ecosystem, you have access to tools specifically designed to streamline academic administrative tasks.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="btn" style="color: white !important;">Access Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; ${new Date().getFullYear()} Minerva - IIM Lucknow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateStudentInviteEmail(name: string, otp: string, link: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #6b21a8; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; font-weight: 500; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0; }
    .accent { color: #6b21a8; }
    .otp-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6b21a8; margin: 0; }
    .btn { display: inline-block; background-color: #6b21a8; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 16px; margin-bottom: 16px; text-align: center; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 13px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MINERVA</h1>
      <div class="logo-sub">IIM LUCKNOW ACADEMIC PORTAL</div>
    </div>
    <div class="content">
      <h2 class="title">Welcome to Minerva, <span class="accent">${name}</span>!</h2>
      <p>You have been enrolled in the official College Marks Portal. This utility is designed to help you view your grades, class rank, and performance across all courses transparently.</p>
      
      <p>To complete your student registration and set your secure password, please click the link below and use your One-Time Password (OTP):</p>
      
      <div class="otp-box">
        <p style="margin-top: 0; margin-bottom: 8px; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification OTP</p>
        <p class="otp-code">${otp}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${link}" class="btn" style="color: white !important;">Complete Registration</a>
      </div>
      
      <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${link}" style="color: #6b21a8;">${link}</a></p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; ${new Date().getFullYear()} Minerva - IIM Lucknow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateRegistrationSuccessEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Space Grotesk', 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #10b981; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; font-weight: 500; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 24px; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 13px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MINERVA</h1>
      <div class="logo-sub">IIM LUCKNOW ACADEMIC PORTAL</div>
    </div>
    <div class="content">
      <h2 class="title">Registration Successful!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your password has been set securely, and your account is now fully active.</p>
      <p>You can now log in and access your academic dashboard using your credentials at any time.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="btn" style="color: white !important;">Log In to Minerva</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; ${new Date().getFullYear()} Minerva - IIM Lucknow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateScorecardFinalizedEmail(
  studentName: string, 
  courseName: string, 
  finalGrade: string, 
  componentsHtml: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #6b21a8; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .logo-sub { color: #94a3b8; font-size: 14px; margin-top: 4px; font-weight: 500; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; margin-top: 0; }
    .accent { color: #6b21a8; }
    .grade-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; }
    .grade-label { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; }
    .grade-value { font-size: 48px; font-weight: 900; color: #6b21a8; margin: 0; line-height: 1; }
    .components-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    .components-table th { background-color: #f8fafc; padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .components-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #0f172a; font-weight: 500;}
    .components-table tr:last-child td { border-bottom: none; }
    .btn { display: inline-block; background-color: #6b21a8; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 24px; }
    .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 13px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">MINERVA</h1>
      <div class="logo-sub">IIM LUCKNOW ACADEMIC PORTAL</div>
    </div>
    <div class="content">
      <h2 class="title">Scorecard Finalized: <span class="accent">\${courseName}</span></h2>
      <p>Hello <strong>\${studentName}</strong>,</p>
      <p>Your instructor has permanently finalized and released the scorecards for <strong>\${courseName}</strong>. Your performance metrics and exact component breakdown are now available in your academic dashboard.</p>
      
      <div class="grade-box">
        <div class="grade-label">Final Grade Earned</div>
        <div class="grade-value">\${finalGrade}</div>
      </div>
      
      <p style="font-weight: 600; margin-bottom: 8px; color: #0f172a;">Your Component Breakdown:</p>
      <table class="components-table">
        <thead>
          <tr>
            <th>Component</th>
            <th style="text-align: right;">Score</th>
          </tr>
        </thead>
        <tbody>
          \${componentsHtml}
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="\${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/scorecard" class="btn" style="color: white !important;">View Full Scorecard</a>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">This is an automated academic notification. Please do not reply directly to this email.</p>
      <p class="footer-text">&copy; \${new Date().getFullYear()} Minerva - IIM Lucknow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
