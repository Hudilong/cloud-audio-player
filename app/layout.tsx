import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { getServerSession } from 'next-auth';
import SessionProvider from './context/SessionProvider';
import Navbar from '../components/Navbar';
import { PlayerProvider } from './context/PlayerContext';
import Player from '../components/Player';
import MainContent from '../components/MainContent';

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
          {/* Fixed Header */}
          <header className="fixed top-0 w-full bg-accentLight dark:bg-accentDark text-textLight dark:text-textDark shadow-soft dark:shadow-heavy h-12 sm:h-16 z-10 flex items-center">
            <Navbar />
          </header>

          <PlayerProvider>
            {/* Main Content */}
            <main className="flex-grow pt-12 sm:pt-16 pb-20 sm:pb-24 bg-backgroundLight dark:bg-backgroundDark text-textLight dark:text-textDark">
              <MainContent>{children}</MainContent>
            </main>

            {/* Fixed Footer */}
            <footer className="w-full fixed bottom-0 bg-accentLight dark:bg-accentDark text-textLight dark:text-textDark shadow-soft dark:shadow-heavy h-16 sm:h-20 z-10">
              <Player />
            </footer>
          </PlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
