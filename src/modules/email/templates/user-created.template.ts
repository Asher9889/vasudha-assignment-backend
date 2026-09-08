import { TCreateUserPayload } from "../../user";

const userCreatedEmailTemplate = (user: TCreateUserPayload): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Account Created</title>
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
                Admin Account Created
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
                An administrator account has been created for you on the
                Vasudha Foundation platform.
              </p>

              <!-- Account Details -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background-color: #f9fafb;
                  border: 1px solid #e5e7eb;
                  border-radius: 6px;
                  margin-bottom: 24px;
                "
              >
                <tr>
                  <td style="
                    padding: 12px 16px;
                    font-weight: 600;
                    width: 120px;
                  ">
                    Email
                  </td>

                  <td style="padding: 12px 16px;">
                    ${user.email}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding: 12px 16px;
                    font-weight: 600;
                  ">
                    Role
                  </td>

                  <td style="padding: 12px 16px;">
                    ${user.role}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding: 12px 16px;
                    font-weight: 600;
                  ">
                    Status
                  </td>

                  <td style="padding: 12px 16px;">
                    ${user.accountStatus}
                  </td>
                </tr>
              </table>

              <p style="
                margin: 0 0 24px;
                font-size: 15px;
                line-height: 1.6;
                color: #4b5563;
              ">
                You can now use your account credentials to access the
                administration dashboard.
              </p>

              <p style="
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: #6b7280;
              ">
                If you did not expect this account to be created, please
                contact the system administrator.
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

export default userCreatedEmailTemplate;