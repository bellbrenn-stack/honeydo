import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM ?? "HoneyDo <noreply@honeydo.app>"

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFDF9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FAF3EE;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1A1A0F;padding:28px 40px;text-align:center;">
            <span style="font-size:28px;">🐝</span>
            <span style="font-size:26px;font-weight:bold;margin-left:8px;">
              <span style="color:#8DB870;">Honey</span><span style="color:#E8674A;">Do</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#1A1A0F;font-weight:600;">Reset your password</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#7A6E66;">
              We received a request to reset the password for your HoneyDo account.
              Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}"
                 style="display:inline-block;background:#8DB870;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(141,184,112,0.35);">
                Reset password →
              </a>
            </div>
            <p style="margin:0;font-size:13px;color:#B8A89A;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email — your password won't change.
            </p>
            <hr style="border:none;border-top:1px solid #E8DDD5;margin:28px 0;">
            <p style="margin:0;font-size:12px;color:#B8A89A;">
              Or copy this link into your browser:<br>
              <span style="color:#8DB870;word-break:break-all;">${resetUrl}</span>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F2E9E1;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#B8A89A;font-style:italic;">make planning sweet 🍯</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  if (!resend) {
    // No API key — log to console for local dev
    console.log(`\n[HoneyDo] Password reset link for ${to}:\n${resetUrl}\n`)
    return
  }

  await resend.emails.send({ from: FROM, to, subject: "Reset your HoneyDo password", html })
}
