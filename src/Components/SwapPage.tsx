import React from "react";
import optimism from "@/assets/optimism.svg";
import Image from "next/image";
const SwapPage = () => {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <div className="border border-white/20 rounded-2xl bg-[#17191a] h-[360px] w-[400px]  relative">
        <div className="border-4 border-black/80 rounded-2xl p-5 h-full w-full">
          <div className="bg-black rounded-2xl p-1.5 relative overflow-hidden grid-pattern">
            <div className="w-full h-full rounded-2xl  border border-[#84d46c] relative z-10 p-6 text-white">
              <div className="flex justify-end mb-2">Balance: 0.00 </div>
              <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 mb-3 text-white/95  flex gap-2 items-center ">
                Arbitrum
              </div>
              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="relative bg-black border border-white/10 rounded-full size-12 flex items-center justify-center z-10">
               
                  <Image src={optimism} alt="Main" className="size-7 z-10" />

                  <Image
                    src={optimism}
                    alt="Badge"
                    className="border-2 border-[#17191a] absolute right-1 bottom-1 rounded-full size-4 z-20"
                  />
                </div>
              </div>

              <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex gap-2 items-center ">
                0xbb4c2bab6b2de45f9c...
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -bottom-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            {/* Glow on bottom-left corner */}
          </div>
          <div className="mt-6 flex justify-center">
  <button className="px-8 py-2 rounded-full text-black font-semibold bg-gradient-to-br from-[#a4ef8f] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50">
    Connect Wallet
  </button>
</div>

        </div>
      </div>
    </div>
  );
};

export default SwapPage;
