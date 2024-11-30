import Link from "next/link";

export default function Home() {
    return (
        <div className="container flex flex-1 mx-auto pt-48 justify-center">
            <div>
                <h1 className="text-4xl font-bold">
                    Your Music, Anywhere, Anytime
                </h1>
                <h2 className="text-2xl font-semibold text-pastelPurple mt-4">
                    Welcome to Streamstress – your personal cloud music hub.{" "}
                    <br />
                    Upload your favorite tracks and access them instantly, no
                    matter where you are.
                </h2>
                <h3 className="text-xl font-medium mt-6">
                    🎵 Stream Seamlessly
                </h3>
                <p className="text-base mt-2">
                    Enjoy your music with high-quality playback and zero
                    interruptions across all your devices.
                </p>
                <h3 className="text-xl font-medium mt-6">
                    🚀 Effortless Uploads
                </h3>
                <p className="text-base mt-2">
                    Quickly upload your music to the cloud and organize it your
                    way.
                </p>
                <h3 className="text-xl font-medium mt-6">
                    🎶 Made for Music Lovers
                </h3>
                <p className="text-base mt-2">
                    From audiophiles to casual listeners, we’re here to redefine
                    how you experience your collection.
                </p>
                <p className="text-base mt-4">
                    Start your journey today and take your music with you
                    wherever life leads.
                </p>
                <div className="mt-20">
                    <Link
                        href="/register"
                        className="px-4 py-2 bg-accentLight dark:bg-accentDark text-white rounded-xl shadow-soft dark:shadow-heavy"
                    >
                        Sign Up Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
