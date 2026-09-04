'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, RotateCcw, Terminal } from 'lucide-react';

interface NavbarProps {
  webMcpAvailable: boolean;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ webMcpAvailable, onResetDemo, isResetting }) => {
  const pathname = usePathname();
  const isDebug = pathname === '/debug';

  return (
    <header className="sticky top-0 z-50 w-full bg-paper/90 backdrop-blur-md border-b border-rule">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-sm group-hover:border-accent transition-colors">
            <Shield className="w-5 h-5 text-accent" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-ink group-hover:text-accent transition-colors">
                WebMCP Identity and Reputation Layer
              </span>
            </div>
            <p className="text-xs text-ink-2 font-mono hidden sm:block">
              Email OTP Verified Trust &amp; Reputation Layer
            </p>
          </div>
        </Link>

        {/* Right: Debug Link, WebMCP Status & Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Debug Route Link */}
          <Link
            href={isDebug ? '/' : '/debug'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
              isDebug
                ? 'bg-accent/15 border-accent/40 text-accent font-semibold'
                : 'bg-paper-2 border-rule text-ink-2 hover:text-ink hover:bg-paper-3'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isDebug ? 'Main Demo Flow' : 'Debug / Inspector'}</span>
          </Link>

          {/* WebMCP Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-paper-2 border border-rule text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                webMcpAvailable ? 'bg-accent animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-ink-2 hidden sm:inline">WebMCP:</span>
            <span className={webMcpAvailable ? 'text-accent font-medium' : 'text-amber-400 font-medium'}>
              {webMcpAvailable ? 'Active' : 'Ready'}
            </span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset store & reputation to initial demo state"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md bg-paper-3 border border-rule hover:border-accent/40 text-ink-2 hover:text-ink transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
