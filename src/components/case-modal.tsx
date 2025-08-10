'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { Button } from "@/components/ui/button";
import { Case } from "@/lib/types";
import { Calendar, ExternalLink, X } from "lucide-react";

interface CaseModalProps {
  case: Case | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CaseModal({ case: caseItem, isOpen, onClose }: CaseModalProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  if (!caseItem) return null;

  const handleStartCase = async () => {
    setIsStarting(true);
    try {
      // Navigate to chat with case ID parameter
      router.push(`/chat?case=${encodeURIComponent(caseItem.id)}`);
    } catch (error) {
      console.error('Error starting case:', error);
      setIsStarting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[80vh] bg-transparent border-none p-6"
        style={{
          backgroundImage: "url('/images/bg-library.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="mx-auto max-w-2xl">
          <LiquidGlassCard
            className="bg-white/15 border border-white/20"
            blurIntensity="lg"
            glowIntensity="md"
            borderRadius="24px"
          >
            <div className="p-8">
              <SheetHeader className="p-0 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-2xl font-bold text-white mb-2">
                      {caseItem.title}
                    </SheetTitle>
                    <div className="flex items-center gap-4 text-sm text-blue-200">
                      <span className="font-mono bg-blue-500/20 px-3 py-1 rounded-full">
                        {caseItem.short_title}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(caseItem.date_added).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <button className="text-white/60 hover:text-white transition-colors p-2">
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>
              </SheetHeader>

              {/* Case Metadata */}
              <div className="space-y-6">
                {/* Clinical Vignette Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Clinical Vignette</h3>
                  <LiquidGlassCard
                    className="bg-white/10"
                    blurIntensity="sm"
                    glowIntensity="xs"
                    borderRadius="16px"
                  >
                    <div className="p-4">
                      <p className="text-gray-100 leading-relaxed line-clamp-4">
                        {caseItem.clinical_vignette || "Clinical vignette will be revealed when you start the case."}
                      </p>
                    </div>
                  </LiquidGlassCard>
                </div>

                {/* Case Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Case Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LiquidGlassCard
                      className="bg-white/10"
                      blurIntensity="sm"
                      glowIntensity="xs"
                      borderRadius="12px"
                    >
                      <div className="p-4">
                        <div className="text-sm text-gray-300 mb-1">Year</div>
                        <div className="text-white font-medium">{caseItem.year}</div>
                      </div>
                    </LiquidGlassCard>
                    
                    <LiquidGlassCard
                      className="bg-white/10"
                      blurIntensity="sm"
                      glowIntensity="xs"
                      borderRadius="12px"
                    >
                      <div className="p-4">
                        <div className="text-sm text-gray-300 mb-1">Dataset</div>
                        <div className="text-white font-medium capitalize">{caseItem.dataset}</div>
                      </div>
                    </LiquidGlassCard>
                  </div>
                  
                  {caseItem.doi && (
                    <LiquidGlassCard
                      className="bg-white/10 mt-4"
                      blurIntensity="sm"
                      glowIntensity="xs"
                      borderRadius="12px"
                    >
                      <div className="p-4">
                        <div className="text-sm text-gray-300 mb-2">DOI</div>
                        <a 
                          href={`https://doi.org/${caseItem.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
                        >
                          {caseItem.doi}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </LiquidGlassCard>
                  )}
                </div>

                {/* Start Case Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleStartCase}
                    disabled={isStarting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-200 disabled:opacity-60"
                  >
                    {isStarting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Starting Case...
                      </div>
                    ) : (
                      'Start Case'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        </div>
      </SheetContent>
    </Sheet>
  );
}
