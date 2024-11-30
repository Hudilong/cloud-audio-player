"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

const RegisterPage = () => {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(userInfo),
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        if (res.ok) {
            router.push("/login");
        } else {
            setErrorMsg(data.error || "An error occurred");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-backgroundLight dark:bg-backgroundDark">
            <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow-soft">
                <h1 className="text-2xl font-bold text-center text-textLight dark:text-textDark">
                    Register
                </h1>
                {errorMsg && (
                    <p className="text-red-500 text-center">{errorMsg}</p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textLight dark:text-textDark">
                            Name
                        </label>
                        <input
                            type="text"
                            value={userInfo.name}
                            onChange={(e) =>
                                setUserInfo({
                                    ...userInfo,
                                    name: e.target.value,
                                })
                            }
                            required
                            className="w-full px-3 py-2 mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
                        />
                    </div>
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
                        Register
                    </button>
                </form>
                <p className="text-sm text-center text-textLight dark:text-textDark">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-accentLight dark:text-accentDark hover:underline"
                    >
                        Sign In
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
