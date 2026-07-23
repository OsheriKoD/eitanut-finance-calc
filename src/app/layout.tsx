import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'מחשבון משכנתא | איתנות פיננסית',
  description: 'חשב את המשכנתא שלך בחינם — לפי תקנות בנק ישראל. ייעוץ אישי עם ליאור נגר.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-[#E8F4FB] text-[#1A2C3D] antialiased">{children}</body>
    </html>
  );
}
