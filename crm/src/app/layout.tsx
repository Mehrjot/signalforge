import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import OnboardingTour from "@/components/OnboardingTour";

export const metadata: Metadata = {
  title: "SignalForge · Marketing OS",
  description: "An AI-native marketing operating system for reaching shoppers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="relative flex-1 overflow-x-hidden">{children}</main>
          </div>
          <OnboardingTour />
        </ThemeProvider>
      </body>
    </html>
  );
}
