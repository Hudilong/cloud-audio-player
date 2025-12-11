import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import localFont from 'next/font/local';
import './globals.css';
import { Inter, Poppins, Space_Grotesk } from 'next/font/google';
import MainContent from '@components/layout/MainContent';
import Navbar from '@components/layout/Navbar';
import Player from '@components/player/Player';
import { authOptions } from '@utils/authOptions';
import SessionProvider from './context/SessionProvider';
import { PlayerProvider } from './context/PlayerContext';

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

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
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
  const session = await getServerSession(authOptions);
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col text-textLight dark:text-textDark scrollbar-soft`}
      >
        <SessionProvider session={session}>
          {/* Fixed Header */}
          <header className="fixed top-0 w-full bg-white/70 dark:bg-backgroundDark/90 backdrop-blur-lg border-b border-white/60 dark:border-white/10 text-textLight dark:text-textDark shadow-glass h-14 sm:h-16 z-20 flex items-center">
            <Navbar />
          </header>

          <PlayerProvider>
            {/* Main Content */}
            <main className="flex-grow pt-14 sm:pt-16 pb-24 sm:pb-28">
              <MainContent>{children}</MainContent>
            </main>

            {/* Fixed Footer */}
            <footer className="w-full fixed bottom-0 text-textLight dark:text-textDark h-20 sm:h-24 z-20">
              <Player />
            </footer>
          </PlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
