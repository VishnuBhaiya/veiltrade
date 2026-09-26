import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VeilTrade | Confidential RWA Settlement on HSK Chain',
  description: 'Private institutional order flow, compliant matching, and atomic RWA settlement on HSK Chain.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
