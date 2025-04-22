/**
 * Send a welcome email to a new user with their temporary password
 * @param email The user's email address
 * @param fullName The user's full name
 * @param temporaryPassword The temporary password
 * @param isReset Whether this is a password reset (default: false)
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  temporaryPassword: string,
  isReset = false,
): Promise<{ success: boolean; error: string | null }> {
  try {
    // In a production environment, you would use a proper email service
    // like SendGrid, Mailgun, AWS SES, etc.

    // For now, we'll just log the email content
    console.log(`
      To: ${email}
      Subject: ${isReset ? "Your Password Has Been Reset" : "Welcome to Hospital Diagnosis Management System"}
      
      Dear ${fullName},
      
      ${
        isReset
          ? "Your password has been reset by an administrator."
          : "Welcome to the Hospital Diagnosis Management System! Your account has been created."
      }
      
      Your ${isReset ? "new " : "temporary "}password is: ${temporaryPassword}
      
      Please log in and change your password immediately for security reasons.
      
      If you have any questions, please contact your system administrator.
      
      Best regards,
      Hospital Diagnosis Management System Team
    `)

    // In a real implementation, you would send the email here
    // For example, using SendGrid:
    /*
    const msg = {
      to: email,
      from: 'noreply@yourhospital.com',
      subject: isReset ? 'Your Password Has Been Reset' : 'Welcome to Hospital Diagnosis Management System',
      text: `
        Dear ${fullName},
        
        ${isReset 
          ? 'Your password has been reset by an administrator.' 
          : 'Welcome to the Hospital Diagnosis Management System! Your account has been created.'}
        
        Your ${isReset ? 'new ' : 'temporary '}password is: ${temporaryPassword}
        
        Please log in and change your password immediately for security reasons.
        
        If you have any questions, please contact your system administrator.
        
        Best regards,
        Hospital Diagnosis Management System Team
      `,
      html: `
        <p>Dear ${fullName},</p>
        
        <p>${isReset 
          ? 'Your password has been reset by an administrator.' 
          : 'Welcome to the Hospital Diagnosis Management System! Your account has been created.'}</p>
        
        <p>Your ${isReset ? 'new ' : 'temporary '}password is: <strong>${temporaryPassword}</strong></p>
        
        <p>Please log in and change your password immediately for security reasons.</p>
        
        <p>If you have any questions, please contact your system administrator.</p>
        
        <p>Best regards,<br>
        Hospital Diagnosis Management System Team</p>
      `,
    };
    await sgMail.send(msg);
    */

    return { success: true, error: null }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return {
      success: false,
      error: "Failed to send welcome email. Please provide the temporary password to the user manually.",
    }
  }
}

/**
 * Send a notification email to a user
 * @param email The user's email address
 * @param fullName The user's full name
 * @param subject The email subject
 * @param message The email message
 */
export async function sendNotificationEmail(
  email: string,
  fullName: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    // In a production environment, you would use a proper email service

    // For now, we'll just log the email content
    console.log(`
      To: ${email}
      Subject: ${subject}
      
      Dear ${fullName},
      
      ${message}
      
      Best regards,
      Hospital Diagnosis Management System Team
    `)

    return { success: true, error: null }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return {
      success: false,
      error: "Failed to send notification email.",
    }
  }
}

/**
 * Send a support ticket update notification
 * @param email The user's email address
 * @param fullName The user's full name
 * @param ticketId The support ticket ID
 * @param ticketSubject The support ticket subject
 * @param status The new status
 */
export async function sendSupportTicketUpdateEmail(
  email: string,
  fullName: string,
  ticketId: string,
  ticketSubject: string,
  status: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const subject = `Support Ticket Update: ${ticketSubject}`
    const message = `
      Your support ticket #${ticketId} with subject "${ticketSubject}" has been updated.
      
      New Status: ${status}
      
      You can view the details of your ticket by logging into your account.
    `

    return await sendNotificationEmail(email, fullName, subject, message)
  } catch (error) {
    console.error("Error sending support ticket update email:", error)
    return {
      success: false,
      error: "Failed to send support ticket update email.",
    }
  }
}
