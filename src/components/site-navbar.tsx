"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";

export function SiteNavbar({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const items = [
    { name: "Chat", link: "/chat" },
    { name: "Pricing", link: "/stripe" }
  ];

  // Prevent hydration mismatch by only rendering after client mount
  if (!isMounted) {
    return (
      <div className={cn("w-full", className)}>
        {/* Fallback content that matches server rendering */}
        <div className="fixed top-6 z-50 w-full">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center text-sm font-medium text-black lg:text-xl"
              >
                <Image
                  src="/assets/favicon.ico"
                  alt="DXSim Logo"
                  className="mr-2 h-6 w-6 lg:h-8 lg:w-8"
                  width={32}
                  height={32}
                />
                DXSim
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop */}
      <Navbar className="!fixed top-6 z-50">
        <NavBody className="max-w-5xl">
          <Link
            href="/"
            className="relative z-20 mr-4 flex items-center px-2 py-1 text-sm font-medium text-black lg:text-xl"
          >
            <Image
              src="/assets/favicon.ico"
              alt="DXSim Logo"
              className="mr-2 h-6 w-6 lg:h-8 lg:w-8"
              width={32}
              height={32}
            />
            DXSim
          </Link>

          <NavItems items={items} className="lg:text-base xl:text-lg" />

          <NavbarButton
            href="https://cal.com/alek-turkmen/dxsim-demo"
            className="rounded-sm px-4 py-2 lg:text-base"
            variant="dark"
            target="_blank"
          >
            Book A Demo
          </NavbarButton>
        </NavBody>
      </Navbar>

      {/* Mobile */}
      <MobileNav visible className="px-4">
        <MobileNavHeader>
          <Link href="/" className="text-sm font-medium text-black">
            DXSim
          </Link>
          <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={isOpen}>
          <nav className="flex w-full flex-col gap-2">
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.name}
              </Link>
            ))}
            <NavbarButton
              href="https://cal.com/alek-turkmen/dxsim-demo"
              className="mt-2 rounded-sm px-4 py-2"
              variant="dark"
            >
              Book A Demo
            </NavbarButton>
          </nav>
        </MobileNavMenu>
      </MobileNav>
    </div>
  );
}

export default SiteNavbar;


