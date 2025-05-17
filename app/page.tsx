"use client";

import { useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import ReCAPTCHA from "react-google-recaptcha";

type Category = keyof typeof servicePriceMap;
type ServiceFormData = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  selections: Partial<Record<Category, string>>;
  captchaToken?: string;
};

const servicePriceMap = {
  "SOUND SYSTEM": {
    "POLK MONITOR 7.1.4": 330000,
    "POLK SIGNATURE ELITE 7.1.4": 470000,
    "DEFINITIVE TECHNOLOGY": 670000,
  },
  AVR: {
    "DENON 6800 (Recommended)": 330000,
    "MARANTZ CINEMA 50": 220000,
  },
  PROJECTOR: {
    "ViewSonic X100-4K Projector": 230000,
    "Optoma UHD 50": 220000,
  },
  "PROJECTOR SCREEN": {
    '4k woven Acoustic Transparent Fabric Sound Max - 150"': 66000,
    '4k woven Grey Acoustic Transparent Fabric Sound Max - 150"': 78000,
  },
  ACOUSTICS: {
    "Acoustics @ 400/sq. ft": 478400,
    "Acoustics @ 460/sq. ft": 550160,
    "Acoustics @ 580/sq. ft": 693680,
    "Acoustics @ 680/sq. ft": 813280,
  },
  "FLOORING & STAGE": {
    "Chips Flooring": 350000,
  },
  "FALSE CEILING": {
    "Gypsum False Ceiling": 85000,
  },
  SEATING: {
    "Recliner Single Seater (RRR)": 23000,
    "Recliner Single Seater (Powered)": 27000,
    "Recliner Two Seater (Powered)": 53000,
    'Sofa Cum Bed (48"x66")': 39000,
  },
  ACCESSORIES: {
    "Speaker Cabling": 80000,
  },
} as const;

const steps = ["Contact Info", "Select Services", "Verify & Submit"];

export default function ServiceForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ServiceFormData>({
    mode: "onChange",
    defaultValues: { selections: {} },
  });

  const [step, setStep] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const selections = watch("selections") || {};

  // Calculate total price dynamically based on selections
  const totalPrice = Object.entries(selections)
    .filter(([val]) => val)
    .reduce((sum, [cat, service]) => {
      const price = servicePriceMap[cat as Category]?.[service as keyof typeof servicePriceMap[Category]] || 0;
      return sum + price;
    }, 0);

  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    if (!captchaToken) {
      alert("Please complete the CAPTCHA.");
      return;
    }

    const selectionsArr = Object.entries(data.selections || {}).filter(([_, val]) => val);

    const summary = selectionsArr
      .map(
        ([cat, service]) =>
          `${cat}: ${service} - ₹${servicePriceMap[cat as Category]?.[service as keyof typeof servicePriceMap[Category]]}`
      )
      .join("\n");

    const msg = `Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || "Not Provided"}\nServices:\n${summary}\nTotal: ₹${totalPrice}\nNotes: ${data.notes || "None"}`;

    const encodedMsg = encodeURIComponent(msg);
    const adminPhone = "918076566523";
    const isMobile = navigator.userAgent.toLowerCase().includes("mobile");
    const whatsappURL = isMobile
      ? `whatsapp://send?phone=${adminPhone}&text=${encodedMsg}`
      : `https://wa.me/${adminPhone}?text=${encodedMsg}`;

    // Include totalPrice in submission data
    const formDataWithCaptcha = { ...data, captchaToken, totalPrice };

    await fetch("/api/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataWithCaptcha),
    });

    window.open(whatsappURL, "_blank");
  };

  const handleNext = async () => {
    let valid = false;
    if (step === 0) {
      valid = await trigger(["name", "phone"]);
    } else if (step === 1) {
      valid = true; // No required validation for services
    }
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-4">Service Request Form</h1>

      {/* Step Indicator */}
      <div className="flex justify-between mb-6">
        {steps.map((label, index) => (
          <div key={index} className="flex-1 text-center">
            <div
              className={`mx-auto mb-1 w-8 h-8 flex items-center justify-center rounded-full border-2 ${index === step
                ? "border-blue-600 bg-blue-600 text-white"
                : index < step
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-300 text-gray-500"
                }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-xs font-semibold ${index === step ? "text-blue-600" : index < step ? "text-green-600" : "text-gray-500"
                }`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Contact Info */}
        {step === 0 && (
          <>
            <input
              {...register("name", { required: "Name is required" })}
              placeholder="Your Name"
              className="w-full p-3 border rounded"
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}

            <input
              {...register("phone", { required: "Phone number is required" })}
              type="tel"
              placeholder="Phone Number"
              className="w-full p-3 border rounded"
            />
            {errors.phone && <p className="text-red-600 text-sm">{errors.phone.message}</p>}

            <input
              {...register("email")}
              type="email"
              placeholder="Email (optional)"
              className="w-full p-3 border rounded"
            />
          </>
        )}

        {/* Step 2: Services */}
        {step === 1 && (
          <>
            {Object.entries(servicePriceMap).map(([category, services]) => (
              <div key={category} className="mb-4">
                <label className="font-semibold block mb-1">{category}</label>
                <select
                  {...register(`selections.${category as Category}`)}
                  className="w-full p-3 border rounded"
                  defaultValue=""
                >
                  <option value="">-- Select a service --</option>
                  {Object.entries(services).map(([service, price]) => (
                    <option key={service} value={service}>
                      {service} (₹{price})
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="text-right font-semibold text-lg mb-4">
              Total Price: <span className="text-blue-600">₹{totalPrice.toLocaleString()}</span>
            </div>

            <textarea
              {...register("notes")}
              placeholder="Additional Notes (optional)"
              className="w-full p-3 border rounded"
              rows={4}
            />
          </>
        )}

        {/* Step 3: CAPTCHA & Submit */}
        {step === 2 && (
          <div className="mb-6">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              onChange={(token) => setCaptchaToken(token)}
              ref={recaptchaRef}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 0}
            className={`px-6 py-2 rounded border ${step === 0
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-gray-700 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!captchaToken}
              className={`px-6 py-2 rounded text-white ${captchaToken ? "bg-black hover:bg-gray-800" : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              Submit & Open WhatsApp
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
