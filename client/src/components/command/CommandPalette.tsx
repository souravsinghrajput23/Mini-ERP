import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../context/UIContext';
import { api } from '../../api/endpoints';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Package, FileText, ArrowRight, X, Loader2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, closeCommandPalette } = useUI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = (await api.search.query(query)) as any;
        if (res.data) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const handleSelect = (link: string) => {
    closeCommandPalette();
    navigate(link);
  };

  const hasResults =
    results &&
    (results.customers?.length > 0 ||
      results.products?.length > 0 ||
      results.challans?.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-[12vh]">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={closeCommandPalette}
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up flex flex-col">
        {/* Search Input Bar */}
        <div className="relative flex items-center p-4 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, products, SKUs, mobile numbers, challans..."
            className="w-full bg-transparent border-0 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0 mr-2" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="p-6 text-center text-slate-500 text-xs">
              <p>Type anything to search across the entire FlowLedger ERP database.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] border border-slate-700/50">
                  Try: "Bharat Heavy"
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] border border-slate-700/50">
                  Try: "SKU-HDW"
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] border border-slate-700/50">
                  Try: "SC-2026"
                </span>
              </div>
            </div>
          )}

          {query && !isLoading && !hasResults && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No records found matching "<span className="text-indigo-400 font-semibold">{query}</span>".
            </div>
          )}

          {/* Customers Section */}
          {results?.customers?.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Customers ({results.customers.length})
              </div>
              <div className="space-y-1 mt-1">
                {results.customers.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left group border border-transparent hover:border-slate-700/50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                        {c.title}
                        <Badge variant="indigo" size="sm">
                          {c.badge}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results?.products?.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                Products & Inventory ({results.products.length})
              </div>
              <div className="space-y-1 mt-1">
                {results.products.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left group border border-transparent hover:border-slate-700/50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {p.title}
                        <Badge variant="slate" size="sm">
                          {p.badge}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Challans Section */}
          {results?.challans?.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Sales Challans ({results.challans.length})
              </div>
              <div className="space-y-1 mt-1">
                {results.challans.map((ch: any) => (
                  <button
                    key={ch.id}
                    onClick={() => handleSelect(ch.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left group border border-transparent hover:border-slate-700/50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors flex items-center gap-2 font-mono">
                        {ch.title}
                        <Badge
                          variant={
                            ch.badge === 'CONFIRMED'
                              ? 'emerald'
                              : ch.badge === 'DRAFT'
                              ? 'amber'
                              : 'rose'
                          }
                          size="sm"
                        >
                          {ch.badge}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{ch.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Enter</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">N</kbd> New Challan
            </span>
          </div>
          <span>FlowLedger Smart Operations</span>
        </div>
      </div>
    </div>
  );
};
