import type { Metadata } from 'next';
import FloatingBackground from '@/components/FloatingBackground';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Recipe Generator',
  description: 'Generate personalized recipes with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="custom-cursor-area">
        <FloatingBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
