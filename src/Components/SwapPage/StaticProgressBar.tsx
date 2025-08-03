"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StaticProgressBarProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const StaticProgressBar = ({ isVisible, onComplete }: StaticProgressBarProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps = [
    { id: 1, label: "Initializing Swap", description: "Setting up cross-chain connection" },
    { id: 2, label: "Creating Escrow", description: "Securing funds in smart contract" },
    { id: 3, label: "Processing Transaction", description: "Broadcasting to network" },
    { id: 4, label: "Validating", description: "Confirming transaction details" },
    { id: 5, label: "Complete", description: "Swap successfully processed" }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setIsCompleted(false);
      return;
    }

    // Progress through steps over 40 seconds (8 seconds per step)
    const stepInterval = setInterval(() => {
      setCurrentStep(prevStep => {
        if (prevStep < 5) {
          return prevStep + 1;
        } else {
          setIsCompleted(true);
          clearInterval(stepInterval);
          setTimeout(() => onComplete?.(), 500);
          return prevStep;
        }
      });
    }, 8000); // 8 seconds per step = 40 seconds total

    return () => clearInterval(stepInterval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-black border border-[#84d46c]/20 rounded-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          {isCompleted ? "Swap Completed!" : "Processing Swap..."}
        </h3>
        <p className="text-sm text-white/70">
          {isCompleted ? "Your cross-chain swap has been successfully processed" : "Please wait while we process your cross-chain swap"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all duration-500 ${
                  currentStep >= step.id
                    ? isCompleted && step.id === 5
                      ? "bg-[#84d46c] border-[#84d46c] text-black"
                      : "bg-[#84d46c] border-[#84d46c] text-black"
                    : "bg-black border-white/30 text-white/50"
                }`}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                  opacity: currentStep >= step.id ? 1 : 0.6,
                }}
                transition={{ duration: 0.3 }}
              >
                {currentStep > step.id || (isCompleted && step.id === 5) ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✓
                  </motion.div>
                ) : (
                  step.id
                )}
              </motion.div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <p className={`text-xs font-medium ${
                  currentStep >= step.id ? "text-white" : "text-white/50"
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-white/50 mt-1 max-w-20">
                  {step.description}
                </p>
              </div>

              {/* Loading Animation for Current Step */}
              {currentStep === step.id && !isCompleted && (
                <motion.div
                  className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-[#84d46c]/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-white/20 -z-10">
          <motion.div
            className="h-full bg-[#84d46c]"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Current Step Status */}
      <div className="text-center">
        {currentStep > 0 && currentStep <= steps.length && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-[#84d46c]/30"
          >
            <div className="flex items-center justify-center space-x-2">
              {!isCompleted && (
                <div className="w-4 h-4 border-2 border-[#84d46c] border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-sm font-medium text-white">
                {isCompleted ? "All steps completed successfully!" : steps[currentStep - 1]?.description}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Completion Animation */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-4"
        >
          <div className="inline-flex items-center space-x-2 bg-[#84d46c]/20 text-[#84d46c] border border-[#84d46c]/50 px-4 py-2 rounded-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              ✅
            </motion.div>
            <span className="font-medium">Swap Completed Successfully!</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StaticProgressBar;