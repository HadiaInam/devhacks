 'use client'
import Groq from 'groq-sdk';
import { useEffect, useState } from 'react';

interface Section { title: string; content: string; }
interface PostReport { overview: string; sections: Section[]; keyTakeaway: string; }

const icons: Record<string, string> = {
  diagnosis: "🔍", medication: "💊", medications: "💊",
  "care instructions": "🩹", "follow-up": "📅",
  "test results": "🧪", "lifestyle advice": "🌿", warnings: "⚠️",
};

export default function Page() {
  const [postReport, setPostReport] = useState<PostReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const text = sessionStorage.getItem('consultationText');
    if (text) generateReport(text);
  }, []);

  const generateReport = async (consultationText: string) => {
    setLoading(true);
    try {
      const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });
      const result = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `You are a medical assistant. Organize what the doctor said into clear simple sections. Only include what was discussed.

TRANSCRIPT: ${consultationText}

Respond ONLY in JSON:
{
  "overview": "brief summary",
  "sections": [{ "title": "section name", "content": "what was said" }],
  "keyTakeaway": "most important thing to remember"
}` }],
        max_tokens: 2000,
      });
      const text = result.choices[0]?.message?.content || '';
      setPostReport(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">⏳ Summarizing your appointment...</div>;
  if (!postReport) return <div className="text-white/50 text-center mt-20">No transcript found.</div>;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "linear-gradient(135deg, #020810 0%, #050f1f 100%)" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-semibold text-white mb-6">Appointment Summary</h1>

        <div className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.1)", borderLeft: "4px solid #10B981" }}>
          <div className="font-bold text-white mb-1">🌟 Key Takeaway</div>
          <div className="text-white/80">{postReport.keyTakeaway}</div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "rgba(15,28,50,0.85)", border: "1px solid rgba(96,165,250,0.12)" }}>
          <div className="font-bold text-white mb-1">📋 Overview</div>
          <div className="text-white/70">{postReport.overview}</div>
        </div>

        {postReport.sections?.map((section, i) => (
          <div key={i} className="rounded-2xl p-5" style={{
            background: "rgba(15,28,50,0.85)",
            border: "1px solid rgba(96,165,250,0.12)",
            borderLeft: section.title.toLowerCase().includes("warning") ? "4px solid #F59E0B" : undefined
          }}>
            <div className="font-bold text-white mb-1">{icons[section.title.toLowerCase()] || "📌"} {section.title}</div>
            <div className="text-white/70">{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}