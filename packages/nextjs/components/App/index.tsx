"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("~~/components/Home"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  ),
});

export default function App() {
  return <Home />;
}
