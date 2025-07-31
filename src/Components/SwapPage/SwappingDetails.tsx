import React, { useState } from 'react';

const SwappingDetails = () => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <div className="bg-black border border-[#84d46c]/20 grid-pattern h-auto w-[600px] mx-auto rounded-lg text-white space-y-4">
      {/* Checkbox with confirmation message */}
      <div className="flex items-start gap-3 p-4">
        <input
          type="checkbox"
          id="confirm"
          checked={isConfirmed}
          onChange={() => setIsConfirmed(!isConfirmed)}
          className="accent-[#84d46c] mt-1"
        />
        <label htmlFor="confirm" className="text-sm text-white/80">
          I confirm that I’ve reviewed the details and want to proceed with this swap.
        </label>
      </div>

      {/* Details section */}
      <div className="bg-[#17191a] opacity-70 rounded-lg p-4 mx-4 border border-white/10">
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div className="text-white/60">Network Fee</div>
          {/* <div className="text-right text-white/90">$2.13</div> */}
          <div className="text-right text-white/90">--</div>

          <div className="text-white/60">You’ll Receive</div>
          <div className="text-right text-white/90">98.5 USDC</div>

          <div className="text-white/60">Estimated Time</div>
          <div className="text-right text-white/90">~1 min</div>

          <div className="text-white/60">Price Impact</div>
          <div className="text-right text-white/90">0.23%</div>
        </div>
      </div>

      <button className='w-full py-4 bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 cursor-pointer rounded-b-lg  text-black'>Swap</button>
    </div>
  );
};

export default SwappingDetails;
