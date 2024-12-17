import Link from 'next/link';

export default function Home() {
  return (
    <div className="container flex flex-col justify-between min-h-screen mx-auto pt-16 px-6 sm:px-12 lg:pt-48 lg:px-0">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
          Your Music, Anywhere, Anytime
        </h1>
        <h2 className="text-lg sm:text-2xl font-semibold text-pastelPurple mt-4 leading-relaxed">
          Welcome to Streamstress – your personal cloud music hub.{' '}
          <br className="hidden sm:block" />
          Upload your favorite tracks and access them instantly, no matter where
          you are.
        </h2>
        <h3 className="text-base sm:text-xl font-medium mt-6">
          🎵 Stream Seamlessly
        </h3>
        <p className="text-sm sm:text-base mt-2">
          Enjoy your music with high-quality playback and zero interruptions
          across all your devices.
        </p>
        <h3 className="text-base sm:text-xl font-medium mt-6">
          🚀 Effortless Uploads
        </h3>
        <p className="text-sm sm:text-base mt-2">
          Quickly upload your music to the cloud and organize it your way.
        </p>
        <h3 className="text-base sm:text-xl font-medium mt-6">
          🎶 Made for Music Lovers
        </h3>
        <p className="text-sm sm:text-base mt-2">
          From audiophiles to casual listeners, we’re here to redefine how you
          experience your collection.
        </p>
        <p className="text-sm sm:text-base mt-4">
          Start your journey today and take your music with you wherever life
          leads.
        </p>
      </div>
      <div className="mt-10 sm:mt-20 text-center lg:text-left">
        <Link
          href="/register"
          className="inline-block w-full sm:w-auto px-4 py-2 bg-accentLight dark:bg-accentDark text-white rounded-xl shadow-soft dark:shadow-heavy text-center"
        >
          Sign Up Now
        </Link>
      </div>
    </div>
  );
}
