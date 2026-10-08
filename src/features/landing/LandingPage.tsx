import {
  ArrowRight, Camera, CheckCircle2, Cpu, Eye, FileCheck2, Fingerprint, LockKeyhole, ScanFace,
  ScanLine, ShieldCheck, Smartphone, Timer, UserCheck, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, LinkButton } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { useMe } from "../../hooks/useAuth";
import { HeroPreview } from "./HeroPreview";

const capabilities = [
  {
    icon: <Eye className="size-5" />,
    title: "Real-time gaze monitoring",
    body: "Head pose and eye movement are tracked live and calibrated to each candidate's own camera position. Every sustained look away is recorded with its direction, time and duration.",
    points: ["Forward, left, right, up and down", "Calibrated per candidate", "Stored as timed events"],
  },
  {
    icon: <ScanFace className="size-5" />,
    title: "Candidate identity verification",
    body: "The government ID is read on camera before the interview starts. The face in the interview is then compared, frame by frame, with the profile photo and the ID photo.",
    points: ["Live ID capture with OCR", "Name, date of birth and ID number checks", "Face consistency across the whole interview"],
  },
  {
    icon: <Users className="size-5" />,
    title: "Environmental anomaly detection",
    body: "The camera view is checked for additional people, mobile phones, laptops and extra screens. Candidates see a clear, polite prompt when something needs their attention.",
    points: ["Additional person and absence", "Phones, laptops and screens", "Confirmed across consecutive frames"],
  },
];

const steps = [
  { icon: <UserCheck className="size-5" />, title: "Create a profile", body: "Name and date of birth as printed on the ID, a profile photo and an image of the ID." },
  { icon: <ScanLine className="size-5" />, title: "Show your ID on camera", body: "TrustPRO checks the ID is readable, reads its details and compares its photo with the profile." },
  { icon: <Camera className="size-5" />, title: "Take the interview", body: "The camera stays on. Gaze and the surroundings are monitored live and the session is recorded." },
  { icon: <FileCheck2 className="size-5" />, title: "Review the evidence", body: "One click runs the full analysis and produces an integrity report with timestamps and frames." },
];

const principles = [
  { icon: <ShieldCheck className="size-5" />, title: "Observations, not verdicts", body: "TrustPRO reports what was seen, when, and how confident the model was. It never labels a candidate. People make the decisions." },
  { icon: <Fingerprint className="size-5" />, title: "Evidence for every event", body: "Each reported event links to the frame, the timestamp and the exact model result behind it, so a reviewer can see why it was reported." },
  { icon: <LockKeyhole className="size-5" />, title: "Privacy by design", body: "Passwords use Argon2id. ID numbers are stored only as a keyed hash with the last four digits. Face templates are never stored." },
  { icon: <Cpu className="size-5" />, title: "Runs on your servers", body: "All AI runs locally on standard CPUs with open models. No candidate video is sent to a third-party AI service." },
];

