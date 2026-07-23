import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, pdfBase64, summary } = await req.json();

    if (!email || !pdfBase64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const { error: userMailError } = await resend.emails.send({
      from: 'איתנות פיננסית <info@eitanut-finance.co.il>',
      to: email,
      subject: 'דוח משכנתא מאיתנות פיננסית',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2C3D;">
          <div style="background: linear-gradient(135deg, #1A2C3D, #2A4560); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">איתנות פיננסית</h1>
            <p style="color: #BDD8EE; margin: 8px 0 0; font-size: 14px;">ייעוץ משכנתאות מוסמך</p>
          </div>
          <div style="background: #f8fbff; padding: 32px; border: 1px solid #BDD8EE;">
            <p style="font-size: 16px; margin-bottom: 8px;">שלום${name ? ' ' + name : ''},</p>
            <p style="color: #4D6E88; line-height: 1.6;">מצורף דוח חישוב המשכנתא שלך מאיתנות פיננסית.</p>
            <div style="background: #fff; border: 1px solid #BDD8EE; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #4D6E88; line-height: 1.8; white-space: pre-line;">${summary}</div>
            <div style="background: #fffbf0; border: 1px solid #C9A84C40; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #A07C28; font-size: 13px; margin: 0;">⚠️ החישוב מבוסס על הנחות ממוצעות. לייעוץ מדויק ואישי פנה לליאור נגר.</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://wa.me/972525076504" style="background: linear-gradient(135deg, #C9A84C, #E8C97A); color: #1A2C3D; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">📱 שלח WhatsApp לליאור</a>
            </div>
          </div>
          <div style="background: #1A2C3D; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #BDD8EE; font-size: 13px; margin: 0;">ליאור נגר | 052-5076504 | eitanut.finance@gmail.com</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `דוח-משכנתא-${name ? name.replace(/\s/g, '-') : 'איתנות'}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (userMailError) {
      console.error('send-report error (user email):', userMailError);
      return NextResponse.json({ error: userMailError.message || 'Failed to send email' }, { status: 502 });
    }

    // Also notify Lior
    const { error: leadMailError } = await resend.emails.send({
      from: 'מחשבון משכנתא <info@eitanut-finance.co.il>',
      to: 'eitanut.finance@gmail.com',
      subject: `ליד חדש — ${name || 'לא ידוע'} ביקש דוח משכנתא`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #1A2C3D; padding: 24px;">
          <h2 style="color: #C9A84C;">ליד חדש מהמחשבון 🎯</h2>
          <p><strong>שם:</strong> ${name || '—'}</p>
          <p><strong>טלפון:</strong> ${phone || '—'}</p>
          <p><strong>מייל:</strong> ${email}</p>
          <hr style="border-color: #BDD8EE;"/>
          <pre style="background:#f4f8fc; padding:12px; border-radius:8px; font-size:13px; white-space:pre-wrap;">${summary}</pre>
        </div>
      `,
    });

    if (leadMailError) {
      console.error('send-report error (lead notification):', leadMailError);
      return NextResponse.json({ error: leadMailError.message || 'Failed to notify lead' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('send-report error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
