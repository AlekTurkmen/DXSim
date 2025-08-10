import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card"

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden md:!mb-0 relative">
        <PageHeader 
          breadcrumbs={[
            { label: "DXSim", href: "/dashboard" },
            { label: "Dashboard", isCurrentPage: true }
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
          <div className="p-6 h-full flex items-center justify-center">
            <div className="mx-auto max-w-2xl">
              <LiquidGlassCard
                className="p-12 bg-white/10 text-center"
                blurIntensity="md"
                glowIntensity="lg"
                borderRadius="24px"
              >
                <div className="space-y-6">
                  <div className="text-6xl mb-4">🚧</div>
                  <h1 className="text-4xl font-bold text-white mb-4">
                    Coming Soon
                  </h1>
                  <p className="text-xl text-gray-200 leading-relaxed">
                    Check out the{" "}
                    <Link 
                      href="/library" 
                      className="text-white hover:text-blue-200 underline transition-colors"
                    >
                      library
                    </Link> in the meantime.
                  </p>
                </div>
              </LiquidGlassCard>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