export function LandingPage() {
  const me = useMe();
  const signedIn = !!me.data;
  const startHref = signedIn ? "/dashboard" : "/register";

  return (
    <div className="bg-white">
      {/* ------------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[140px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[480px] rounded-full bg-teal-500/20 blur-[120px]" />

        <header className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo dark />
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#capabilities" className="hover:text-white">Capabilities</a>
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#reports" className="hover:text-white">Reports</a>
            <a href="#principles" className="hover:text-white">Trust &amp; privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            {!signedIn && <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white">Sign in</Link>}
            <LinkButton to={startHref} size="sm">{signedIn ? "Go to dashboard" : "Start interview"}</LinkButton>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-10 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-32">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-teal-400" /> AI Interview Protector
            </span>
            <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-[58px]">
              AI-powered Assessments protection.
              <span className="block bg-gradient-to-r from-brand-400 via-[#7aa5ff] to-teal-400 bg-clip-text text-transparent">
                Evidence you can review.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              TrustPRO verifies who is in the assessment, monitors gaze and the surroundings in real time, and turns
              every observation into timestamped evidence in a clear integrity report.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LinkButton to={startHref} size="lg" trailingIcon={<ArrowRight className="size-4" />}>
                {signedIn ? "Continue to your assessment" : "Start your assessment"}
              </LinkButton>
              <Button size="lg" variant="light" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                See how it works
              </Button>
            </div>
            <ul className="mt-10 flex max-w-2xl flex-wrap gap-x-7 gap-y-3 text-sm text-white/70">
              {["No automated verdicts", "Runs without a GPU", "Evidence for every event"].map((t) => (
                <li key={t} className="flex items-center gap-2 whitespace-nowrap"><CheckCircle2 className="size-4 text-teal-400" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up [animation-delay:120ms]">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ capabilities */}
      <section id="capabilities" className="mx-auto max-w-7xl scroll-mt-10 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">What TrustPRO does</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Three independent signals, one clear picture</h2>
          <p className="mt-4 text-lg text-ink-500">
            Each capability uses a model chosen for that job. Their results are reported side by side, never merged into a single score.
          </p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {capabilities.map((c) => (
            <article key={c.title} className="group rounded-3xl bg-white p-7 shadow-card ring-1 ring-ink-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white">
                {c.icon}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-ink-900">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{c.body}</p>
              <ul className="mt-5 space-y-2 border-t border-ink-100 pt-5">
                {c.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink-700"><CheckCircle2 className="size-4 text-teal-500" />{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ how it works */}
      <section id="how-it-works" className="scroll-mt-10 bg-ink-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">From sign-in to a reviewable report</h2>
            <p className="mt-4 text-lg text-ink-500">The candidate cannot start the interview until their ID has been shown and checked on camera.</p>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/70">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-ink-900 text-white">{s.icon}</div>
                  <span className="text-sm font-semibold text-ink-300">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ reports */}
      <section id="reports" className="mx-auto grid max-w-7xl scroll-mt-10 items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">Evidence-based analysis</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">A report a reviewer can actually check</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            After the interview the full recording is analysed. Identity and environment checks run in parallel, and
            anything seen in only one frame is checked again on the frames around it before it is reported.
          </p>
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { icon: <Timer className="size-4" />, t: "Timestamps", d: "Every event is placed on the interview timeline." },
              { icon: <ScanFace className="size-4" />, t: "Face comparisons", d: "Profile, ID and video compared with similarity values." },
              { icon: <Smartphone className="size-4" />, t: "Annotated frames", d: "Detected objects are boxed on the evidence frame." },
              { icon: <Eye className="size-4" />, t: "Gaze timeline", d: "Directions, durations and totals, without a score." },
            ].map((x) => (
              <div key={x.t} className="flex gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-600">{x.icon}</div>
                <div>
                  <dt className="font-semibold text-ink-900">{x.t}</dt>
                  <dd className="mt-0.5 text-sm text-ink-500">{x.d}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <ReportPreview />
      </section>

      {/* ------------------------------------------------------------------ principles */}
      <section id="principles" className="scroll-mt-10 bg-ink-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-400 uppercase">Trust &amp; privacy</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Built to be fair to candidates</h2>
            <p className="mt-4 text-lg text-white/60">An integrity tool is only useful if its findings can be trusted and challenged.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
                <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-teal-300">{p.icon}</div>
                <h3 className="mt-5 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-14 text-white shadow-lift sm:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-teal-400/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Ready for your interview?</h2>
              <p className="mt-2 max-w-xl text-white/80">Have your government ID nearby and sit somewhere well lit. Setup takes about five minutes.</p>
            </div>
            <LinkButton to={startHref} size="lg" variant="secondary" trailingIcon={<ArrowRight className="size-4" />}>
              {signedIn ? "Go to dashboard" : "Start interview"}
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} Trustume. TrustPRO AI Interview Protector.</p>
        </div>
      </footer>
    </div>
  );
}

function ReportPreview() {
  const rows = [
    { t: "Profile photo and interview video", r: "Consistent", tone: "text-teal-600 bg-teal-50" },
    { t: "Profile photo and ID shown on camera", r: "Consistent", tone: "text-teal-600 bg-teal-50" },
    { t: "Mobile phone detected · 00:15", r: "Evidence", tone: "text-amber-700 bg-amber-50" },
  ];
  return (
    <figure className="relative">
      <div className="rounded-3xl bg-white p-6 shadow-lift ring-1 ring-ink-200/70">
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">Interview integrity report</p>
            <p className="mt-1 font-semibold text-ink-900">Identity &amp; environment</p>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600">Completed</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {rows.map((x) => (
            <li key={x.t} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
              <span className="text-ink-700">{x.t}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${x.tone}`}>{x.r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-ink-400">Gaze timeline</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-ink-100">
            {[["#cfd6e4", 30], ["#6b90fa", 6], ["#cfd6e4", 22], ["#e58a10", 4], ["#cfd6e4", 26], ["#14b8a6", 5], ["#cfd6e4", 7]].map(([c, w], i) => (
              <span key={i} style={{ background: c as string, width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-ink-400">Illustration of the report layout</figcaption>
    </figure>
  );
}
