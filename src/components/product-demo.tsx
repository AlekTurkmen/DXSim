import { DotPattern } from "@/components/magicui/dot-pattern";

export default function ProductDemo() {
  return (
    <section id="demo" className="relative w-full py-16 md:py-16 lg:py-16">
      {/* Background pattern */}
      <DotPattern className="text-neutral-200" width={20} height={20} cr={1} />

      {/* Foreground container */}
      <div className="relative mx-auto max-w-[1100px] px-6">
        <div className="rounded-xl border bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="grid min-h-[750px] place-items-center text-sm text-neutral-500">
            Product demo placeholder
          </div>
        </div>
      </div>
    </section>
  );
}


