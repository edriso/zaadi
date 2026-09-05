import { basePath } from '@/site.config.mjs';
import type { Metadata } from 'next';
import '@fontsource-variable/cairo';
import '@fontsource/amiri-quran/arabic-400.css';
import './globals.css';
export const metadata: Metadata = {
  title: 'زادي | ذكر يرافق يومك',
  icons: { icon: `${basePath}/favicon.svg` },
  description:
    'أذكار موثقة، ذكر واحد في كل شاشة. اختر أذكار الصباح والمساء وما بعد الصلاة وقبل النوم، واقرأ على مهل.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
