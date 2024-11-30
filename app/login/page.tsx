"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { FcGoogle } from "react-icons/fc";

const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [userInfo, setUserInfo] = useState({ email: "", password: "" });
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            redirect: false,
            email: userInfo.email,
            password: userInfo.password,
            callbackUrl,
        });

        if (res?.error) {
            setErrorMsg(res.error);
        } else if (res?.url) {
            router.push(res.url);
        }
    };

    const handleGoogleSignIn = async () => {
        await signIn("google", { callbackUrl });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-backgroundLight dark:bg-backgroundDark">
            <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow-soft">
                <h1 className="text-2xl font-bold text-center text-textLight dark:text-textDark">
                    Sign In
                </h1>
                {errorMsg && (
                    <p className="text-red-500 text-center">{errorMsg}</p>
                )}
                <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-50"
                >
                    <FcGoogle className="mr-2" size={24} />
                    Sign in with Google
                </button>
                <div className="relative flex items-center justify-center">
                    <span className="absolute px-2 text-gray-500 bg-white dark:bg-gray-800">
                        OR
                    </span>
                    <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textLight dark:text-textDark">
                            Email
                        </label>
                        <input
                            type="email"
                            value={userInfo.email}
                            onChange={(e) =>
                                setUserInfo({
                                    ...userInfo,
                                    email: e.target.value,
                                })
                            }
                            required
                            className="w-full px-3 py-2 mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textLight dark:text-textDark">
                            Password
                        </label>
                        <input
                            type="password"
                            value={userInfo.password}
                            onChange={(e) =>
                                setUserInfo({
                                    ...userInfo,
                                    password: e.target.value,
                                })
                            }
                            required
                            className="w-full px-3 py-2 mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-accentLight dark:bg-accentDark rounded-md hover:bg-opacity-90"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-sm text-center text-textLight dark:text-textDark">
                    Don&apos;t have an account?{" "}
                    <a
                        href="/register"
                        className="text-accentLight dark:text-accentDark hover:underline"
                    >
                        Sign Up
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
