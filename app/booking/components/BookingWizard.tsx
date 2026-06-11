"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, User, CalendarDays, CheckCircle2, 
  ChevronRight, ChevronLeft, Clock, Star,
  Check
} from "lucide-react";

// --- Dummy Data ---
const SERVICES = [
  { id: "s1", name: "Classic Haircut", duration: "45 min", price: "Rp 60.000", description: "Precision cut, wash, and style." },
  { id: "s2", name: "Beard Grooming", duration: "30 min", price: "Rp 35.000", description: "Trimming, shaping, and conditioning." },
  { id: "s3", name: "Royal Shave", duration: "45 min", price: "Rp 50.000", description: "Hot towel straight razor shave." },
  { id: "s4", name: "The Chief Package", duration: "90 min", price: "Rp 100.000", description: "Haircut, beard trim, and facial massage." },
];

const BARBERS = [
  { id: "b1", name: "Alex Mercer", role: "Master Barber", rating: 4.9, reviews: 124 },
  { id: "b2", name: "Jordan Lee", role: "Senior Stylist", rating: 4.8, reviews: 98 },
  { id: "b3", name: "Taylor Swift", role: "Style Director", rating: 5.0, reviews: 210 },
];

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:30 PM", "04:30 PM"
];

// --- Types ---
type BookingData = {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
};

// --- Animations ---
const fadeVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
};

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>({
    serviceId: "",
    barberId: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
  });

  const nextStep = () => setStep((p) => Math.min(p + 1, 5));
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const updateData = (fields: Partial<BookingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const steps = [
    { num: 1, title: "Service", icon: Scissors },
    { num: 2, title: "Barber", icon: User },
    { num: 3, title: "Date & Time", icon: CalendarDays },
    { num: 4, title: "Details", icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-neutral-200 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Progress Bar */}
      {step < 5 && (
        <div className="mb-12">
          <div className="flex justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-200 -z-10 -translate-y-1/2" />
            <div 
              className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-neutral-900 to-neutral-700 -z-10 -translate-y-1/2 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            
            {steps.map((s) => {
              const isActive = step >= s.num;
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? "bg-neutral-900 text-white shadow-[0_0_15px_rgba(0,0,0,0.2)]" 
                        : "bg-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${isActive ? "text-neutral-900" : "text-neutral-500"}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-900">Select a Service</h2>
                <p className="text-neutral-600 text-sm">Choose the treatment you'd like to receive.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateData({ serviceId: s.id })}
                    className={`text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                      ${data.serviceId === s.id 
                        ? "border-neutral-900 bg-neutral-100" 
                        : "border-neutral-200 bg-white hover:border-neutral-900/50 hover:bg-neutral-50"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-neutral-900 transition-colors">{s.name}</h3>
                      <span className="text-neutral-900 font-medium">{s.price}</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-4">{s.description}</p>
                    <div className="flex items-center text-xs text-neutral-500">
                      <Clock size={14} className="mr-1" />
                      {s.duration}
                    </div>
                    {data.serviceId === s.id && (
                      <div className="absolute bottom-4 right-4 text-neutral-900">
                        <Check size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-900">Choose your Barber</h2>
                <p className="text-neutral-600 text-sm">Select one of our master craftsmen.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BARBERS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateData({ barberId: b.id })}
                    className={`flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-300 relative group
                      ${data.barberId === b.id 
                        ? "border-neutral-900 bg-neutral-100" 
                        : "border-neutral-200 bg-white hover:border-neutral-900/50 hover:bg-neutral-50"
                      }`}
                  >
                    <div className="w-20 h-20 rounded-full bg-neutral-100 mb-4 flex items-center justify-center border-2 border-transparent group-hover:border-neutral-900/50 transition-colors">
                      <User size={32} className="text-neutral-400" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{b.name}</h3>
                    <p className="text-xs text-neutral-700 mb-3">{b.role}</p>
                    <div className="flex items-center text-xs text-neutral-600">
                      <Star size={12} className="text-neutral-900 mr-1 fill-neutral-900" />
                      <span>{b.rating} ({b.reviews})</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-900">Select Date & Time</h2>
                <p className="text-neutral-600 text-sm">When would you like to come in?</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Simple dummy date picker */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700">Choose Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors [color-scheme:light]"
                    value={data.date}
                    onChange={(e) => updateData({ date: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 italic mt-2">* Showing available slots for selected date</p>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700">Available Times</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        disabled={!data.date}
                        onClick={() => updateData({ time: t })}
                        className={`py-2 px-3 rounded-lg text-sm border transition-all duration-300
                          ${!data.date ? "opacity-50 cursor-not-allowed border-neutral-200 bg-neutral-100" :
                            data.time === t 
                            ? "border-neutral-900 bg-neutral-900 text-white font-semibold shadow-[0_0_10px_rgba(0,0,0,0.2)]" 
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900/50 hover:bg-neutral-50"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-900">Your Details</h2>
                <p className="text-neutral-600 text-sm">Almost there. We just need a few details to confirm.</p>
              </div>
              <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm text-neutral-700">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm text-neutral-700">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="phone" className="text-sm text-neutral-700">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </form>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={fadeVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-6 py-8">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="w-24 h-24 bg-neutral-900/10 rounded-full flex items-center justify-center mx-auto"
              >
                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                  <Check size={32} className="text-white" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold mb-2 text-neutral-900">Booking Confirmed!</h2>
                <p className="text-neutral-600">See you on <span className="text-neutral-900 font-medium">{data.date}</span> at <span className="text-neutral-900 font-medium">{data.time}</span>.</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-6 text-left max-w-sm mx-auto mt-8 shadow-sm">
                <div className="text-sm text-neutral-500 mb-1">Service</div>
                <div className="text-neutral-900 font-medium mb-4">{SERVICES.find(s => s.id === data.serviceId)?.name}</div>
                
                <div className="text-sm text-neutral-500 mb-1">Barber</div>
                <div className="text-neutral-900 font-medium">{BARBERS.find(b => b.id === data.barberId)?.name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      {step < 5 && (
        <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${step === 1 ? "opacity-0 pointer-events-none" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"}`}
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </button>
          
          <button
            onClick={() => {
              // Basic validation before proceeding
              if (step === 1 && !data.serviceId) return;
              if (step === 2 && !data.barberId) return;
              if (step === 3 && (!data.date || !data.time)) return;
              
              if (step === 4) {
                // Trigger form submission manually to catch required fields
                const form = document.querySelector('form');
                if (form && !form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
              }
              
              nextStep();
            }}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${(step === 1 && !data.serviceId) || 
                (step === 2 && !data.barberId) || 
                (step === 3 && (!data.date || !data.time))
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" 
                : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]"
              }`}
          >
            {step === 4 ? "Confirm Booking" : "Continue"}
            {step < 4 && <ChevronRight size={16} className="ml-1" />}
          </button>
        </div>
      )}
    </div>
  );
}
