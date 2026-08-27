"use client";

import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { GooglePlayButton } from "@/components/marketing/store-badges";

export function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Soft gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[700px] h-[560px] bg-primary-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[8%] w-[420px] h-[420px] bg-primary-300/25 rounded-full blur-3xl" />
        <div className="absolute top-[5%] right-[-8%] w-[500px] h-[500px] bg-amber-200/25 rounded-full blur-3xl" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,#000_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle,#d4d4d8 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.05fr] items-center gap-16 lg:gap-10">
          {/* Left — headline, copy, CTAs, trust bar */}
          <div className="text-center lg:text-left">
            <FadeIn delay={0}>
              <Badge className="mb-6 h-auto bg-white text-primary-700 border border-zinc-200 shadow-sm px-4 py-1.5 text-sm gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Best School Management System
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 leading-[1.05] tracking-tight text-balance">
                The modern school management system{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">
                  for the way schools actually run
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-lg sm:text-xl text-zinc-500 max-w-lg mx-auto lg:mx-0 leading-relaxed text-balance">
                Shikshaloy is an all-in-one school management software and school
                app — admissions, attendance, fees, exams, and communication for
                admins, teachers, students, and parents.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <FancyButton href="/signup" size="lg">
                  Start your free trial
                  <ArrowUpRightIcon className="size-5" />
                </FancyButton>
                <FancyButton href="/demo" variant="white" size="lg" className="group">
                  <Play className="h-4 w-4 fill-current" />
                  Try Live Demo
                </FancyButton>
                <GooglePlayButton />
              </div>
            </FadeIn>
          </div>

          {/* Right — dashboard preview: laptop mockup */}
          <FadeIn delay={0.3} direction="left" className="relative">
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary-300/30 blur-2xl rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home-hero-preview.png"
              alt="Shikshaloy dashboard on a laptop"
              className="relative w-full h-auto select-none pointer-events-none"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
