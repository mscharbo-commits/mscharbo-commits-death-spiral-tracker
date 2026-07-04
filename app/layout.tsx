import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Death Spiral Tracker',
  description: 'Real-time monitoring of toxic convertible notes'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui' }}>{children}</body>
    </html>
  );
}
