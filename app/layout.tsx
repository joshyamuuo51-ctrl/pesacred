import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PesaCred — Fast, Secure & Transparent Online Loans',
  description:
    'Apply for a loan in minutes and get a decision fast. PesaCred connects you to flexible financing with clear terms and no hidden fees.',
  openGraph: {
    title: 'PesaCred — Fast, Secure & Transparent Online Loans',
    description:
      'Apply for a loan in minutes and get a decision fast. Flexible financing with clear terms and no hidden fees.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
