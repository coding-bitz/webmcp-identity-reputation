'use client';

import React from 'react';
import { DemoProduct } from '@/lib/types';
import { ShoppingBag, CheckCircle2, Zap } from 'lucide-react';

interface BusinessPlatformProps {
  products: DemoProduct[];
  isAuthenticated: boolean;
  agentName?: string;
  reputationScore?: number;
  onExecuteProductAction: (query: string) => void;
  isLoading: boolean;
}

export const BusinessPlatform: React.FC<BusinessPlatformProps> = ({
  products,
  agentName = 'Research Agent',
  reputationScore = 100,
  onExecuteProductAction,
  isLoading,
}) => {
  return (
    <section id="services" className="py-12 border-b border-rule bg-paper relative animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Post-Auth Status Banner */}
        <div className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent text-accent-ink font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-accent">
                <span className="font-bold">// SCREEN_4 · STOREFRONT</span>
                <span>·</span>
                <span>Access Granted</span>
              </div>
              <h4 className="text-base font-bold text-ink">
                Authenticated as {agentName} · Reputation: {reputationScore}/100
              </h4>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-paper-2 border border-rule font-mono text-xs text-ink-2">
            Status: <span className="text-accent font-semibold">Protected Catalog Unlocked</span>
          </div>
        </div>

        {/* Storefront Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-accent uppercase tracking-wider">
                // HARDWARE_CATALOG
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-paper-3 text-ink-2 border border-rule">
                WebMCP Autonomous Store
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Autonomous Systems &amp; Compute Hardware Store
            </h2>
            <p className="text-sm text-ink-2 mt-1 max-w-2xl">
              Commercial hardware modules, LiDAR sensors, and edge accelerators available for autonomous querying and ordering by authenticated AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <span>{products.length} Products Available</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-paper-2 rounded-xl border border-rule p-5 flex flex-col justify-between card-dark group relative"
            >
              <div>
                {/* Badge & SKU */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-paper-3 text-accent border border-accent/30 font-medium">
                    {product.badge || product.category}
                  </span>
                  <span className="text-[10px] font-mono text-ink-2">
                    {product.sku}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-ink-2 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Action */}
              <div className="mt-5 pt-4 border-t border-rule space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink font-bold text-base">{product.price}</span>
                  <span className="text-accent text-[11px]">In Stock</span>
                </div>

                <button
                  onClick={() => onExecuteProductAction(product.name)}
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-md bg-paper-3 hover:bg-accent hover:text-accent-ink border border-rule text-ink hover:border-transparent font-mono text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Query via WebMCP
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
