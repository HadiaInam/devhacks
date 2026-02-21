'use client'
import { AppContext } from '@/context/AppContext'
import Link from 'next/link';
import { redirect } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'
import { GiStomach } from "react-icons/gi";
import { IoMedkit, IoChevronForward, IoClose, IoCalendarOutline, IoTimeOutline, IoAlertCircleOutline } from "react-icons/io5";
import { MdFiberManualRecord } from "react-icons/md";
import { IoMdVolumeHigh } from "react-icons/io";


type Severity = 'Mild' | 'Moderate' | 'Severe';

interface Log {
  _id: string;
  date: string;
  title: string;
  summary: string;
  intensity: number;
  postAppointmentMedications: string[];
  postAppointmentPrecautions: string[];
  followUp: string;
  symptoms: string[];
  appointmentType: string;
  questionsForDoctor?: string[]; // ← add this
}

const severityConfig: Record<Severity, { color: string; bg: string; label: string }> = {
  Mild: { color: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Mild" },
  Moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Moderate" },
  Severe: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", label: "Severe" },
};

function isSeverity(val: string): val is Severity {
  return val === 'Mild' || val === 'Moderate' || val === 'Severe';
}

function SeverityBadge({ level }: { level: string }) {
  const cfg = isSeverity(level) ? severityConfig[level] : severityConfig.Mild;
  return (
    <span style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      className="text-xs font-semibold px-3 py-1 max-w-20 flex items-center rounded-full tracking-wide">
      {cfg.label}
    </span>
  );
}

function LogDetailModal({ log, onClose }: { log: Log | null; onClose: () => void }) {
  if (!log) return null;
  const severity = log.intensity >= 7 ? 'Severe' : log.intensity >= 4 ? 'Moderate' : 'Mild';
  const cfg = severityConfig[severity];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,8,20,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl p-7 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(15,28,50,0.98), rgba(8,18,38,0.99))",
          border: "1px solid rgba(96,165,250,0.2)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white">
          <IoClose size={18} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
            <GiStomach size={24} style={{ color: cfg.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-4">{log.title}<IoMdVolumeHigh className='text-2xl '/></h2>
            <div className="flex items-center gap-3">
              <SeverityBadge level={severity} />
              <span className="text-white/40 text-xs flex items-center gap-1">
                <IoCalendarOutline size={12} />
                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
          </div>
          
        </div>

        <p className="text-white/60 text-sm leading-relaxed mb-6">{log.summary}</p>

        {log.symptoms?.length > 0 && (
          <div className="mb-5">
            <div className="text-white/30 text-xs tracking-widest font-semibold mb-2 uppercase">Symptoms</div>
            <div className="flex flex-wrap gap-2">
              {log.symptoms.map(s => (
                <span key={s} className="text-xs px-3 py-1 rounded-full text-white/60"
                  style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {log.postAppointmentMedications?.length > 0 && (
          <div className="mb-5">
            <div className="text-white/30 text-xs tracking-widest font-semibold mb-2 uppercase">Medications</div>
            <div className="flex flex-col gap-1.5">
              {log.postAppointmentMedications.map(m => (
                <div key={m} className="flex items-center gap-2">
                  <MdFiberManualRecord size={6} style={{ color: "#3B82F6" }} />
                  <span className="text-white/60 text-sm">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {log.postAppointmentPrecautions?.length > 0 && (
          <div>
            <div className="text-white/30 text-xs tracking-widest font-semibold mb-2 uppercase">Precautions</div>
            <div className="flex flex-col gap-1.5">
              {log.postAppointmentPrecautions.map(p => (
                <div key={p} className="flex items-center gap-2">
                  <MdFiberManualRecord size={6} style={{ color: "#F59E0B" }} />
                  <span className="text-white/60 text-sm">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="relative overflow-hidden px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-5 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)",
              border: "1px solid rgba(96,165,250,0.35)",
            }}>
            <span style={{ position: "relative", zIndex: 1 }}><button onClick={() => {
  console.log('electronAPI:', (window as any).electronAPI);
  console.log('questions:', log.questionsForDoctor);
  (window as any).electronAPI?.openCopilot(log.questionsForDoctor);
}}>
  Open Copilot
</button></span>
          </button>

      </div>
      
    </div>
  );
}

const page = () => {
  const { token, userDetails } = useContext(AppContext);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const patientId = localStorage.getItem('patientId');
      const token = localStorage.getItem('token');
      if (!patientId) return;
      const res = await fetch(`http://localhost:4000/api/logs/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const mostRecentLog = logs[0] ?? null;
  const recentSeverity = mostRecentLog ? (mostRecentLog.intensity >= 7 ? 'Severe' : mostRecentLog.intensity >= 4 ? 'Moderate' : 'Mild') : 'Mild';

  useEffect(() => {
    if (!token) redirect('/');
  }, [token]);

  return (
    <>
      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.dashboard-root { font-family: 'DM Sans', sans-serif; }
.card {
  background: linear-gradient(145deg, rgba(15,28,50,0.85) 0%, rgba(8,18,38,0.9) 100%);
  border: 1px solid rgba(96,165,250,0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.card-hover {
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  border-color: rgba(96,165,250,0.3);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(96,165,250,0.1);
}
.log-row {
  transition: background 0.15s ease;
  cursor: pointer;
}
.log-row:hover {
  background: rgba(96,165,250,0.06);
}
.mono { font-family: 'DM Mono', monospace; }
.glow-dot {
  box-shadow: 0 0 6px currentColor;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.5s ease forwards; }
.fade-up-1 { animation-delay: 0.05s; opacity: 0; }
.fade-up-2 { animation-delay: 0.12s; opacity: 0; }
.fade-up-3 { animation-delay: 0.20s; opacity: 0; }
.fade-up-4 { animation-delay: 0.28s; opacity: 0; }

      `}</style>

      <div className="dashboard-root min-h-screen py-8"
        style={{ background: "linear-gradient(135deg, #020810 0%, #050f1f 50%, #020c18 100%)" }}>

        <div className="flex flex-col gap-5">

          {/* ---- Welcome ---- */}
          <div className="card rounded-2xl px-8 py-7 flex justify-between items-center fade-up fade-up-1"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <div>
              <div className="text-white/40 text-sm mono tracking-widest mb-1 uppercase">Dashboard</div>
              <div className="text-3xl font-semibold text-white">
                Welcome back, <span style={{ color: "#60A5FA" }}>{userDetails?.name ?? "there"}</span>
              </div>
              <div className="text-white/40 mt-1 text-sm">How are you feeling today?</div>
            </div>
            <button className="relative overflow-hidden px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)",
                border: "1px solid rgba(96,165,250,0.35)",
              }}>
              <span style={{ position: "relative", zIndex: 1 }}><Link href={'/create-entry'}>Prepare for Appointment</Link></span>
            </button>
          </div>

          {/* ---- Recent Condition + Medications ---- */}
          <div className="grid grid-cols-2 gap-5 fade-up fade-up-2">

            {/* Recent Condition */}
            <div className="card card-hover rounded-2xl p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              <div className="flex justify-between text-white text-2xl cursor-pointer"><div className="text-white/30 text-xs mono tracking-widest mb-5 uppercase">Recent Condition</div> <IoMdVolumeHigh/></div>  
              {mostRecentLog ? (
                <div className="flex gap-4">
                  <div className="w-12 h-12 p-2 rounded-xl flex items-center justify-center flex-0"
                    style={{ background: `${severityConfig[recentSeverity].color}18`, border: `1px solid ${severityConfig[recentSeverity].color}30` }}>
                    <GiStomach size={22} style={{ color: severityConfig[recentSeverity].color }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <SeverityBadge level={recentSeverity} />
                    <div className="text-white text-xl font-semibold">{mostRecentLog.title}</div>
                    <div className="text-white/35 text-sm flex items-center gap-1">
                      <IoCalendarOutline size={13} />
                      {new Date(mostRecentLog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{mostRecentLog.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="text-white/30 text-sm">No conditions logged yet.</div>
              )}
            </div>

            {/* Precautions & Medications */}
            <div className="card card-hover rounded-2xl p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              
              <div className="flex justify-between text-white text-2xl cursor-pointer"><div className="text-white/30 text-xs mono tracking-widest mb-5 uppercase">Precautions & Medications</div> <IoMdVolumeHigh/></div>  

              {mostRecentLog ? (
                <>
                  <div className="mb-4">
                    <div className="text-white/50 text-xs font-semibold mb-2 flex items-center gap-1">
                      <IoMedkit size={12} style={{ color: "#3B82F6" }} /> CURRENT MEDICATIONS
                    </div>
                    {mostRecentLog.postAppointmentMedications?.length > 0 && mostRecentLog.postAppointmentMedications[0] !== 'None' ? (
                      <div className="flex flex-col gap-2">
                        {mostRecentLog.postAppointmentMedications.map((med, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <MdFiberManualRecord size={8} style={{ color: "#3B82F6" }} className="glow-dot" />
                            <span className="text-white/80 text-sm">{med}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/30 text-sm">No medications recorded.</div>
                    )}
                  </div>

                  <div className="h-px mb-4" style={{ background: "rgba(96,165,250,0.08)" }} />

                  <div>
                    <div className="text-white/50 text-xs font-semibold mb-2 flex items-center gap-1">
                      <IoAlertCircleOutline size={12} style={{ color: "#F59E0B" }} /> PRECAUTIONS
                    </div>
                    {mostRecentLog.postAppointmentPrecautions?.length > 0 && mostRecentLog.postAppointmentPrecautions[0] !== 'None' ? (
                      <div className="flex flex-col gap-1.5">
                        {mostRecentLog.postAppointmentPrecautions.map((p, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <MdFiberManualRecord size={6} style={{ color: "#F59E0B", marginTop: 5 }} />
                            <span className="text-white/55 text-sm">{p}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/30 text-sm">No precautions recorded.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-white/30 text-sm">No data yet — generate a report first.</div>
              )}
            </div>
          </div>

          {/* ---- Symptom Log ---- */}
          <div className="card rounded-2xl overflow-hidden fade-up fade-up-3"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(96,165,250,0.08)" }}>
              <div>
                <div className="text-white/30 text-xs mono tracking-widest uppercase">Symptom Log</div>
                <div className="text-white font-semibold mt-0.5">{logs.length} entries recorded</div>
              </div>

            </div>

            {/* Table header */}

            {logs.length === 0 ? (
              <div className="px-6 py-10 text-center text-white/30 text-sm">
                No logs yet — generate a report to create your first entry.
              </div>
            ) : logs.map((log, i) => {
              const severity = log.intensity >= 7 ? 'Severe' : log.intensity >= 4 ? 'Moderate' : 'Mild';
              const cfg = severityConfig[severity];
              return (
                <div key={log._id}
                  onClick={() => setSelectedLog(log)}
                  className="log-row grid px-6 py-4 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 32px",
                    borderBottom: i < logs.length - 1 ? "1px solid rgba(96,165,250,0.05)" : "none",
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-0"
                      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                      <GiStomach size={14} style={{ color: cfg.color }} />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{log.title}</span>
                  </div>
                  <SeverityBadge level={severity} />
                  <span className="text-white/40 text-sm">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-white/40 text-sm">{log.appointmentType}</span>
                  <IoChevronForward size={16} className="text-white/20" />
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};

export default page;