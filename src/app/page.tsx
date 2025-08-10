import Hero from "@/components/hero";
import ProductDemo from "@/components/product-demo";

export default function Home() {
  return (
    <main className="flex flex-col">      
      <Hero />
      <ProductDemo />
      <section id="bento-grid" className="mx-auto max-w-[920px] px-6 py-20">
        <h2 className="text-lg font-semibold text-neutral-900">Bento Grid Feature Section</h2>
        <p className="mt-2 text-sm text-neutral-600">Coming soon.</p>
      </section>
    </main>
  );
}
