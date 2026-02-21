'use client'
import { useState, useRef, ReactNode, ChangeEvent } from "react";
import { generateReportDocx } from '@/lib/generateReport';
import Groq from 'groq-sdk';

// ── Type Definitions ────────────────────────────────────────────────────────
interface Region { id: string; label: string; d: string; cx: number; cy: number; }

interface Symptom {
  regionId: string; label: string; painTypes: string[];
  intensity: number; duration: string; notes?: string;
}

interface GeneralState {
  frequency: string[]; onset: string[]; better: string[]; worse: string[];
  otherSymptoms: string[]; hadBefore: string; medication: string;
  medicationDetails: string; additionalNotes: string; painSource: string;
}

interface Report {
  patientComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  currentMedications: string;
  systemsReview: string;
  symptomAnalysis: string;
  aggravatingFactors: string;
  relievingFactors: string;
  functionalImpact: string;
  urgencyAssessment: string;
  summary: string;
}

interface Guidance {
  nextSteps: string[];
  questionsForDoctor: string[];
}

interface Log {
  title: string;
  summary: string;
  intensity: number;
  postAppointmentMedications: string[];
  postAppointmentPrecautions: string[];
  followUp: string;
  appointmentType: string;
}

interface CardProps { children: ReactNode; style?: React.CSSProperties; className?: string; }
interface BtnProps {
  children: ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  style?: React.CSSProperties; disabled?: boolean; className?: string;
}
interface TagProps { label: string; selected: boolean; onClick: () => void; }
interface LabelProps { children: ReactNode; }
interface HintProps { children: ReactNode; }
interface PainSliderProps { value: number; onChange: (value: number) => void; }
interface BodyMapProps { view: "front" | "back"; selectedRegions: string[]; onSelect: (regionId: string, label: string) => void; symptoms: Symptom[]; }
interface SymptomModalProps { region: { id: string; label: string }; existing: Symptom | null; onSave: (details: Omit<Symptom, "regionId" | "label">) => void; onClose: () => void; }
interface StepsProps { current: number; total: number; }

const G = {
  accent: "#5B8DB8", accentLight: "#4c81b9", accentDark: "#2563EB",
  success: "#10B981", warn: "#F59E0B", danger: "#EF4444",
};

// ── Body map region data ─────────────────────────────────────────────────────
const REGIONS_FRONT: Region[] = [
  { id: "head", label: "Head", d: "M135,20 Q165,10 195,20 Q215,35 215,60 Q215,90 195,105 Q165,115 135,105 Q115,90 115,60 Q115,35 135,20 Z", cx: 165, cy: 65 },
  { id: "neck", label: "Neck", d: "M148,105 Q165,110 182,105 L185,130 Q165,135 145,130 Z", cx: 165, cy: 120 },
  { id: "left_chest", label: "Left Chest", d: "M120,130 L162,130 L162,195 Q138,197 110,190 Z", cx: 136, cy: 163 },
  { id: "right_chest", label: "Right Chest", d: "M168,130 L210,130 L220,190 Q192,197 168,195 Z", cx: 194, cy: 163 },
  { id: "left_shoulder", label: "Left Shoulder", d: "M110,130 L120,130 L115,170 Q95,165 85,150 Z", cx: 100, cy: 150 },
  { id: "right_shoulder", label: "Right Shoulder", d: "M210,130 L220,130 L245,150 Q235,165 215,170 Z", cx: 230, cy: 150 },
  { id: "upper_abdomen", label: "Upper Abdomen", d: "M110,190 Q136,197 162,195 L162,245 Q136,249 112,240 Z", cx: 136, cy: 220 },
  { id: "right_upper_abdomen", label: "Right Upper Abdomen", d: "M168,195 Q192,197 220,190 L218,240 Q194,249 168,245 Z", cx: 194, cy: 220 },
  { id: "lower_abdomen", label: "Lower Abdomen", d: "M112,240 Q165,248 218,240 L215,290 Q165,298 115,290 Z", cx: 165, cy: 268 },
  { id: "left_arm", label: "Left Arm", d: "M85,150 L110,170 L105,260 Q90,265 78,255 Z", cx: 92, cy: 210 },
  { id: "right_arm", label: "Right Arm", d: "M245,150 L220,170 L225,260 Q240,265 252,255 Z", cx: 238, cy: 210 },
  { id: "left_forearm", label: "Left Forearm", d: "M78,255 L105,260 L100,330 Q82,335 70,325 Z", cx: 87, cy: 292 },
  { id: "right_forearm", label: "Right Forearm", d: "M252,255 L225,260 L230,330 Q248,335 260,325 Z", cx: 243, cy: 292 },
  { id: "left_hand", label: "Left Hand", d: "M70,325 L100,330 L98,360 Q75,362 65,355 Z", cx: 82, cy: 345 },
  { id: "right_hand", label: "Right Hand", d: "M260,325 L230,330 L232,360 Q255,362 265,355 Z", cx: 248, cy: 345 },
  { id: "left_hip", label: "Left Hip/Groin", d: "M115,290 Q140,295 165,295 L162,345 Q130,348 112,335 Z", cx: 138, cy: 318 },
  { id: "right_hip", label: "Right Hip/Groin", d: "M165,295 Q190,295 215,290 L218,335 Q200,348 168,345 Z", cx: 192, cy: 318 },
  { id: "left_thigh", label: "Left Thigh", d: "M112,335 Q130,348 162,345 L158,420 Q125,425 105,415 Z", cx: 133, cy: 380 },
  { id: "right_thigh", label: "Right Thigh", d: "M168,345 Q200,348 218,335 L225,415 Q205,425 172,420 Z", cx: 197, cy: 380 },
  { id: "left_knee", label: "Left Knee", d: "M105,415 L158,420 L155,455 Q125,460 100,450 Z", cx: 128, cy: 437 },
  { id: "right_knee", label: "Right Knee", d: "M172,420 L225,415 L230,450 Q205,460 175,455 Z", cx: 202, cy: 437 },
  { id: "left_shin", label: "Left Shin/Calf", d: "M100,450 L155,455 L150,530 Q120,535 95,525 Z", cx: 125, cy: 490 },
  { id: "right_shin", label: "Right Shin/Calf", d: "M175,455 L230,450 L235,525 Q210,535 180,530 Z", cx: 205, cy: 490 },
  { id: "left_foot", label: "Left Foot", d: "M95,525 L150,530 L148,555 Q110,562 90,552 Z", cx: 120, cy: 542 },
  { id: "right_foot", label: "Right Foot", d: "M180,530 L235,525 L240,552 Q220,562 182,555 Z", cx: 210, cy: 542 },
];

