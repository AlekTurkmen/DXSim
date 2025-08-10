'use client';

import { LiquidGlassCard } from '@/components/ui/liquid-glass-card';

// Sample conversation data
const conversation = [
  {
    role: "Gatekeeper Agent",
    message: "A 29-year-old woman was admitted to the hospital because of sore throat and peritonsillar swelling and bleeding. Symptoms did not abate with antimicrobial therapy."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Could you describe in detail how and when your sore throat and peritonsillar swelling began, including any associated bleeding episodes, pain severity, and whether symptoms have changed over time?"
  },
  {
    role: "Gatekeeper Agent",
    message: "She reported that approximately 7 weeks before admission she first noted a mild sore throat, which persisted despite rest and fluids and did not improve with azithromycin. Over the next days the pain worsened, interfering with sleep, and she developed right-sided throat swelling and a sensation of food sticking when swallowing. Thirty-one days before admission, drainage yielded only sanguineous fluid without purulence. Despite amoxicillin–clavulanate, symptoms waxed and waned; 2 weeks before admission pain and swelling decreased, but 8 days before admission she noted a “froggy” voice and intermittent bleeding. Four days before admission, aspiration yielded dark blood. On the morning of admission, she awoke with increased pain and swelling, felt a “pop,” and noted active bleeding, prompting evaluation."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Have you experienced fevers, night sweats, unintentional weight loss, fatigue, or any other systemic symptoms during these seven weeks?"
  },
  {
    role: "Gatekeeper Agent",
    message: "The patient reported fatigue but denied fevers, night sweats, or unintentional weight loss. She noted easy bruising and heavy menstrual bleeding."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Please list every prescription medication, over-the-counter drug, herbal product, and supplement you have taken in the past three months, including start dates, doses, and any recent changes or stops."
  },
  {
    role: "Gatekeeper Agent",
    message: "Current outpatient medications: clindamycin, oral vitamin K, oral aminocaproic acid, levonorgestrel-releasing intrauterine device."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Do you or any relatives have a known history of bleeding disorders (such as von Willebrand disease, hemophilia, platelet disorders) or episodes of excessive bleeding with surgery, dental work, or childbirth?"
  },
  {
    role: "Gatekeeper Agent",
    message: "No known personal or family history of bleeding disorders. No excessive bleeding with surgery, dental work, or childbirth."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Have you ever been diagnosed with any autoimmune conditions (e.g., thyroid disease, lupus, rheumatoid arthritis), malignancies, or recent pregnancies, and have you noticed any new rashes, joint pains, or other unusual symptoms?"
  },
  {
    role: "Gatekeeper Agent",
    message: "No history of autoimmune disease (including thyroid disease, lupus, or rheumatoid arthritis), no prior malignancies, and no history of pregnancy. Denies any new rashes, joint pains, or other unusual symptoms."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Do you consume alcohol, smoke tobacco, or use recreational drugs? If so, please specify type, quantity, and duration, and any recent changes."
  },
  {
    role: "Gatekeeper Agent",
    message: "Patient reports no tobacco smoking, no alcohol consumption, and no illicit drug use."
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "PT, INR and aPTT"
  },
  {
    role: "Gatekeeper Agent",
    message: "PT: 12.5 sec (ref 11.5–14.5 sec) INR: 0.9 (ref 0.9–1.1) APTT: 28.5 sec (ref 22.0–36.0 sec)"
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Have you ever experienced delayed or prolonged bleeding after surgery, dental work, childbirth, or even minor cuts (including umbilical stump bleeding as a newborn), or problems with wound healing or scar formation?"
  },
  {
    role: "Gatekeeper Agent",
    message: "No history of delayed or prolonged bleeding after surgery, dental work, childbirth, or minor cuts, and no problems with wound healing or abnormal scar formation."
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "CBC with platelet count and peripheral smear"
  },
  {
    role: "Gatekeeper Agent",
    message: "Complete blood count with differential and platelet count: White-cell count 13,470 per µl; Neutrophils 8,970 per µl; Lymphocytes 2,750 per µl; Monocytes 1,420 per µl; Eosinophils 200 per µl; Basophils 70 per µl; Hemoglobin 15.1 g/dl; Hematocrit 44.9 %; Platelet count 339,000 per µl Peripheral blood smear: red cells normocytic and normochromic without schistocytes or spherocytes;white cells show orderly maturation without blasts or dysplasia; platelets adequate in number, normal size and granularity."
  },
  {
    role: "MAI-DxO",
    action: "Question",
    message: "Besides the current throat bleeding, how often do you experience easy bruising, nosebleeds, gum bleeding when brushing teeth, or heavy menstrual periods, and have these issues been lifelong or only in recent years?"
  },
  {
    role: "Gatekeeper Agent",
    message: "Patient reports easy bruising of the extremities approximately once monthly over the past 2 months. She denies any spontaneous epistaxis or gingival bleeding. Menstrual periods have been heavy for the past 7 weeks; prior to that, menses were regular without menorrhagia."
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "von Willebrand factor antigen and ristocetin cofactor (vWF activity) with factor VIII level"
  },
  {
    role: "Gatekeeper Agent",
    message: "Von Willebrand factor antigen: 102 % (reference 50–150 %) Ristocetin cofactor activity: 95 % (reference 50–150 %) Factor VIII activity: 108 % (reference 50–150 %)"
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "Factor XIII activity assay (clot solubility and quantitative activity level)"
  },
  {
    role: "Gatekeeper Agent",
    message: "Factor XIII activity assay: Clot solubility test: no clot dissolution after 5 M urea incubation for 24 hours. Quantitative Factor XIII activity: 98 % (ref 70–140 %)"
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "Contrast-enhanced CT scan of neck"
  },
  {
    role: "Gatekeeper Agent",
    message: "CT findings: Contrast-enhanced CT scan of the neck (oropharynx through skull base) shows a lobulated, hypodense mass in the right peritonsillar region measuring approximately 3.5 × 3.6 × 4.5 cm. The lesion extends superiorly toward the nasopharyngeal submucosa up to the level of the skull base. Minimal peripheral enhancement is present. Mild fat stranding is noted in the right parapharyngeal fat. The mass is inseparable from the right medial pterygoid muscle, which appears normal in size and attenuation. No evidence of osseous erosion or cervical lymphadenopathy. No extravasation of contrast."
  },
  {
    role: "MAI-DxO",
    action: "Test",
    message: "Transoral endoscopic biopsy of the right peritonsillar mass with histopathology and immunohistochemistry"
  },
  {
    role: "Gatekeeper Agent",
    message: "Histopathology: H&E staining shows ulcerated tonsil with reactive changes and an infiltrative round-cell tumor deep in the tonsil. The tumor exhibits alternating areas of hypocellularity with myxoid stroma and hypercellularity with foci of tumor-cell condensation, coagulative necrosis, hemorrhage, round-to-oval cells with dispersed-to-hyperchromatic chromatin, occasional prominent nucleoli, sparse amphophilic cytoplasm, numerous mitotic figures, and apoptotic bodies. Rhabdomyoblasts are not readily identified; anaplasia is absent.  Immunohistochemistry: Tumor cells are diffusely positive for desmin and MyoD1 and multifocally positive for myogenin.  Molecular testing: Fluorescence in situ hybridization with FOXO1 break-apart probes is negative for rearrangements. Next-generation sequencing identifies single-nucleotide variants in HRAS and GNAS and copy-number gain in HRAS. Cytogenetic analysis reveals a complex karyotype including trisomy 8."
  },
  {
    role: "MAI-DxO",
    action: "Diagnosis",
    message: "Embryonal rhabdomyosarcoma of the right peritonsillar region"
  }
];

