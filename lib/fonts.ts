import {
  Geist,
  Inter,
  Poppins,
  PT_Sans,
  Plus_Jakarta_Sans,
  Hedvig_Letters_Serif,
  Kumbh_Sans
} from "next/font/google";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";

const lpmq = localFont({
  src: "../public/fonts/LPMQ IsepMisbah.ttf",
  variable: "--font-lpmq",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const plus_jakarta_sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-plus-jakarta-sans"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins"
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"]
});

const hedvig_letters_serif = Hedvig_Letters_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-hedvig-letters-serif"
});

const kumbh_sans = Kumbh_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kumbh-sans"
});

export const fontVariables = cn(
  geist.variable,
  inter.variable,
  poppins.variable,
  ptSans.variable,
  plus_jakarta_sans.variable,
  hedvig_letters_serif.variable,
  kumbh_sans.variable,
  lpmq.variable
);
