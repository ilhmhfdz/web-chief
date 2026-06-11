import BookingWizard from "@/app/booking/components/BookingWizard";

export const metadata = {
  title: "Book an Appointment | Barber Chief",
  description: "Book your next premium grooming session with Barber Chief.",
};

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900/20 selection:text-neutral-900">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      {/* Background glowing effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-400/20 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-600/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Reserve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600">Session</span>
            </h1>
            <p className="text-neutral-600 max-w-lg mx-auto">
              Experience the pinnacle of grooming. Choose your service, select your preferred barber, and pick a time that suits you.
            </p>
          </div>
          
          <BookingWizard />
        </div>
      </div>
    </main>
  );
}