export default function TestPage() {
  return (
    <main
      className="-mt-[88px] pt-[88px] relative min-h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{
        backgroundImage: 'url(/images/bg-chat.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* Internet Explorer 10+ */
      }}
    >
      {/* Chat Container */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-6">
          <LiquidGlassCard 
            className="p-4"
            blurIntensity="lg"
            glowIntensity="md"
          >
            <h1 className="font-title text-2xl tracking-tight text-white text-center">
              Testing Liquid Glass Messages
            </h1>
          </LiquidGlassCard>
        </div>

        {/* Chat Messages */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {conversation.map((message, index) => {
              const isMAI = message.role === 'MAI-DxO';
              const isTest = message.action === 'Test';
              const isQuestion = message.action === 'Question';
              
              return (
                <div
                  key={index}
                  className={`flex ${isMAI ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`max-w-[70%] ${isMAI ? 'ml-12' : 'mr-12'}`}>
                    <LiquidGlassCard
                      className={`p-4 ${
                        isMAI 
                          ? 'bg-blue-500/20' 
                          : 'bg-gray-100/20'
                      }`}
                      blurIntensity="md"
                      glowIntensity="sm"
                      borderRadius="18px"
                    >
                      {/* Role Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isMAI 
                            ? 'bg-blue-600/30 text-blue-100' 
                            : 'bg-gray-600/30 text-gray-100'
                        }`}>
                          {message.role}
                        </span>
                        {message.action && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isTest 
                              ? 'bg-green-600/30 text-green-100'
                              : isQuestion
                                ? 'bg-orange-600/30 text-orange-100'
                                : 'bg-purple-600/30 text-purple-100'
                          }`}>
                            {message.action}
                          </span>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <p className={`text-sm leading-relaxed ${
                        isMAI ? 'text-white' : 'text-gray-100'
                      }`}>
                        {message.message}
                      </p>
                    </LiquidGlassCard>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
