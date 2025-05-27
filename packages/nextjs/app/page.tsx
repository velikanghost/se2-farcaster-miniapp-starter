import { Metadata } from "next";
import App from "~~/components/App";
import { APP_URL } from "~~/utils/constants";

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "Launch App",
    action: {
      type: "launch_frame",
      name: "Scaffold-ETH Mini-app Starter",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Scaffold-ETH Mini-app Starter",
    openGraph: {
      title: "Scaffold-ETH Mini-app Starter",
      description: "A Scaffold-ETH Mini-app Starter",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
