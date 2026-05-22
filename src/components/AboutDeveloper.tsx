import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Award, Mail, Linkedin, ExternalLink, ShieldCheck } from 'lucide-react';
import Toast from './Toast';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface DeveloperInfo {
  name: string;
  title: string;
  qualifications: { title: string; subtitle: string; icon: string }[];
  about: string;
  quote: string;
  email: string;
  linkedin: string;
  whatsapp: string;
  warranty?: string;
}

const AboutDeveloper: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [info, setInfo] = useState<DeveloperInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'developerInfo'), (doc) => {
      if (doc.exists()) {
        setInfo(doc.data() as DeveloperInfo);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatWhatsAppLink = (number: string) => {
    if (!number) return undefined;
    // Remove all non-numeric characters
    let cleanNumber = number.replace(/\D/g, '');
    // If it starts with 0 and is 10 digits, assume South Africa (27)
    if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      cleanNumber = '27' + cleanNumber.substring(1);
    }
    return `https://wa.me/${cleanNumber}`;
  };

  const handleAction = (message: string, link?: string) => {
    if (link) {
      window.open(link, '_blank');
    } else {
      setToast({ message, type: 'info' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const devInfo = info || {
    name: 'Thefixer',
    title: 'Electrical Engineer & Developer',
    qualifications: [
      { title: 'BEng Tech in Electrical Engineering', subtitle: 'University of Johannesburg (UJ)', icon: 'GraduationCap' },
      { title: 'Professional Electrical Engineer', subtitle: 'Specializing in Electronics & Tech Solutions', icon: 'Award' }
    ],
    about: 'I am a passionate Electrical Engineer with a deep interest in bridging the gap between hardware and software. With my background from UJ, I bring a technical precision to every project I build. Thefixer Electronics is a testament to my commitment to quality, sustainability, and innovation in the tech space.',
    quote: 'My goal is to provide high-quality gadgets and refurbished tech that people can trust, backed by engineering expertise.',
    email: '',
    linkedin: '',
    whatsapp: ''
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/5"
      >
        <div className="relative h-48 bg-zinc-900">
          <div className="absolute -bottom-16 left-12">
            <div className="h-32 w-32 rounded-3xl bg-emerald-500 border-4 border-white shadow-xl flex items-center justify-center">
              <span className="text-4xl font-black text-white">
                {devInfo.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-20 pb-12 px-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{devInfo.name}</h1>
              <p className="text-emerald-600 font-bold text-lg">{devInfo.title}</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleAction(devInfo.email ? `Email: ${devInfo.email}` : 'Email feature coming soon!', devInfo.email ? `mailto:${devInfo.email}` : undefined)}
                className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
              >
                <Mail className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleAction('LinkedIn profile coming soon!', devInfo.linkedin)}
                className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Qualifications</h2>
                <div className="space-y-4">
                  {devInfo.qualifications.map((q, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        {q.icon === 'GraduationCap' ? <GraduationCap className="h-6 w-6 text-emerald-600" /> : <Award className="h-6 w-6 text-emerald-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{q.title}</p>
                        <p className="text-sm text-zinc-500">{q.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">About Me</h2>
                <p className="text-zinc-600 leading-relaxed">
                  {devInfo.about}
                </p>
              </section>
              
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-emerald-800 font-medium text-sm italic">
                  "{devInfo.quote}"
                </p>
              </div>

              {devInfo.warranty && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-bold text-zinc-700">{devInfo.warranty}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100 flex justify-between items-center">
            <p className="text-zinc-400 text-sm font-medium">© {new Date().getFullYear()} {devInfo.name} Electronics</p>
            <button 
              onClick={() => handleAction('Contacting on WhatsApp...', formatWhatsAppLink(devInfo.whatsapp))}
              className="text-zinc-900 font-bold flex items-center space-x-2 group"
            >
              <svg className="h-5 w-5 fill-[#25D366] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AboutDeveloper;
