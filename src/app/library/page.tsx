'use client';
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle, FileQuestionMark } from "lucide-react"
import { useState, useEffect } from "react"
import { Dataset, DatasetsResponse } from "@/lib/types"

// Type definition for case libraries
interface CaseLibrary {
  id: string;
  name: string;
  caseCount: number;
  yearRange: string;
  isAvailable: boolean;
  url: string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

// Library card component
function LibraryCard({ library }: { library: CaseLibrary }) {
  const CardWrapper = library.isAvailable ? Link : 'div';
  
  return (
    <CardWrapper 
      href={library.isAvailable ? library.url : '#'}
      className={`block ${!library.isAvailable ? 'cursor-not-allowed' : ''}`}
    >
      <LiquidGlassCard
        className={`${library.color} ${
          library.isAvailable 
            ? 'hover:bg-white/15 cursor-pointer' 
            : 'opacity-60 cursor-not-allowed'
        } transition-all duration-200 h-full`}
        blurIntensity="sm"
        glowIntensity={library.isAvailable ? "xs" : "none"}
        borderRadius="20px"
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="text-white">
              {library.icon}
            </div>
            {library.isAvailable && (
              <CheckCircle className="h-5 w-5 text-green-400" />
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-4 leading-tight">
            {library.name}
          </h3>
          
          {/* Description */}
          {library.description && (
            <p className="text-gray-300 text-sm mb-4 flex-1">
              {library.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Cases</span>
              <span className="text-white font-medium">
                {library.isAvailable ? library.caseCount.toLocaleString() : 'Coming Soon'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Years</span>
              <span className="text-white font-medium">{library.yearRange}</span>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </CardWrapper>
  );
}

export default function LibraryPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/datasets');
      const data: DatasetsResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setDatasets(data.datasets);
      }
    } catch (err) {
      setError('Failed to load datasets');
      console.error('Error loading datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform datasets into case libraries
  const getCaseLibraries = (): CaseLibrary[] => {
    const libraries: CaseLibrary[] = datasets.map(dataset => ({
      id: dataset.name,
      name: dataset.full_name,
      caseCount: dataset.total_cases,
      yearRange: dataset.year_range,
      isAvailable: true,
      url: `/library/${dataset.name}`,
      icon: getDatasetIcon(dataset.name),
      color: getDatasetColor(dataset.name),
      description: dataset.description
    }));

    // Add "Coming Soon" placeholder if needed
    if (libraries.length === 0 || libraries.length < 3) {
      libraries.push({
        id: "coming-soon",
        name: "More Datasets Coming Soon",
        caseCount: 0,
        yearRange: "",
        isAvailable: false,
        url: "#",
        icon: <FileQuestionMark className="h-8 w-8" />,
        color: "bg-gray-300/20"
      });
    }

    return libraries;
  };

  // Helper functions for dataset styling
  const getDatasetIcon = (name: string) => {
    switch (name) {
      case 'nejm':
        return <Image src="/images/nejm-logo.svg" alt="NEJM Logo" width={32} height={32} />;
      default:
        return <FileQuestionMark className="h-8 w-8" />;
    }
  };

  const getDatasetColor = (name: string) => {
    switch (name) {
      case 'nejm':
        return 'bg-blue-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden md:!mb-0 relative">
        <PageHeader 
          breadcrumbs={[
            { label: "DXSim", href: "/library" },
            { label: "Library", isCurrentPage: true }
          ]} 
        />
        
        {/* Main Content Area */}
        <main
          className="absolute inset-0 top-16 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{
            height: '100%',
            background: 'linear-gradient(to bottom, rgb(124, 171, 214) 0%, rgb(125, 171, 215) 3.23%, rgb(126, 172, 215) 6.45%, rgb(126, 173, 215) 9.68%, rgb(127, 173, 216) 12.9%, rgb(128, 174, 216) 16.13%, rgb(129, 175, 216) 19.35%, rgb(130, 176, 217) 22.58%, rgb(132, 177, 217) 25.81%, rgb(133, 178, 218) 29.03%, rgb(135, 180, 218) 32.26%, rgb(136, 181, 219) 35.48%, rgb(138, 182, 220) 38.71%, rgb(140, 184, 220) 41.94%, rgb(143, 186, 221) 45.16%, rgb(145, 188, 222) 48.39%, rgb(148, 190, 223) 51.61%, rgb(151, 192, 224) 54.84%, rgb(154, 195, 224) 58.06%, rgb(158, 197, 225) 61.29%, rgb(162, 200, 227) 64.52%, rgb(167, 203, 228) 67.74%, rgb(172, 206, 229) 70.97%, rgb(177, 210, 230) 74.19%, rgb(183, 213, 231) 77.42%, rgb(190, 217, 232) 80.65%, rgb(197, 220, 233) 83.87%, rgb(204, 224, 233) 87.1%, rgb(212, 228, 234) 90.32%, rgb(219, 230, 233) 93.55%, rgb(225, 232, 232) 96.77%, rgb(228, 231, 230) 100%)',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">Library</h1>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <LiquidGlassCard
                  className="bg-white/10"
                  blurIntensity="md"
                  glowIntensity="sm"
                  borderRadius="16px"
                >
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading datasets...</p>
                  </div>
                </LiquidGlassCard>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-12">
                <LiquidGlassCard
                  className="bg-red-500/20"
                  blurIntensity="md"
                  glowIntensity="sm"
                  borderRadius="16px"
                >
                  <div className="p-8 text-center">
                    <p className="text-white text-lg">Error loading datasets</p>
                    <p className="text-gray-300 mt-2">{error}</p>
                    <button
                      onClick={loadDatasets}
                      className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </LiquidGlassCard>
              </div>
            )}

            {/* Libraries Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
                {getCaseLibraries().map((library) => (
                  <LibraryCard key={library.id} library={library} />
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}