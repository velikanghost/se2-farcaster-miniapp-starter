"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("~~/components/home"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function App() {
  return <Home />;
}
