import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const SwappingDetails = () => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-black border border-[#84d46c]/20 grid-pattern h-auto w-[670px] mx-auto rounded-lg text-white">
      {/* Checkbox with confirmation message */}
      <div className="flex items-center justify-between gap-3 px-4 py-6">
      <div className="flex items-center gap-3 pr-4">
          <input
            type="checkbox"
            id="confirm"
            checked={isConfirmed}
            onChange={() => setIsConfirmed(!isConfirmed)}
            className="accent-[#84d46c] mt-1"
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

          <div className="text-white/60">You’ll Receive</div>
          <div className="text-right text-white/90">98.5 USDC</div>

          <div className="text-white/60">Estimated Time</div>
          <div className="text-right text-white/90">~1 min</div>

          <div className="text-white/60">Price Impact</div>
          <div className="text-right text-white/90">0.23%</div>
        </div>
      </div>

      <button className='w-full py-3 bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 cursor-pointer rounded-b-lg uppercase text-black font-bold text-[28px]'>Swap</button>
    </div>
  );
};

export default SwappingDetails;
