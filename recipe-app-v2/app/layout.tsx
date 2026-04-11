import type { Metadata } from 'next';
import FloatingBackground from '@/components/FloatingBackground';
import Header from '@/components/Header';
import ErrorBoundary from '@/components/ErrorBoundary';
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
          <ErrorBoundary>
            <Header />
            {children}
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
