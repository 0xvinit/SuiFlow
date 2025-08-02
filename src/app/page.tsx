"use client";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import SwapPage from "@/Components/SwapPage/SwapPage";
import Footer from "@/Components/SwapPage/Footer";
import "../Styles/fonts.module.css";
import styles from "@/Styles/gradientAnimations.module.css";
import Navbar from "@/Components/Navbar/Navbar";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientOrbRef = useRef<HTMLDivElement>(null);
  // const secondaryOrbRef = useRef<HTMLDivElement>(null);
  // const tertiaryOrbRef = useRef<HTMLDivElement>(null);

  // Handle mouse movement for gradient animation using GSAP
  useEffect(() => {
    const container = containerRef.current;
    const gradientOrb = gradientOrbRef.current;
    // const secondaryOrb = secondaryOrbRef.current;
    // const tertiaryOrb = tertiaryOrbRef.current;

    if (!container || !gradientOrb) return;

    // Initial animation for static orbs
    gsap.set([gradientOrb], {
      x: 0,
      y: 0,
    });

    // Animate static background orbs
    const staticOrbs = container.querySelectorAll(".static-orb");
    staticOrbs.forEach((orb, index) => {
      gsap.to(orb, {
        y: -20 + index * 10,
        opacity: 0.3,
        duration: 3 + index,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;


      // Animate primary gradient orb
      gsap.to(gradientOrb, {
        x: x - 150,
        y: y - 150,
        duration: 0.5,
        ease: "power2.out",
        immediateRender: false,
      });

      // Animate secondary gradient orb with offset
      // gsap.to(secondaryOrb, {
      //   x: x + 120,
      //   y: y - 90,
      //   duration: 0.7,
      //   ease: "power2.out",
      //   immediateRender: false,
      // });

      // Animate tertiary gradient orb with different offset
      // gsap.to(tertiaryOrb, {
      //   x: x - 60,
      //   y: y + 150,
      //   duration: 0.6,
      //   ease: "power2.out",
      //   immediateRender: false,
      // });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="font-vt323 tracking-wider min-h-screen relative overflow-hidden backdrop-blur-md"
    >
      <Navbar />
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#84d46c]/10 via-transparent to-[#84d46c]/5" />

        {/* Animated gradient orbs that follow cursor */}
        <div
          ref={gradientOrbRef}
          className="absolute w-[200px] h-[200px] bg-[#84d46c] blur-3xl opacity-15 rounded-full"
          style={{
            left: 0,
            top: 0,
          }}
        />

        {/* Secondary gradient orb with offset */}
        {/* <div
          ref={secondaryOrbRef}
          className="absolute w-[250px] h-[250px] bg-[#84d46c] blur-2xl opacity-12 rounded-full"
          style={{
            left: 0,
            top: 0,
          }}
        /> */}

        {/* Tertiary gradient orb with different color */}
        {/* <div
          ref={tertiaryOrbRef}
          className="absolute w-[280px] h-[280px] bg-[#4ade80] blur-2xl opacity-10 rounded-full"
          style={{
            left: 0,
            top: 0,
          }}
        /> */}

        {/* Static background gradients for depth */}
        <div className="static-orb absolute -bottom-32 -left-32 w-[200px] h-[200px] bg-[#84d46c] blur-3xl opacity-10 rounded-full" />
        <div className="static-orb absolute -top-32 -right-32 w-[150px] h-[150px] bg-[#4ade80] blur-3xl opacity-8 rounded-full" />
        <div className="static-orb absolute top-1/2 -left-16 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-6 rounded-full" />
        <div className="static-orb absolute top-1/3 -right-16 w-[130px] h-[130px] bg-[#4ade80] blur-2xl opacity-7 rounded-full" />
      </div>

      <div className="relative z-10">
        <SwapPage />
      </div>
      <Footer />
    </div>
  );
}