const REGIONS_BACK: Region[] = [
  { id: "back_head", label: "Back of Head", d: "M135,20 Q165,10 195,20 Q215,35 215,60 Q215,90 195,105 Q165,115 135,105 Q115,90 115,60 Q115,35 135,20 Z", cx: 165, cy: 65 },
  { id: "back_neck", label: "Back of Neck", d: "M148,105 Q165,110 182,105 L185,130 Q165,135 145,130 Z", cx: 165, cy: 120 },
  { id: "upper_back", label: "Upper Back", d: "M120,130 L210,130 L220,190 Q165,200 110,190 Z", cx: 165, cy: 162 },
  { id: "back_left_shoulder", label: "Left Shoulder (Back)", d: "M110,130 L120,130 L115,170 Q95,165 85,150 Z", cx: 100, cy: 150 },
  { id: "back_right_shoulder", label: "Right Shoulder (Back)", d: "M210,130 L220,130 L245,150 Q235,165 215,170 Z", cx: 230, cy: 150 },
  { id: "cervical_spine", label: "Cervical Spine", d: "M158,105 L172,105 L172,130 L158,130 Z", cx: 165, cy: 118 },
  { id: "upper_spine", label: "Upper Spine", d: "M158,130 L172,130 L172,190 L158,190 Z", cx: 165, cy: 160 },
  { id: "mid_back", label: "Mid Back", d: "M110,190 Q165,200 220,190 L218,240 Q165,248 112,240 Z", cx: 165, cy: 218 },
  { id: "mid_spine", label: "Mid Spine", d: "M158,190 L172,190 L172,240 L158,240 Z", cx: 165, cy: 215 },
  { id: "lower_back", label: "Lower Back", d: "M112,240 Q165,248 218,240 L215,290 Q165,298 115,290 Z", cx: 165, cy: 268 },
  { id: "lower_spine", label: "Lower Spine", d: "M158,240 L172,240 L172,293 L158,293 Z", cx: 165, cy: 267 },
  { id: "back_left_arm", label: "Left Arm (Back)", d: "M85,150 L110,170 L105,260 Q90,265 78,255 Z", cx: 92, cy: 210 },
  { id: "back_right_arm", label: "Right Arm (Back)", d: "M245,150 L220,170 L225,260 Q240,265 252,255 Z", cx: 238, cy: 210 },
  { id: "back_left_forearm", label: "Left Forearm (Back)", d: "M78,255 L105,260 L100,330 Q82,335 70,325 Z", cx: 87, cy: 292 },
  { id: "back_right_forearm", label: "Right Forearm (Back)", d: "M252,255 L225,260 L230,330 Q248,335 260,325 Z", cx: 243, cy: 292 },
  { id: "buttocks", label: "Buttocks", d: "M115,290 L215,290 L218,340 Q165,350 112,340 Z", cx: 165, cy: 318 },
  { id: "back_left_thigh", label: "Left Thigh (Back)", d: "M112,340 Q138,350 165,348 L162,425 Q128,428 105,418 Z", cx: 133, cy: 383 },
  { id: "back_right_thigh", label: "Right Thigh (Back)", d: "M165,348 Q192,350 218,340 L225,418 Q202,428 168,425 Z", cx: 197, cy: 383 },
  { id: "back_left_knee", label: "Left Knee (Back)", d: "M105,418 L162,425 L158,458 Q125,463 100,453 Z", cx: 128, cy: 440 },
  { id: "back_right_knee", label: "Right Knee (Back)", d: "M168,425 L225,418 L230,453 Q205,463 172,458 Z", cx: 202, cy: 440 },
  { id: "back_left_calf", label: "Left Calf (Back)", d: "M100,453 L158,458 L152,532 Q120,537 95,527 Z", cx: 125, cy: 493 },
  { id: "back_right_calf", label: "Right Calf (Back)", d: "M172,458 L230,453 L235,527 Q210,537 182,532 Z", cx: 205, cy: 493 },
  { id: "back_left_foot", label: "Left Heel/Foot", d: "M95,527 L152,532 L150,557 Q112,564 90,554 Z", cx: 120, cy: 544 },
  { id: "back_right_foot", label: "Right Heel/Foot", d: "M182,532 L235,527 L240,554 Q218,564 182,557 Z", cx: 210, cy: 544 },
];

