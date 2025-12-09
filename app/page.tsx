import Link from 'next/link';
import {
  FiCloud,
  FiHeadphones,
  FiPlayCircle,
  FiUploadCloud,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../utils/authOptions';

const featureCards = [
  {
    icon: <FiUploadCloud className="h-5 w-5" />,
    title: 'Effortless uploads',
    copy: 'Drop your tracks once, they sync everywhere instantly.',
  },
  {
    icon: <FiHeadphones className="h-5 w-5" />,
    title: 'Hi-fi playback',
    copy: 'Gapless, interruption-free listening across all devices.',
  },
  {
    icon: <FiShield className="h-5 w-5" />,
    title: 'Yours forever',
    copy: 'Private by default with playlists that travel with you.',
  },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/library');
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-64 w-64 bg-pastelPurple/35 blur-3xl" />
        <div className="absolute right-10 top-0 h-72 w-72 bg-accentLight/40 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 bg-pastelPurple/25 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-backgroundDark/70 backdrop-blur text-xs font-semibold uppercase tracking-[0.18em] text-muted border border-white/60 dark:border-white/10">
              <FiCloud className="h-4 w-4 text-pastelPurple" />
              Personal cloud audio
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-ink dark:text-textDark">
              Streamstress keeps your music{' '}
              <span className="bg-gradient-to-r from-pastelPurple to-accentLight bg-clip-text text-transparent">
                gorgeous, fast, and yours.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted max-w-xl mx-auto lg:mx-0">
              Upload once, listen anywhere. Build playlists, queue tracks, and
              glide through your library with a player built for music lovers.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white font-semibold shadow-soft hover:shadow-glass transition-all w-full sm:w-auto"
              >
                <FiPlayCircle className="h-5 w-5" />
                Start listening
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/70 backdrop-blur font-semibold text-ink dark:text-textDark hover:border-accentLight hover:text-accentDark transition-all w-full sm:w-auto"
              >
                Explore library
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-backgroundDark/70 backdrop-blur border border-white/60 dark:border-white/10">
                <FiZap className="text-accentDark" />
                Fast uploads & instant playback
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-backgroundDark/70 backdrop-blur border border-white/60 dark:border-white/10">
                <FiShield className="text-pastelPurple" />
                Private by default
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark shadow-glass p-6 sm:p-7">
              <div className="absolute inset-0 opacity-70">
                <div className="absolute -left-8 -top-6 h-32 w-32 bg-pastelPurple/30 blur-3xl" />
                <div className="absolute right-0 -bottom-10 h-40 w-40 bg-accentLight/25 blur-3xl" />
              </div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceMuted/80 dark:bg-backgroundDark/60 text-xs font-semibold text-muted">
                    Now playing
                  </div>
                  <span className="text-xs text-muted">Cloud synced</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pastelPurple to-accentLight shadow-soft" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink dark:text-textDark">
                      Violet Echoes
                    </p>
                    <p className="text-xs text-muted">By Streamstress</p>
                    <div className="mt-3 h-2 rounded-full bg-surfaceMuted">
                      <div className="h-2 w-1/2 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-3 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft hover:shadow-glass transition"
                    aria-label="Play sample"
                  >
                    <FiPlayCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/80 backdrop-blur p-4">
                    <p className="text-xs text-muted mb-1">Upload</p>
                    <p className="font-semibold text-ink dark:text-textDark">
                      Drag & drop
                    </p>
                    <p className="text-xs text-muted">Keep your cover art</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/80 backdrop-blur p-4">
                    <p className="text-xs text-muted mb-1">Playlist</p>
                    <p className="font-semibold text-ink dark:text-textDark">
                      Make it yours
                    </p>
                    <p className="text-xs text-muted">Queue or save in a tap</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark p-5 shadow-soft hover:shadow-glass transition-shadow"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft">
                {feature.icon}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink dark:text-textDark">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{feature.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
