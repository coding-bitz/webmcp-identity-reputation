'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-ink">
                WebMCP Identity Passport
              </span>
              <span className="text-rule">|</span>
              <span className="text-xs text-ink-2 font-mono">
                Email OTP Verified Trust &amp; Reputation Layer
              </span>
            </div>
          </div>

          {/* Status & Copyright */}
          <div className="flex items-center gap-4 font-mono text-xs text-ink-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-ink">WebMCP Context Active</span>
            </div>
            <span className="text-rule hidden sm:inline">|</span>
            <p className="text-ink-2 hidden sm:inline">© 2026 WebMCP Standards</p>
          </div>

        </div>
      </div>
    </footer>
  );
};