const PAIN_TYPES = ["Aching", "Burning", "Sharp/Stabbing", "Throbbing", "Cramping", "Pressing/Squeezing", "Tingling/Pins & Needles", "Numbness", "Shooting", "Dull/Soreness"] as const;
const DURATION_OPTIONS = ["Less than 24 hours", "1–3 days", "4–7 days", "1–2 weeks", "2–4 weeks", "1–3 months", "3–6 months", "6+ months", "Years"] as const;
const FREQUENCY_OPTIONS = ["Constant (always there)", "Almost always", "Several times a day", "Once a day", "A few times a week", "Once a week", "A few times a month", "Rarely / First time"] as const;
const ONSET_OPTIONS = ["Suddenly (came out of nowhere)", "After an injury or accident", "After physical activity", "Gradually over time", "After eating/drinking", "After stress or anxiety", "After waking up", "After a medical procedure", "Unknown"] as const;
const BETTER_OPTIONS = ["Rest", "Sleep", "Heat/warm compress", "Ice/cold compress", "Medication", "Eating or drinking", "Moving around", "Stretching", "Nothing helps", "Not sure"] as const;
const WORSE_OPTIONS = ["Movement/activity", "Sitting still", "Lying down", "Standing", "Eating or drinking", "Stress", "Cold weather", "Heat", "Pressure/touch", "Nothing makes it worse", "Not sure"] as const;
const OTHER_SYMPTOMS = ["Fever", "Nausea / Vomiting", "Dizziness", "Fatigue/Tiredness", "Shortness of breath", "Sweating", "Loss of appetite", "Headache", "Swelling", "Skin rash", "Blurred vision", "Difficulty sleeping", "Anxiety or worry"] as const;

// ── Reusable components ──────────────────────────────────────────────────────
const Card = ({ children, style = {}, className = "" }: CardProps) => (
  <div className={`card rounded-2xl p-7 ${className}`} style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false, className = "" }: BtnProps) => {
  const base = "px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200";
  const variants = {
    primary: { cls: "text-white", sty: { background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))", border: "1px solid rgba(96,165,250,0.35)" } },
    secondary: { cls: "text-blue-600", sty: { background: "rgba(219,234,254,0.5)", border: `1.5px solid ${G.accent}` } },
    ghost: { cls: "text-slate-500 border border-slate-300", sty: { background: "transparent" } },
    danger: { cls: "text-white", sty: { background: G.danger } },
    success: { cls: "text-white", sty: { background: G.success } },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant].cls} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      style={{ ...variants[variant].sty, ...style }}>
      {children}
    </button>
  );
};

