"use client";

import Link from "next/link";
import { GL } from "./gl";
import { Pill } from "./pill";
import { Button } from "./ui/button";
import { useState } from "react";

export function Hero() {
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">COMPANY EXPENSE TRACKER</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Simplify <br />
          <i className="font-light">Expense Management</i>
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          Track, approve, and manage company expenses with ease. Empower employees, managers, and admins with a seamless workflow for submitting, reviewing, and approving expenses.
        </p>

        <Link className="contents max-sm:hidden" href="/auth/login">
          <Button
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            Get Started
          </Button>
        </Link>
        <Link className="contents sm:hidden" href="/auth/login">
          <Button
            size="sm"
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
