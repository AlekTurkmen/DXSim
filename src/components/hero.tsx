export default function Hero() {
  return (
    <section
      id="hero"
      className="w-full -mt-[88px] pt-[88px] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-b after:from-transparent after:to-white after:pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, #F2FCFF 0%, #FFFFFF 20%, #FFFFFF 80%, #F2FCFF 100%)",
      }}
    >
      <div className="mx-auto max-w-[920px] px-6 pt-16 md:pt-28 pb-10 md:pb-16 lg:pt-56 lg:pb-40">
        <div className="text-center">
          <h1 className="font-title text-5xl tracking-tight text-neutral-900 md:text-7xl leading-tight md:leading-tight">
            The diagnostic simulator for <br /> medical professionals.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-gray-500 md:text-xl leading-relaxed pt-4">
            We simulate dynamic clinical reasoning through a SOTA sequential diagnostic simulator.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <a
              href="/chat"
              className="rounded-sm bg-black px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
            >
              Try DXSim!
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


