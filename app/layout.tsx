import { basePath } from '@/site.config.mjs';
import type { Metadata } from 'next';
import { fonts, fontCss } from '@/lib/fonts.mjs';
import { bootstrapAppearance, STORAGE } from '@/lib/appearance.mjs';
import './globals.css';
export const metadata: Metadata = {
  title: 'زادي | ذكر يرافق يومك',
  icons: { icon: `${basePath}/zaadi-icon.svg` },
  description:
    'أذكار موثقة، ذكر واحد في كل شاشة. اختر أذكار الصباح والمساء وما بعد الصلاة وقبل النوم، واقرأ على مهل.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {fonts.map((font) => (
          <link
            key={font.file}
            rel="preload"
            href={`${basePath}/fonts/${font.file}`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        <style dangerouslySetInnerHTML={{ __html: fontCss(basePath) }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(${bootstrapAppearance.toString()})(${JSON.stringify(STORAGE)},${JSON.stringify(fonts)});`,
          }}
        />
      </head>
      <body>
        <output className="boot-indicator" aria-label="جارٍ تهيئة القراءة">
          <span />
        </output>
        {children}
      </body>
    </html>
  );
}
