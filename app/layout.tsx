import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { getServerSession } from 'next-auth';
import SessionProvider from './context/SessionProvider';
import Navbar from '../components/Navbar';
import { PlayerProvider } from './context/PlayerContext';
import Player from '../components/Player';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const geistSans = localFont({
  src: '../public/fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../public/fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Streaming-Platform',
  description: 'Your cloud music player',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider session={session}>
          <header className="fixed top-0 w-full bg-accentLight dark:bg-accentDark text-textLight dark:text-textDark shadow-soft dark:shadow-heavy h-16 z-10">
            <Navbar />
          </header>
          <PlayerProvider>
            <main className="flex-grow py-16  bg-backgroundLight dark:bg-backgroundDark text-textLight dark:text-textDark">
              {children}
            </main>
            <footer className="w-full fixed bottom-0 bg-accentLight dark:bg-accentDark text-textLight dark:text-textDark shadow-soft dark:shadow-heavy h-24">
              <Player />
            </footer>
          </PlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
