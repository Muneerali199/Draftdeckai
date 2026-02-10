import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, content, fromName, fromEmail, letterContent } = body;

    if (!to || !subject || !letterContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a test SMTP transporter using Ethereal
    // For testing purposes, we'll create a test account
    const testAccount = await nodemailer.createTestAccount();

    // Create reusable transporter object using the test account
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || testAccount.user,
        pass: process.env.EMAIL_PASS || testAccount.pass,
      },
    });

    // Format the letter content for email
    const formattedContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="margin-bottom: 20px;">
          ${fromName ? `<p style="margin-bottom: 5px;"><strong>${fromName}</strong></p>` : ''}
          ${fromEmail ? `<p style="margin-bottom: 5px;">${fromEmail}</p>` : ''}
          ${letterContent.from?.address ? `<p style="margin-bottom: 5px;">${letterContent.from.address}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
          <p>${letterContent.date || ''}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          ${letterContent.to?.name ? `<p style="margin-bottom: 5px;"><strong>${letterContent.to.name}</strong></p>` : ''}
          ${letterContent.to?.address ? `<p style="margin-bottom: 5px;">${letterContent.to.address}</p>` : ''}
        </div>
        
        ${letterContent.subject ? `<div style="margin-bottom: 20px;"><p><strong>Subject: ${letterContent.subject}</strong></p></div>` : ''}
        
        <div style="line-height: 1.6; white-space: pre-line;">
          ${letterContent.content || ''}
        </div>
      </div>
    `;

    // Additional personal message if provided
    const personalMessage = content ? 
      `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p><em>Personal message:</em></p>
        <p>${content}</p>
      </div>` : '';

    // Send email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail || process.env.EMAIL_FROM || 'noreply@draftdeckai.com'}>`,
      to,
      subject,
      html: `${formattedContent}${personalMessage}`,
      text: `${letterContent.content || ''}\n\n${content ? `Personal message: ${content}` : ''}`,
    });

    // Get the Ethereal URL for viewing the test email (only for Ethereal emails)
    const previewUrl = process.env.EMAIL_HOST ? null : nodemailer.getTestMessageUrl(info);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}