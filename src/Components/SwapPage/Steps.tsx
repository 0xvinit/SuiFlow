"use client";
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiCheck, FiLoader, FiLock, FiShield, FiPackage, FiTrendingUp, FiGitBranch, FiCheckCircle, FiX, FiAlertTriangle } from 'react-icons/fi'

interface StepData {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

interface StepsProps {
  isSwapping?: boolean
  onSwapComplete?: () => void
  onSwapFailed?: () => void
  simulateFailure?: boolean
}

const Steps: React.FC<StepsProps> = ({ isSwapping = false, onSwapComplete, onSwapFailed, simulateFailure = false }) => {
  const [currentStep, setCurrentStep] = useState(4)
  const [completedSteps, setCompletedSteps] = useState<number[]>([0,1,2,3])
  const [failedSteps, setFailedSteps] = useState<number[]>([4])
  const [isExpanded, setIsExpanded] = useState(false)

  const stepData: StepData[] = [
    {
      id: 1,
      title: "Security & Verification",
      description: "Verifying your swap request and generating a secure lock to protect funds on both chains.",
      icon: <FiShield className="w-5 h-5" />,
      status: failedSteps.includes(0) ? 'failed' : currentStep === 0 ? 'in_progress' : completedSteps.includes(0) ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: "Order Preparation",
      description: "Wrapping tokens (if required) and creating a cross‑chain swap order using a Dutch auction for the best rate.",
      icon: <FiPackage className="w-5 h-5" />,
      status: failedSteps.includes(1) ? 'failed' : currentStep === 1 ? 'in_progress' : completedSteps.includes(1) ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: "Dutch Auction & Resolver Selection",
      description: "Resolvers compete in a Dutch auction to fill your order. Two resolvers have been selected for partial fills, ensuring faster execution.",
      icon: <FiTrendingUp className="w-5 h-5" />,
      status: failedSteps.includes(2) ? 'failed' : currentStep === 2 ? 'in_progress' : completedSteps.includes(2) ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: "Escrow Setup",
      description: "Funds are securely locked in escrow contracts on the source and destination chains for each resolver's portion of the swap.",
      icon: <FiLock className="w-5 h-5" />,
      status: failedSteps.includes(3) ? 'failed' : currentStep === 3 ? 'in_progress' : completedSteps.includes(3) ? 'completed' : 'pending'
    },
    {
      id: 5,
      title: "Cross‑Chain Execution",
      description: "Both resolvers finalize their parts of the swap across chains and verify the lock conditions.",
      icon: <FiGitBranch className="w-5 h-5" />,
      status: failedSteps.includes(4) ? 'failed' : currentStep === 4 ? 'in_progress' : completedSteps.includes(4) ? 'completed' : 'pending'
    },
    {
      id: 6,
      title: "Swap Completed",
      description: "Your cross‑chain swap is successful. All portions have been filled, and funds have been released to your wallet.",
      icon: <FiCheckCircle className="w-5 h-5" />,
      status: failedSteps.includes(5) ? 'failed' : currentStep === 5 ? 'in_progress' : completedSteps.includes(5) ? 'completed' : 'pending'
    }
  ]

  const simulateSwapProgress = () => {
    if (currentStep < stepData.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep])
      
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        
        if (currentStep === stepData.length - 2) {
          setTimeout(() => {
            setCompletedSteps(prev => [...prev, stepData.length - 1])
            onSwapComplete?.()
          }, 2000)
        }
      }, 2000)
    }
  }

  React.useEffect(() => {
    if (isSwapping && currentStep < stepData.length) {
      simulateSwapProgress()
    }
  }, [isSwapping, currentStep])

  const getStepIcon = (step: StepData) => {
    if (step.status === 'completed') {
      return <FiCheck className="w-5 h-5" />
    } else if (step.status === 'in_progress') {
      return <FiLoader className="w-5 h-5 animate-spin" />
    } else if (step.status === 'failed') {
      return <FiX className="w-5 h-5" />
    }
    return step.icon
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-[#84d46c] bg-[#84d46c]/20 text-[#84d46c]'
      case 'in_progress':
        return 'border-[#84d46c] bg-[#84d46c]/10 text-[#84d46c] animate-pulse'
      case 'failed':
        return 'border-red-500 bg-red-500/20 text-red-400'
      default:
        return 'border-white/20 bg-white/5 text-white/60'
    }
  }

  return (
    <div className="w-[864px] mx-auto">
      <div className="border border-white/20 rounded-2xl bg-[#17191a]">
        <div className="border-4 border-black/80 rounded-2xl p-6 h-full w-full">
          <div className="bg-black rounded-2xl p-1.5 relative grid-pattern">
            <div className="w-full h-full rounded-2xl border border-[#84d46c] relative p-6 text-white">
              <h2 className="text-3xl font-bold text-[#84d46c] mb-8 text-center">
                Cross-Chain Swap Progress
              </h2>
              
              {/* Compact Progress View */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-lg mb-4">
                  <span className="text-white/70">Overall Progress</span>
                  <span className={`font-semibold ${failedSteps.length > 0 ? 'text-red-400' : 'text-[#84d46c]'}`}>
                    {failedSteps.length > 0 ? 'Failed' : `${Math.round(((completedSteps.length + (currentStep < stepData.length ? 0.5 : 0)) / stepData.length) * 100)}%`}
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className={`h-full rounded-full ${
                      failedSteps.length > 0 
                        ? 'bg-gradient-to-r from-red-500 to-red-400' 
                        : 'bg-gradient-to-r from-[#84d46c] to-[#6bc252]'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: failedSteps.length > 0 
                        ? `${((completedSteps.length + failedSteps.length + (currentStep < stepData.length && currentStep >= 0 ? 0.5 : 0)) / stepData.length) * 100}%`
                        : `${((completedSteps.length + (currentStep < stepData.length && currentStep >= 0 ? 0.5 : 0)) / stepData.length) * 100}%`
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
                
                {/* Current Step Info */}
                {failedSteps.length > 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                    <motion.div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 bg-red-500/10 text-red-400"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >
                      <FiAlertTriangle className="w-4 h-4" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-400">
                        Failed: {stepData[failedSteps[0]]?.title}
                      </h4>
                      <p className="text-white/70 text-sm">
                        Step {failedSteps[0] + 1} of {stepData.length} failed
                      </p>
                    </div>
                  </div>
                ) : currentStep < stepData.length ? (
                  <div className="flex items-center gap-3 p-4 bg-[#84d46c]/5 rounded-lg border border-[#84d46c]/20">
                    <motion.div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#84d46c] bg-[#84d46c]/10 text-[#84d46c]"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <FiLoader className="w-4 h-4 animate-spin" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#84d46c]">
                        Currently: {stepData[currentStep]?.title}
                      </h4>
                      <p className="text-white/70 text-sm">
                        Step {currentStep + 1} of {stepData.length}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-[#84d46c]/5 rounded-lg border border-[#84d46c]/20">
                    <motion.div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#84d46c] bg-[#84d46c]/10 text-[#84d46c]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FiCheck className="w-4 h-4" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#84d46c]">
                        All Steps Completed!
                      </h4>
                      <p className="text-white/70 text-sm">
                        Cross-chain swap successful
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Button */}
              <div className="flex justify-center mb-6">
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#84d46c]/10 hover:bg-[#84d46c]/20 border border-[#84d46c]/30 rounded-lg text-[#84d46c] font-semibold transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isExpanded ? (
                    <>
                      <span>View Less</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        ↓
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <span>Show More</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        ↓
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* Detailed Steps View */}
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded ? "auto" : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
                className="overflow-hidden"
              >
                <div className="space-y-6 pt-6 border-t border-white/20">
                  {stepData.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -20 }}
                      transition={{ delay: isExpanded ? index * 0.1 : 0, duration: 0.3 }}
                      className="relative flex items-start gap-4"
                    >
                      {index < stepData.length - 1 && (
                        <div className="absolute left-[22px] top-[45px] w-px h-16 bg-gradient-to-b from-white/30 to-transparent" />
                      )}
                      
                      <motion.div
                        className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-300 ${getStepColor(step.status)}`}
                        animate={{
                          scale: step.status === 'in_progress' ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: step.status === 'in_progress' ? Infinity : 0,
                        }}
                      >
                        {getStepIcon(step)}
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <motion.div
                          className={`transition-all duration-300 ${
                            step.status === 'completed' ? 'text-[#84d46c]' : 
                            step.status === 'in_progress' ? 'text-white' : 
                            step.status === 'failed' ? 'text-red-400' : 'text-white/70'
                          }`}
                        >
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                            {step.title}
                            {step.status === 'completed' && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-[#84d46c]"
                              >
                                ✓
                              </motion.span>
                            )}
                            {step.status === 'failed' && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-red-400"
                              >
                                ✗
                              </motion.span>
                            )}
                            {step.status === 'in_progress' && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-[#84d46c] border-t-transparent rounded-full"
                              />
                            )}
                          </h3>
                          <p className={`text-lg leading-relaxed ${
                            step.status === 'in_progress' ? 'text-white/90' : 
                            step.status === 'failed' ? 'text-red-300/80' : 'text-white/60'
                          }`}>
                            {step.description}
                          </p>
                        </motion.div>
                        
                        {step.status === 'in_progress' && (
                          <motion.div
                            className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              className="h-full bg-[#84d46c] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 2, ease: "easeInOut" }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Steps