const Tag = ({ label, selected, onClick }: TagProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm transition-all duration-150 m-1 ${
      selected
        ? "font-semibold text-white bg-blue-700 border-2 border-blue-700"
        : "font-normal text-white bg-slate-600 border-2 border-slate-600 hover:bg-slate-700"
    }`}>
    {label}
  </button>
);

const Label = ({ children }: LabelProps) => <div className="font-semibold text-white mb-2 text-base">{children}</div>;
const Hint = ({ children }: HintProps) => <div className="text-white/70 text-sm mb-2.5 leading-relaxed">{children}</div>;

const PainSlider = ({ value, onChange }: PainSliderProps) => {
  const colors = ["#10B981", "#34D399", "#6EE7B7", "#FCD34D", "#FBBF24", "#F59E0B", "#F97316", "#EF4444", "#DC2626", "#991B1B"];
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-slate-500 text-sm">No pain</span>
        <span className="font-bold text-xl" style={{ color: colors[value - 1] }}>{value}/10</span>
        <span className="text-slate-500 text-sm">Worst pain</span>
      </div>
      <input type="range" min={1} max={10} value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="w-full h-2" style={{ accentColor: colors[value - 1] }} />
      <div className="flex justify-between mt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <span key={n} className={`text-xs ${n === value ? "font-bold" : "font-normal"}`} style={{ color: n === value ? colors[n - 1] : "#CBD5E1" }}>{n}</span>
        ))}
      </div>
    </div>
  );
};

// ── Body Map ─────────────────────────────────────────────────────────────────
const BodyMap = ({ view, selectedRegions, onSelect, symptoms }: BodyMapProps) => {
  const regions = view === "front" ? REGIONS_FRONT : REGIONS_BACK;
  const [hovered, setHovered] = useState<string | null>(null);

  const getColor = (id: string) => selectedRegions.includes(id) ? G.accent : hovered === id ? G.accentLight : "#edf3f9";
  const getStroke = (id: string) => selectedRegions.includes(id) ? G.accentDark : hovered === id ? G.accent : "#A8BCCC";

  return (
    <svg viewBox="0 0 330 580" className="w-full max-w-70 block mx-auto">
      <defs><filter id="bodyShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter></defs>
      {view === "front" && [155, 168, 181, 194].map((y, i) => (
        <g key={i}>
          <path d={`M165,${y} Q148,${y + 4} 128,${y + 2}`} stroke="#C8D8E4" strokeWidth="1" fill="none" />
          <path d={`M165,${y} Q182,${y + 4} 202,${y + 2}`} stroke="#C8D8E4" strokeWidth="1" fill="none" />
        </g>
      ))}
      {regions.map(r => (
        <g key={r.id}>
          <path d={r.d} fill={getColor(r.id)} stroke={getStroke(r.id)} strokeWidth={selectedRegions.includes(r.id) ? 2 : 1}
            className="cursor-pointer transition-all duration-150" fillOpacity={0.75}
            onClick={() => onSelect(r.id, r.label)}
            onMouseEnter={() => setHovered(r.id)} onMouseLeave={() => setHovered(null)} />
          {selectedRegions.includes(r.id) && <>
            <circle cx={r.cx} cy={r.cy} r={9} fill={G.accent} stroke="#fff" strokeWidth={2} style={{ pointerEvents: "none" }} />
            <text x={r.cx} y={r.cy + 4} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700} style={{ pointerEvents: "none" }}>
              {symptoms.filter(s => s.regionId === r.id).length || "✓"}
            </text>
          </>}
        </g>
      ))}
      {hovered && (
        <g>
          <rect x="10" y="565" width="310" height="22" rx="6" fill="#1E293B" fillOpacity="0.85" />
          <text x="165" y="580" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="500">
            {regions.find(r => r.id === hovered)?.label}
          </text>
        </g>
      )}
    </svg>
  );
};

// ── Symptom Modal ─────────────────────────────────────────────────────────────
const SymptomModal = ({ region, existing, onSave, onClose }: SymptomModalProps) => {
  const [painTypes, setPainTypes] = useState(existing?.painTypes || []);
  const [intensity, setIntensity] = useState(existing?.intensity || 5);
  const [duration, setDuration] = useState(existing?.duration || "");
  const [notes, setNotes] = useState(existing?.notes || "");

  const toggle = (t: string) => setPainTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(30,41,59,0.55)", backdropFilter: "blur(8px)" }}>
      <div className="card rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs text-white uppercase tracking-wider mb-1">Describe your pain in</div>
            <h2 className="text-2xl font-semibold text-white">{region.label}</h2>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-2xl text-white cursor-pointer ">✕</button>
        </div>

        <div className="mb-6 text-white">
          <Label>What type of pain? <span className="font-normal text-white">(select all that apply)</span></Label>
          <div className="flex flex-wrap gap-1">
            {PAIN_TYPES.map(t => <Tag key={t} label={t} selected={painTypes.includes(t)} onClick={() => toggle(t)} />)}
          </div>
        </div>

        <div className="mb-6 text-white">
          <Label>Pain intensity</Label>
          <Hint>1 = mild discomfort, 10 = unbearable pain</Hint>
          <PainSlider value={intensity} onChange={setIntensity} />
        </div>

        <div className="mb-6">
          <Label>How long have you had this?</Label>
          <div className="flex flex-wrap gap-1">
            {DURATION_OPTIONS.map(d => <Tag key={d} label={d} selected={duration === d} onClick={() => setDuration(d)} />)}
          </div>
        </div>

        <div className="mb-7">
          <Label>Extra details <span className="font-normal text-white">(optional)</span></Label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="e.g. worse in the morning, shooting down left arm..."
            className="w-full px-3.5 py-3 border-2 border-slate-300 rounded-xl resize-y outline-none text-white leading-relaxed" />
        </div>

        <div className="flex gap-3">
          <Btn onClick={() => onSave({ painTypes, intensity, duration, notes })} disabled={painTypes.length === 0 || !duration}>
            Save symptom
          </Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
        {(painTypes.length === 0 || !duration) && (
          <div className="mt-2.5 text-amber-600 text-sm">⚠ Select at least one pain type and a duration.</div>
        )}
      </div>
    </div>
  );
};

// ── Steps ─────────────────────────────────────────────────────────────────────
const Steps = ({ current, total }: StepsProps) => (
  <div className="flex items-center mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: i < current ? G.accent : i === current ? G.accentDark : "#CBD5E1", color: i <= current ? "#fff" : "#94A3B8" }}>
          {i < current ? "✓" : i + 1}
        </div>
        {i < total - 1 && <div className="h-0.5 min-w-8" style={{ background: i < current ? G.accent : "#CBD5E1" }} />}
      </div>
    ))}
  </div>
);

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [modalRegion, setModalRegion] = useState<{ id: string; label: string } | null>(null);
  const [editingSymptomIdx, setEditingSymptomIdx] = useState<number | null>(null);
  const [general, setGeneral] = useState<GeneralState>({
    frequency: [], onset: [], better: [], worse: [], otherSymptoms: [],
    hadBefore: "", medication: "", medicationDetails: "", additionalNotes: "", painSource: "",
  });
  const [report, setReport] = useState<Report | null>(null);
  const [suggestions, setSuggestions] = useState<Guidance | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleRegionClick = (regionId: string, regionLabel: string) => {
    const idx = symptoms.findIndex(s => s.regionId === regionId);
    setModalRegion({ id: regionId, label: regionLabel });
    setEditingSymptomIdx(idx >= 0 ? idx : null);
  };

  const handleSaveSymptom = (details: Omit<Symptom, "regionId" | "label">) => {
    if (!modalRegion) return;
    const newSymptom = { regionId: modalRegion.id, label: modalRegion.label, ...details };
    if (editingSymptomIdx !== null) {
      setSymptoms(prev => prev.map((s, i) => i === editingSymptomIdx ? newSymptom : s));
    } else {
      setSymptoms(prev => [...prev, newSymptom]);
    }
    setModalRegion(null);
    setEditingSymptomIdx(null);
  };

  const removeSymptom = (idx: number) => setSymptoms(prev => prev.filter((_, i) => i !== idx));

  const toggleMulti = (key: keyof Pick<GeneralState, "frequency" | "onset" | "better" | "worse" | "otherSymptoms">, val: string) =>
    setGeneral(g => ({ ...g, [key]: g[key].includes(val) ? g[key].filter(x => x !== val) : [...g[key], val] }));

  const downloadReport = async (r: Report) => {
    const blob = await generateReportDocx(r);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-report-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async () => {
    setLoadingReport(true);
    setReportError(null);

    const symptomsText = symptoms.map(s =>
      `• ${s.label}: ${s.painTypes.join(", ")} pain, intensity ${s.intensity}/10, duration: ${s.duration}${s.notes ? `. Notes: ${s.notes}` : ""}`
    ).join("\n");

    const prompt = `You are a medical documentation assistant. Based on the following patient-reported information, generate a professional hospital-style patient report in JSON format.

SYMPTOM LOCATIONS & DETAILS:
${symptomsText}

GENERAL INFORMATION:
- How often does pain occur: ${general.frequency.join(", ") || "Not specified"}
- How pain started: ${general.onset.join(", ") || "Not specified"}
- What makes it better: ${general.better.join(", ") || "Not specified"}
- What makes it worse: ${general.worse.join(", ") || "Not specified"}
- Other symptoms: ${general.otherSymptoms.join(", ") || "None"}
- Likely pain source (organ/bone/muscle/joint/nerve): ${general.painSource || "Not specified"}
- Had this before: ${general.hadBefore || "Not specified"}
- Current medication: ${general.medication === "yes" ? general.medicationDetails || "Yes (no details given)" : general.medication || "Not specified"}
- Additional patient notes: ${general.additionalNotes || "None"}

Respond in this EXACT JSON format with no extra text:
{
  "report": {
    "patientComplaint": "one sentence chief complaint",
    "historyOfPresentIllness": "detailed paragraph",
    "pastMedicalHistory": "previous episodes or relevant history",
    "currentMedications": "list of medications or None reported",
    "systemsReview": "summary of all symptoms",
    "symptomAnalysis": "clinical breakdown of each symptom",
    "aggravatingFactors": "factors that worsen condition",
    "relievingFactors": "factors that improve condition",
    "functionalImpact": "impact on daily life",
    "urgencyAssessment": "routine, monitor, or urgent",
    "summary": "3-4 sentence closing summary"
  },
  "guidance": {
    "nextSteps": ["Step 1 at home care until doctor visit", "Step 2 at home care until doctor visit", "Step 3 at home care until doctor visit"],
    "questionsForDoctor": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
  },
  "log": {
    "title": "short title summarizing the main complaint",
    "questionsForDoctor": ["Make sure these are exactly as same as questions above", "Make sure these are exactly as same as questions above", "Make sure these are exactly as same as questions above", "Make sure these are exactly as same as questions above", "Make sure these are exactly as same as questions above"],
    "summary": "one paragraph plain English summary",
    "intensity": ${Math.max(...symptoms.map(s => s.intensity))},
    "postAppointmentMedications": ["medications mentioned or None"],
    "postAppointmentPrecautions": ["warnings or care instructions"],
    "followUp": "recommended follow up actions",
    "appointmentType": "Pre-Visit"
  }
}`;

    try {
      
      const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });
      const result = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      });

      const text = result.choices[0]?.message?.content || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as { report: Report; guidance: Guidance; log: Log };
      
      
      downloadReport(parsed.report);
      setReport(parsed.report);
      setSuggestions(parsed.guidance);
      setStep(3);

      // Save log to DB
      const token = localStorage.getItem('token');
      const patientId = localStorage.getItem('patientId');
      console.log('token:', token);
console.log('patientId:', patientId);
      const res  = await fetch(`http://localhost:4000/api/logs/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...parsed.log,
          symptoms: symptoms.map(s => s.label),
          date: new Date(),
        }),
      });
      const data = await res.json();
