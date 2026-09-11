import { TResetPasswordLinkPayload } from "../../password-reset";

const passwordResetEmailTemplate = ({ resetUrl }: TResetPasswordLinkPayload): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f6f8;
  font-family: Arial, Helvetica, sans-serif;
  color: #1f2937;
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="padding: 40px 20px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          "
        >

          <!-- Header -->
          <tr>
            <td style="
              padding: 28px 32px;
              background-color: #111827;
              color: #ffffff;
            ">
              <h1 style="
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              ">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">

              <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 1.6;
              ">
                Hello,
              </p>

              <p style="
                margin: 0 0 24px;
                font-size: 16px;
                line-height: 1.6;
              ">
                We received a request to reset the password for your account on the
                Vasudha Foundation platform. Click the button below to choose a new password.
              </p>

              <!-- Reset Button -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="margin-bottom: 24px;"
              >
                <tr>
                  <td align="center">
                    <a
                      href="${resetUrl}"
                      target="_blank"
                      style="
                        display: inline-block;
                        padding: 14px 28px;
                        background-color: #111827;
                        color: #ffffff;
                        font-size: 16px;
                        font-weight: 600;
                        text-decoration: none;
                        border-radius: 6px;
                      "
                    >
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 0 0 24px;
                font-size: 14px;
                line-height: 1.6;
                color: #4b5563;
              ">
                If you did not request a password reset, you can safely ignore this email.
                The link will expire in 10 minutes.
              </p>

              <p style="
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: #4b5563;
              ">
                If the button above doesn't work, copy and paste this URL into your
                browser address bar:
              </p>
              <p style="
                margin: 8px 0 0;
                font-size: 13px;
                line-height: 1.6;
                color: #2563eb;
                word-break: break-all;
              ">
                ${resetUrl}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding: 20px 32px;
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              text-align: center;
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
              ">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default passwordResetEmailTemplate;