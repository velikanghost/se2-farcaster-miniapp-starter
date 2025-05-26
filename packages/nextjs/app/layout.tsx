import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "~~/components/providers/CustomProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({ title: "Mini-App Starter", description: "A Mini-App Starter" });

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;

// import "@rainbow-me/rainbowkit/styles.css";
// import { ScaffoldEthAppWithProviders } from "~~/components/providers/ScaffoldEthAppWithProviders";
// import { ThemeProvider } from "~~/components/providers/ThemeProvider";
// import "~~/styles/globals.css";
// import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

// export const metadata = getMetadata({ title: "Scaffold-ETH 2 App", description: "Built with 🏗 Scaffold-ETH 2" });

// const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <html suppressHydrationWarning>
//       <body>
//         <ThemeProvider enableSystem>
//           <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// };

// export default ScaffoldEthApp;