console.log('server response:', data);

    } catch (e) {
      console.error("Full error:", e);
      setReportError("There was an issue generating the report. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const selectedRegionIds = symptoms.map(s => s.regionId);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .card {
          background: linear-gradient(145deg, rgba(15,28,50,0.85) 0%, rgba(8,18,38,0.9) 100%);
          border: 1px solid rgba(96,165,250,0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      <div className="min-h-screen py-8" style={{ background: "linear-gradient(135deg, #020810 0%, #050f1f 50%, #020c18 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 pb-20 pt-8">

          {/* ── STEP 0: WELCOME ── */}
          {step === 0 && (
            <div className="max-w-xl mx-auto mt-10">
              <div className="text-center mb-10">
                <div className="text-5xl mb-4">🩺</div>
                <h1 className="text-4xl font-semibold text-white mb-3">Tell us how you're feeling</h1>
                <p className="text-lg text-white/60 leading-relaxed">
                  Describe your symptoms before seeing your doctor. We'll create a report they can use.
                </p>
              </div>
              <Card>
                <div className="mb-6">
                  {[["🗺️", "Point to where it hurts on a body diagram"], ["📋", "Answer a few questions"], ["📄", "AI creates a doctor-ready summary"]].map(([icon, title]) => (
                    <div key={title} className="flex gap-5 mb-5 items-center">
                      <div className="text-3xl">{icon}</div>
                      <div className="font-semibold text-white/90">{title}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <strong className="text-blue-400">Note:</strong>{" "}
                  <span className="text-white/70">This is not a diagnosis tool. Always consult a qualified healthcare professional.</span>
                </div>
                <Btn onClick={() => setStep(1)} className="w-full py-4 text-lg">Start describing my symptoms →</Btn>
              </Card>
            </div>
          )}

          {/* ── STEP 1: BODY MAP ── */}
          {step === 1 && (
            <div>
              <Steps current={0} total={3} />
              <h2 className="text-2xl font-semibold text-white mb-1.5">Where does it hurt?</h2>
              <p className="text-white/60 mb-7">Click any area on the body to describe pain there.</p>

              <div className="grid grid-cols-2 gap-6 items-start">
                <Card>
                  <div className="flex gap-2 mb-5 justify-center">
                    <Btn variant={bodyView === "front" ? "primary" : "ghost"} onClick={() => setBodyView("front")} className="px-5 py-2">Front</Btn>
                    <Btn variant={bodyView === "back" ? "primary" : "ghost"} onClick={() => setBodyView("back")} className="px-5 py-2">Back</Btn>
                  </div>
                  <BodyMap view={bodyView} selectedRegions={selectedRegionIds} onSelect={handleRegionClick} symptoms={symptoms} />
                  <div className="text-center mt-3 text-white/50 text-xs">👆 Click any body area to add a symptom</div>
                </Card>

                <div>
                  <div className="font-bold text-lg text-white mb-3.5">Added symptoms ({symptoms.length})</div>
                  {symptoms.length === 0 ? (
                    <Card className="text-center p-8">
                      <div className="text-4xl mb-2.5">🖱️</div>
                      <div className="text-white/50">Click on a body area to add your first symptom</div>
                    </Card>
                  ) : symptoms.map((s, i) => (
                    <Card key={i} className="mb-3 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-white mb-1">{s.label}</div>
                          <div className="text-white/60 text-sm mb-1">{s.painTypes.join(" · ")}</div>
                          <div className="flex gap-3 text-xs text-white/50">
                            <span>Intensity: <strong className="text-white">{s.intensity}/10</strong></span>
                            <span>Duration: <strong className="text-white">{s.duration}</strong></span>
                          </div>
                          {s.notes && <div className="text-xs text-white/50 mt-1 italic">"{s.notes}"</div>}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button onClick={() => { setModalRegion({ id: s.regionId, label: s.label }); setEditingSymptomIdx(i); }}
                            className="bg-blue-50 border-none rounded-md px-2.5 py-1 text-blue-600 cursor-pointer text-xs hover:bg-blue-100">Edit</button>
                          <button onClick={() => removeSymptom(i)}
                            className="bg-red-50 border-none rounded-md px-2.5 py-1 text-red-600 cursor-pointer text-xs hover:bg-red-100">Remove</button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {symptoms.length > 0 && (
                    <div className="mt-5">
                      <Btn onClick={() => setStep(2)} className="w-full">Continue to questions →</Btn>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: GENERAL QUESTIONS ── */}
          {step === 2 && (
            <div>
              <Steps current={1} total={3} />
              <h2 className="text-2xl font-semibold text-white mb-1.5">A few more questions</h2>
              <p className="text-white/60 mb-8">These help us give your doctor the full picture.</p>

              {([
                { key: "frequency" as const, label: "How often does the pain occur?", opts: FREQUENCY_OPTIONS },
                { key: "onset" as const, label: "How did the pain start?", opts: ONSET_OPTIONS },
                { key: "better" as const, label: "What makes the pain better?", opts: BETTER_OPTIONS },
                { key: "worse" as const, label: "What makes the pain worse?", opts: WORSE_OPTIONS },
                { key: "otherSymptoms" as const, label: "Any other symptoms?", opts: OTHER_SYMPTOMS },
              ] as const).map(({ key, label, opts }) => (
                <Card key={key} className="mb-5">
                  <Label>{label}</Label>
                  <div className="flex flex-wrap gap-1">
                    {opts.map(o => <Tag key={o} label={o} selected={general[key].includes(o)} onClick={() => toggleMulti(key, o)} />)}
                  </div>
                </Card>
              ))}

              <Card className="mb-5">
                <Label>Does the pain feel like it is coming from:</Label>
                <Hint>
                  Organ = deep pressure, cramping, or nausea; Bone = sharp or deep ache, worse with touch;
                  Muscle = soreness or tightness; Joint = pain with movement, stiffness, or swelling;
                  Nerve = burning, tingling, shooting, or electric pain.
                </Hint>
                <div className="flex gap-2.5 flex-wrap">
                  {["Organ", "Bone", "Muscle", "Joint", "Nerve", "Not sure"].map(o => (
                    <Tag key={o} label={o} selected={general.painSource === o} onClick={() => setGeneral(g => ({ ...g, painSource: o }))} />
                  ))}
                </div>
              </Card>

              <Card className="mb-5">
                <Label>Have you had this pain before?</Label>
                <div className="flex gap-2.5 flex-wrap">
                  {["Yes, same pain before", "Yes, but milder before", "No, this is new", "Not sure"].map(o => (
                    <Tag key={o} label={o} selected={general.hadBefore === o} onClick={() => setGeneral(g => ({ ...g, hadBefore: o }))} />
                  ))}
                </div>
              </Card>

              <Card className="mb-5">
                <Label>Are you currently taking any medication?</Label>
                <div className="flex gap-2.5 mb-3.5 flex-wrap">
                  {["Yes", "No", "I take general medication (not for this)"].map(o => (
                    <Tag key={o} label={o} selected={general.medication === o} onClick={() => setGeneral(g => ({ ...g, medication: o }))} />
                  ))}
                </div>
                {general.medication === "Yes" && (
                  <input value={general.medicationDetails}
                    onChange={(e) => setGeneral(g => ({ ...g, medicationDetails: e.target.value }))}
                    placeholder="What medication? Dosage if you know it..."
                    className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-lg text-white bg-white/5 placeholder:text-white/40" />
                )}
              </Card>

              <Card className="mb-8">
                <Label>Anything else the doctor should know?</Label>
                <Hint>e.g. stress levels, recent travel, diet changes, sleep issues</Hint>
                <textarea value={general.additionalNotes}
                  onChange={(e) => setGeneral(g => ({ ...g, additionalNotes: e.target.value }))}
                  rows={4} placeholder="Type anything here..."
                  className="w-full px-3.5 py-3 border-2 border-slate-300 rounded-xl resize-y text-white bg-white/5 placeholder:text-white/40 leading-relaxed" />
              </Card>

              <div className="flex gap-3">
                <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
                <Btn onClick={generateReport} disabled={loadingReport} className="flex-1 py-4">
                  {loadingReport ? "⏳ Creating your report..." : "Generate my report →"}
                </Btn>
              </div>
              {reportError && (
                <div className="mt-3 text-red-500 px-4 py-3 bg-red-50 rounded-lg border border-red-200">{reportError}</div>
              )}
            </div>
          )}

          {/* ── STEP 3: REPORT ── */}
          {step === 3 && report && (
            <div>
              <Steps current={2} total={3} />

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-white">Your Report</h2>
                <Btn onClick={() => downloadReport(report)}>⬇️ Download (.docx)</Btn>
              </div>

              <Card className="mb-4">
                <div className="font-bold text-lg text-white mb-2">📋 Summary</div>
                <div className="text-white/70 leading-relaxed">{report.summary}</div>
              </Card>

              {suggestions?.nextSteps && (
                <Card className="mb-4">
                  <div className="font-bold text-lg text-white mb-3">✅ What to do next</div>
                  {suggestions.nextSteps.map((s, i) => (
                    <div key={i} className="flex gap-2.5 mb-2.5 items-start">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-0 font-bold text-xs" style={{ background: "rgba(16,185,129,0.2)", color: "#10B981" }}>{i + 1}</div>
                      <span className="text-white/70 text-sm pt-0.5">{s}</span>
                    </div>
                  ))}
                </Card>
              )}

              {suggestions?.questionsForDoctor && (
                <Card className="mb-6">
                  <div className="font-bold text-lg text-white mb-3">💬 Questions to ask your doctor</div>
                  {suggestions.questionsForDoctor.map((q, i) => (
                    <div key={i} className="flex gap-2.5 mb-2.5 items-start">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-0 font-bold text-xs" style={{ background: "rgba(96,165,250,0.2)", color: "#60A5FA" }}>{i + 1}</div>
                      <span className="text-white/70 text-sm pt-0.5">{q}</span>
                    </div>
                  ))}
                </Card>
              )}

              <div className="flex gap-3 justify-center">
                <Btn variant="ghost" onClick={() => setStep(2)}>← Edit answers</Btn>
                <Btn onClick={() => downloadReport(report)}>⬇️ Download Report</Btn>
              </div>
            </div>
          )}

        </div>
      </div>

      {modalRegion && (
        <SymptomModal
          region={modalRegion}
          existing={editingSymptomIdx !== null ? symptoms[editingSymptomIdx] : null}
          onSave={handleSaveSymptom}
          onClose={() => { setModalRegion(null); setEditingSymptomIdx(null); }}
        />
      )}
    </>
  );
}
