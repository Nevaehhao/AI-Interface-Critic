import { HomeHeroAuthAction } from "@/components/home/home-auth-actions";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const categories = [
  {
    description:
      "AI-driven type and spacing analysis for scanability, hierarchy, and long-form clarity.",
    icon: "readability",
    title: "Readability",
  },
  {
    description:
      "Eye-path review that checks whether your CTA, supporting content, and layout rhythm are weighted correctly.",
    icon: "visual-hierarchy",
    title: "Visual Hierarchy",
  },
  {
    description:
      "Accessibility and WCAG contrast review that flags color pairings before they reach implementation.",
    icon: "color-contrast",
    title: "Color Contrast",
  },
];

const steps = [
  {
    description:
      "Upload a screenshot or a short multi-screen flow, or let the app capture a live URL for you.",
    title: "Upload UI",
  },
  {
    description:
      "Run a structured critique that evaluates hierarchy, readability, accessibility, and interaction clarity.",
    title: "AI Analysis",
  },
  {
    description:
      "Review the findings, compare reports, and export a builder-ready brief or PDF for implementation.",
    title: "Refine & Export",
  },
];

function CategoryIcon({
  icon,
}: {
  icon: "color-contrast" | "readability" | "visual-hierarchy";
}) {
  if (icon === "readability") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none">
        <path
          d="M7 6h10M7 11h10M7 16h6M7 21h10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M16 8V4h3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (icon === "visual-hierarchy") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none">
        <rect
          x="4"
          y="5"
          width="16"
          height="4"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="4"
          y="11"
          width="10"
          height="4"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="4"
          y="17"
          width="6"
          height="3"
          rx="1.5"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none">
      <circle cx="9" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5a4.5 4.5 0 0 1 0 9"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />

      <main className="overflow-hidden pt-20">
        <section className="px-6 pb-20 pt-24 sm:px-8 md:pb-28 md:pt-36">
          <div className="mx-auto grid w-full max-w-7xl gap-16 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="max-w-xl">
              <p className="eyebrow">The Digital Curator</p>
              <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.05em] text-[var(--color-foreground)] md:text-[3.7rem]">
                The AI critic your{" "}
                <span className="text-[var(--color-accent)] italic">interface deserves</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                Elevate your design standards with autonomous UX reviews. UXCritic analyzes
                hierarchy, contrast, readability, and implementation risk in seconds.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <ButtonLink href="/upload">Start free analysis</ButtonLink>
                <HomeHeroAuthAction />
                <ButtonLink href="/report/demo" variant="text">
                  View demo report
                </ButtonLink>
              </div>
            </div>

            <div className="relative">
              <div className="surface-card relative overflow-hidden rounded-[2.25rem] p-6 shadow-[0_40px_80px_rgba(111,78,156,0.12)] md:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(237,220,255,0.42)] via-white/30 to-transparent" />
                <div className="relative rounded-[1.75rem] bg-[var(--color-surface-muted)] p-5 md:p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbEgmro2A3RJk7rgrSuo9aiVqm35-xH5069o_ehM6AoOJMBDHZdMTOAlqQX0DNIpf0Zg5JEz8F0Xr2JU0UG6qqVwlsapkBGy_quFCfNq2Nlp5sD3EPs-bKFhrdU2C7Jp7R8QabFxfNcqe8Lo9POMpeZX1hvkBoVc0N5a5VRHEAYPvP1EEiAb3Bourj2jP60e68st4kTdLpb_6iW00emuvaJDx6IZ7wHGQXVKk2_QEP5BGADA0wBMSpwFZNNA_hQ2GA68vUUZOOL9SH"
                    alt="UXCritic dashboard preview"
                    className="w-full rounded-[1.5rem] object-cover"
                  />
                </div>

                <div className="glass-panel absolute right-8 top-8 rounded-[1.25rem] px-4 py-3 text-sm shadow-[0_20px_40px_rgba(111,78,156,0.12)]">
                  <p className="eyebrow">Contrast score</p>
                  <p className="mt-2 font-display text-lg font-extrabold text-[var(--color-accent)]">
                    94% Pass
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[rgba(237,220,255,0.7)] blur-3xl" />
              <div className="absolute -right-6 -top-6 h-52 w-52 rounded-full bg-[rgba(227,203,255,0.55)] blur-3xl" />
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] px-6 py-24 sm:px-8 md:py-32">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-16 text-center">
              <p className="eyebrow">Analysis Engine</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.05em]">Curation Categories</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {categories.map((category, index) => (
                <article
                  key={category.title}
                  className={`surface-card p-8 ${
                    index === 1 ? "md:translate-y-10" : ""
                  }`}
                >
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <CategoryIcon icon={category.icon} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-[-0.04em]">{category.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {category.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 sm:px-8 md:py-32">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-20">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex flex-col gap-8 md:flex-row md:items-start ${
                  index === 1 ? "md:translate-x-10" : ""
                }`}
              >
                <div className="font-display text-7xl font-extrabold leading-none text-[rgba(227,203,255,0.82)] md:text-8xl">
                  0{index + 1}
                </div>
                <div className="pt-2">
                  <h3 className="text-3xl font-bold tracking-[-0.04em]">{step.title}</h3>
                  <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24 sm:px-8 md:pb-32">
          <div className="mx-auto w-full max-w-7xl">
            <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#6f4e9c_0%,#63428f_100%)] px-8 py-16 text-center text-white shadow-[0_30px_60px_rgba(111,78,156,0.22)] md:px-16 md:py-24">
              <h2 className="text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">
                Ready for a professional second opinion?
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/86">
                Run a critique, compare iterations, and pass a cleaner handoff into engineering
                without changing your current workflow.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink
                  href="/upload"
                  variant="secondary"
                  className="!bg-white !text-[var(--color-accent)] border border-white/70 px-8 py-4 text-base shadow-[0_22px_44px_rgba(46,32,78,0.24)] hover:!bg-[#f8f4ff]"
                >
                  Get started for free
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
