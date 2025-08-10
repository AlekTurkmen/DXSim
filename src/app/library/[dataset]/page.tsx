'use client';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card"
import { CaseModal } from "@/components/case-modal"
import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { useParams } from "next/navigation"
import { Case, CasesResponse, Dataset, DatasetsResponse, GroupedCases } from "@/lib/types"

// Dataset picker component
function DatasetPicker({ 
  currentDataset, 
  datasets, 
  onDatasetChange 
}: { 
  currentDataset: Dataset | null;
  datasets: Dataset[];
  onDatasetChange: (dataset: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <LiquidGlassCard
        className="bg-white/10 cursor-pointer hover:bg-white/15 transition-all duration-200"
        blurIntensity="sm"
        glowIntensity="xs"
        borderRadius="12px"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="px-3 md:px-4 py-2 md:py-3 flex items-center justify-between min-w-[180px] md:min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-sm md:text-base text-white font-medium">
              {currentDataset?.full_name || 'Select Dataset'}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-white transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </LiquidGlassCard>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full z-10">
          <LiquidGlassCard
            className="bg-white/10"
            blurIntensity="md"
            glowIntensity="sm"
            borderRadius="12px"
          >
            <div className="p-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="px-3 py-2 text-sm md:text-base text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
                  onClick={() => {
                    onDatasetChange(dataset.name);
                    setIsOpen(false);
                  }}
                >
                  {dataset.full_name}
                </div>
              ))}
              {datasets.length === 0 && (
                <div className="px-3 py-2 text-sm md:text-base text-white/50 cursor-not-allowed">
                  No datasets available
                </div>
              )}
            </div>
          </LiquidGlassCard>
        </div>
      )}
    </div>
  );
}

// Case card component
function CaseCard({ case: caseItem, onClick }: { case: Case; onClick: (caseItem: Case) => void }) {
  return (
    <LiquidGlassCard
      className="bg-white/10 hover:bg-white/15 transition-all duration-200 cursor-pointer group"
      blurIntensity="sm"
      glowIntensity="xs"
      borderRadius="16px"
      onClick={() => onClick(caseItem)}
    >
      <div className="p-3 md:p-4 h-full flex flex-col">
        {/* Short Title */}
        <div className="text-sm md:text-lg text-blue-300 font-mono mb-2 opacity-80">
          {caseItem.short_title}
        </div>
        
        {/* Title */}
        <div className="text-xs md:text-sm text-white leading-relaxed mb-3 flex-1 line-clamp-4">
          {caseItem.title}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
          <div className="text-xs text-gray-300">
            Released: {new Date(caseItem.date_added).toLocaleDateString()}
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>
    </LiquidGlassCard>
  );
}

// Year divider component
function YearDivider({ year }: { year: number }) {
  return (
    <div className="flex items-center gap-4 my-6 md:my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-white/30"></div>
      <LiquidGlassCard
        className="bg-white/20"
        blurIntensity="md"
        glowIntensity="sm"
        borderRadius="12px"
      >
        <div className="px-4 md:px-6 py-2">
          <span className="text-white font-bold text-base md:text-lg">{year}</span>
        </div>
      </LiquidGlassCard>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/30 to-white/30"></div>
    </div>
  );
}

export default function DatasetPage() {
  const params = useParams();
  const datasetName = params.dataset as string;
  
  const [cases, setCases] = useState<Case[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [groupedCases, setGroupedCases] = useState<GroupedCases>({});
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (datasetName) {
      loadCases(datasetName);
    }
  }, [datasetName]);

  useEffect(() => {
    if (datasets.length > 0 && datasetName) {
      const dataset = datasets.find(d => d.name === datasetName);
      setCurrentDataset(dataset || null);
    }
  }, [datasets, datasetName]);

  const loadDatasets = async () => {
    try {
      setIsLoadingDatasets(true);
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
      setIsLoadingDatasets(false);
    }
  };

  const loadCases = async (dataset: string) => {
    try {
      setIsLoadingCases(true);
      setError(null);
      const response = await fetch(`/api/cases?dataset=${encodeURIComponent(dataset)}`);
      const data: CasesResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setCases(data.cases);
        
        // Group by year
        const grouped = data.cases.reduce((acc: GroupedCases, caseItem) => {
          if (!acc[caseItem.year]) {
            acc[caseItem.year] = [];
          }
          acc[caseItem.year].push(caseItem);
          return acc;
        }, {});
        
        // Sort cases within each year reverse chronologically (latest first)
        Object.keys(grouped).forEach(year => {
          grouped[parseInt(year)].sort((a, b) => {
            const dateA = new Date(a.date_added).getTime();
            const dateB = new Date(b.date_added).getTime();
            return dateB - dateA; // Descending order (latest first)
          });
        });
        
        setGroupedCases(grouped);
      }
    } catch (err) {
      setError('Failed to load cases');
      console.error('Error loading cases:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleDatasetChange = (newDataset: string) => {
    // Navigate to the new dataset page
    window.location.href = `/library/${newDataset}`;
  };

  const handleCaseClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
  };

  const sortedYears = Object.keys(groupedCases)
    .map(Number)
    .sort((a, b) => b - a); // Newest first

  const isLoading = isLoadingCases || isLoadingDatasets;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden md:!mb-0 relative">
        {/* Fixed Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-200">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/library">
                    DXSim
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/library">
                    Library
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {currentDataset?.full_name || 'Dataset'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main
          className="absolute inset-0 top-16 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{
            backgroundImage: "url('/images/bg-library.jpg')",
            backgroundColor: 'black',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
          }}
        >
          <div className="p-4 md:p-6">
            {/* Header with Dataset Picker */}
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
                  {currentDataset?.full_name || 'Dataset Cases'}
                </h1>
                <p className="text-sm md:text-base text-gray-300">
                  {currentDataset?.description || 'Browse and explore clinical cases'}
                </p>
              </div>
              <DatasetPicker 
                currentDataset={currentDataset}
                datasets={datasets}
                onDatasetChange={handleDatasetChange}
              />
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
                    <p className="text-white">Loading cases...</p>
                  </div>
                </LiquidGlassCard>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex items-center justify-center py-12">
                <LiquidGlassCard
                  className="bg-red-500/20"
                  blurIntensity="md"
                  glowIntensity="sm"
                  borderRadius="16px"
                >
                  <div className="p-8 text-center">
                    <p className="text-white text-lg">Error loading cases</p>
                    <p className="text-gray-300 mt-2">{error}</p>
                    <button
                      onClick={() => loadCases(datasetName)}
                      className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </LiquidGlassCard>
              </div>
            )}

            {/* Cases Grid */}
            {!isLoading && !error && (
              <div className="space-y-8">
                {sortedYears.map(year => (
                  <div key={year}>
                    <YearDivider year={year} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                      {groupedCases[year].map((caseItem, index) => (
                        <CaseCard 
                          key={`${caseItem.id}-${index}`} 
                          case={caseItem} 
                          onClick={handleCaseClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && cases.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <LiquidGlassCard
                  className="bg-white/10"
                  blurIntensity="md"
                  glowIntensity="sm"
                  borderRadius="16px"
                >
                  <div className="p-8 text-center">
                    <p className="text-white text-lg">No cases found</p>
                    <p className="text-gray-300 mt-2">
                      This dataset doesn&apos;t have any cases yet
                    </p>
                  </div>
                </LiquidGlassCard>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
      
      {/* Case Modal */}
      <CaseModal 
        case={selectedCase}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </SidebarProvider>
  );
}
