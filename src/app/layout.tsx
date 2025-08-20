import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Realtime Chat",
  description: "Next.js + TailwindCSS + Socket.io Chat App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
