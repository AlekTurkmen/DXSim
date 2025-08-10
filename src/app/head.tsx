export default function Head() {
  return (
    <>
      <link rel="icon" href="/assets/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
      <link rel="manifest" href="/assets/site.webmanifest" />
      <link rel="mask-icon" href="/assets/safari-pinned-tab.svg" color="#000000" />
      <meta name="theme-color" content="#ffffff" />
      {/* Explicit OG/Twitter tags for crawlers that don't parse Next metadata quickly */}
      <meta property="og:title" content="DXSim - The Diagnostic Simulator for Medical Professionals" />
      <meta
        property="og:description"
        content="We simulate dynamic clinical reasoning through a SOTA sequantial diagnostic simulator."
      />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/assets/og-image.jpg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="DXSim – The diagnostic simulator for medical professionals." />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="/assets/og-image.jpg" />
    </>
  );
}


