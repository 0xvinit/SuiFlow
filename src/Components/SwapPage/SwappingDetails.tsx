import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface SwappingDetailsProps {
  convertedValue?: string;
  selectedToken2?: string;
  isLoading?: boolean;
  inputValue1?: string;
  selectedToken1?: string;
}

const SwappingDetails = ({ 
  convertedValue = "0", 
  selectedToken2 = "Token", 
  isLoading = false,
  inputValue1 = "0",
  selectedToken1 = "Token"
}: SwappingDetailsProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-black border border-[#84d46c]/20 grid-pattern h-auto w-[670px] mx-auto rounded-lg text-white">
      {/* Checkbox with confirmation message */}
      <div className="flex items-center justify-between gap-3 px-4 py-6">
      <div className="flex items-start gap-3 pr-4">
          <input
            type="checkbox"
            id="confirm"
            checked={isConfirmed}
            onChange={() => setIsConfirmed(!isConfirmed)}
            className="accent-[#84d46c] mt-3"
          />
          <label htmlFor="confirm" className="text-[23px] text-white/80">
            I confirm that I’ve reviewed the details and want to proceed with this swap.
          </label>
        </div>
         {/* Toggle Details Button */}
         <button
          className="text-[16px] text-[#84d46c] font-medium flex items-center gap-1 hover:underline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Details'}
          {showDetails ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </button>
      </div>

         {/* Animated Details Section */}
         <div
        className={`transition-all duration-300 ease-in-out mx-4 overflow-hidden rounded-lg border border-white/10 bg-[#17191a] ${
          showDetails ? 'max-h-[524px] opacity-100 p-4 mb-6' : 'max-h-0 opacity-0 p-0'
        }`}
      >
        <div className="grid grid-cols-2 gap-y-3 text-xl">
          <div className="text-white/60">Network Fee</div>
          <div className="text-right text-white/90">--</div>

          <div className="text-white/60">You&apos;ll Receive</div>
          <div className="text-right text-white/90">
            {isLoading ? (
              <span className="text-gray-400">Calculating...</span>
            ) : convertedValue && parseFloat(convertedValue) > 0 ? (
              `${convertedValue} ${selectedToken2}`
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>

          <div className="text-white/60">Exchange Rate</div>
          <div className="text-right text-white/90">
            {isLoading ? (
              <span className="text-gray-400">--</span>
            ) : convertedValue && inputValue1 && parseFloat(inputValue1) > 0 && parseFloat(convertedValue) > 0 ? (
              `1 ${selectedToken1} = ${(parseFloat(convertedValue) / parseFloat(inputValue1)).toFixed(6)} ${selectedToken2}`
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>

          <div className="text-white/60">Estimated Time</div>
          <div className="text-right text-white/90">~1 min</div>
        </div>
      </div>

      <button className='w-full py-3 bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 cursor-pointer rounded-b-lg uppercase text-black font-bold text-[28px]'>Swap</button>
    </div>
  );
};

export default SwappingDetails;
