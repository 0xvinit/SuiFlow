"use client";
import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import OneInchLogo from '@/assets/Images/1inch.svg'

const PoweredBy1inch: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex items-center justify-center mt-12"
    >
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
        <span className="text-white/70 text-lg font-medium">
          Powered by
        </span>
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Image
              src={OneInchLogo}
              alt="1inch"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </motion.div>
          <div>
            <motion.span
              className="text-white text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              1inch Fusion+
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PoweredBy1inch