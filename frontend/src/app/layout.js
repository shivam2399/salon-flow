import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "SalonFlow | Book Your Salon Appointment",
  description:
    "Discover salon services, choose your stylist, and book your next appointment with SalonFlow.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-stone-500">
            © 2026 SalonFlow. Your time, your style.
          </div>
        </footer>
      </body>
    </html>
  );
}