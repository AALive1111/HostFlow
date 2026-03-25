import React, { useState, ReactNode, useEffect, createContext, useContext } from 'react';
import { 
  Menu, 
  X, 
  CheckCircle2, 
  Smartphone, 
  LayoutDashboard, 
  RefreshCw, 
  BarChart3, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight,
  LogOut,
  Plus,
  Building2,
  Trash2,
  Loader2,
  ClipboardList,
  Calendar,
  User as UserIcon,
  Clock,
  AlertCircle,
  Star,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Download,
  BookOpen,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  handleFirestoreError,
  OperationType
} from './firebase';
import { deleteDoc, addDoc, updateDoc } from 'firebase/firestore';

import { 
  Routes, 
  Route, 
  useNavigate, 
  useSearchParams,
  Link,
  Navigate
} from 'react-router-dom';
import emailjs from '@emailjs/browser';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---
interface Property {
  id: string;
  ownerUid: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}

interface Booking {
  id: string;
  propertyId: string;
  ownerUid: string;
  guestName: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  revenue: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp;
}

interface Task {
  id: string;
  propertyId: string;
  ownerUid: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate: Timestamp;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'client';
  plan?: string;
  createdAt: Timestamp;
}

// --- Context ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'client',
              plan: 'none',
              createdAt: serverTimestamp() as Timestamp,
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// --- Dashboard Component (Premium Client Portal) ---
function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const hasPlan = profile?.plan && profile.plan !== 'none';

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section (Top Card) */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
                Your AI Property System is Ready 🚀
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl font-medium opacity-90">
                Activate your plan to start automating your business and increasing bookings.
              </p>
            </div>
          </div>

          {/* Plan Status Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200/60 transition-all duration-300"
          >
            {hasPlan ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-slate-900">Your System is Active</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider">
                        {profile?.plan}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium">Your AI property system is ready to use</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open('https://example.com/app', '_blank')}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group transition-all"
                >
                  Open System
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">No Active Plan</h3>
                    <p className="text-slate-500 font-medium">Activate your plan to unlock your AI system</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/pricing')}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group transition-all"
                >
                  Upgrade Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Actions Section (ONLY if user has a plan) */}
          {hasPlan && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 ml-2">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button 
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => window.open('https://example.com/download', '_blank')}
                  className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Download className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Download System</h4>
                  <p className="text-sm text-slate-500">Get your automation files</p>
                </motion.button>

                <motion.button 
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => window.open('https://wa.me/971588423188', '_blank')}
                  className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">WhatsApp Support</h4>
                  <p className="text-sm text-slate-500">Direct line to our team</p>
                </motion.button>

                <motion.button 
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => window.open('https://example.com/setup-guide', '_blank')}
                  className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Setup Guide</h4>
                  <p className="text-sm text-slate-500">Step-by-step instructions</p>
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// --- Quote Page Component ---
function QuotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan') || 'General';
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.phone) {
      setErrorMessage('All fields are required.');
      setStatus('error');
      return;
    }

    if (!validateEmail(form.email)) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS configuration is missing.');
      }

      await emailjs.send(serviceId, templateId, { ...form, plan }, publicKey);
      setStatus('success');
    } catch (error: any) {
      console.error('EmailJS Error:', error);
      setStatus('error');
      setErrorMessage(error?.message || 'Something went wrong. Please try again later.');
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 bg-slate-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-slate-200 relative overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-200"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-black mb-4 text-slate-900"
          >
            Quote Requested!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-slate-500 mb-10 leading-relaxed font-medium"
          >
            We've received your request for the <span className="text-primary font-bold uppercase">{plan}</span> plan. A specialist will reach out within 24 hours.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
          >
            Return to Homepage
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-slate-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-200 relative"
      >
        <div className="mb-12 text-center">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-black tracking-[0.2em] text-[10px] uppercase block mb-4"
          >
            Premium Onboarding
          </motion.span>
          <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900">Get your custom quote</h2>
          <p className="text-slate-500 font-medium">
            Selected Plan: <span className="text-primary font-bold uppercase">{plan}</span>
          </p>
        </div>

        <motion.form 
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <motion.div variants={inputVariants} className="space-y-2 group">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Full Name</label>
            <div className="relative">
              <motion.input 
                whileFocus={{ scale: 1.01 }}
                type="text" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-200 font-medium text-slate-900"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {form.name.length > 2 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div variants={inputVariants} className="space-y-2 group">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
            <div className="relative">
              <motion.input 
                whileFocus={{ scale: 1.01 }}
                type="email" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-200 font-medium text-slate-900"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {validateEmail(form.email) && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div variants={inputVariants} className="space-y-2 group">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Phone Number</label>
            <div className="relative">
              <motion.input 
                whileFocus={{ scale: 1.01 }}
                type="tel" 
                required
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-200 font-medium text-slate-900"
                placeholder="+62 812 3456 7890"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {form.phone.length > 8 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, x: [0, -4, 4, -4, 4, 0] }}
              className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-rose-100"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
            </motion.div>
          )}

          <motion.button 
            variants={inputVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Request Quotation
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}

// --- Components ---

// --- Pricing Page Component ---
function PricingPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Flexible plans for every host</h2>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">Scale your business with transparent pricing and no hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <PricingCard 
            title="Growth"
            price="2.5JT"
            features={["Up to 5 Properties", "Basic PMS & Automation", "AI WhatsApp Automation", "Booking Management", "Standard Support"]}
            buttonText="Get a Quotation"
          />
          <PricingCard 
            title="Scale"
            price="5JT"
            features={["Up to 15 Properties", "Advanced PMS & Automation", "Channel Manager + OTA Sync", "Signals AI Insights", "Reputation Management", "Mobile App Access"]}
            buttonText="Upgrade Now"
            featured={true}
          />
          <PricingCard 
            title="Enterprise"
            price="Custom"
            features={[ "Unlimited Properties", "Full PMS & Automation", "Channel Manager + OTA Integration", "Signals AI (Revenue Optimization)", "CRM & Guest Management", "Direct Booking Engine", "Payments Integration", "Dedicated Account Manager"]}
            buttonText="Get a Quotation"
          />
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setErrorMessage('All fields are required.');
      setStatus('error');
      return;
    }
    if (!validateEmail(form.email)) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS configuration is missing.');
      }

      await emailjs.send(serviceId, templateId, form, publicKey);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('EmailJS Error:', error);
      setStatus('error');
      setErrorMessage(error?.message || 'Something went wrong.');
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h3 className="text-3xl font-black mb-4 text-slate-900">Message Sent!</h3>
            <p className="text-slate-500 mb-10 font-medium">We'll get back to you as soon as possible.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatus('idle')}
              className="text-primary font-black uppercase tracking-widest text-xs hover:underline"
            >
              Send another message
            </motion.button>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="space-y-2 group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Full Name</label>
                <div className="relative">
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    type="text" 
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-100 font-medium text-slate-900" 
                    placeholder="John Doe" 
                  />
                  {form.name.length > 2 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-2 group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
                <div className="relative">
                  <motion.input 
                    whileFocus={{ scale: 1.01 }}
                    type="email" 
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-100 font-medium text-slate-900" 
                    placeholder="john@example.com" 
                  />
                  {validateEmail(form.email) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
            <motion.div variants={itemVariants} className="space-y-2 group">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Subject</label>
              <motion.input 
                whileFocus={{ scale: 1.01 }}
                type="text" 
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-100 font-medium text-slate-900" 
                placeholder="How can we help?" 
              />
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-2 group">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Message</label>
              <motion.textarea 
                whileFocus={{ scale: 1.01 }}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-primary focus:bg-white outline-none transition-all bg-slate-50/50 hover:border-slate-100 h-32 resize-none font-medium text-slate-900" 
                placeholder="Tell us more about your needs..."
              ></motion.textarea>
            </motion.div>
            
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, x: [0, -4, 4, -4, 4, 0] }}
                className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-100"
              >
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </motion.div>
            )}

            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={status === 'submitting'}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : 'Send Message'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup was closed by the user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Login request was cancelled due to a newer request.");
      } else {
        console.error("Login error:", error);
      }
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-48 md:pb-40 bg-hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 max-w-4xl mx-auto leading-tight"
          >
            Stop replying to guest messages all day
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-lg md:text-2xl mb-10 md:mb-12 max-w-2xl mx-auto font-light opacity-90 px-4"
          >
            Automate bookings, WhatsApp, and operations — all in one simple system designed for modern hosts.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={handleLogin}
              className="w-full sm:w-auto bg-white text-primary px-10 py-4 rounded-full text-lg font-bold hover:translate-y-[-3px] transition-all duration-300 shadow-2xl active:scale-95"
            >
              Get Started with Google
            </button>
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Secure Authentication
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="text-primary font-bold tracking-widest text-xs uppercase block mb-4">Core Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">Everything you need to Host</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Smartphone className="w-7 h-7" />}
              title="Marketplace Full OTA Access"
              description="Full integration with all major booking platforms."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-7 h-7" />}
              title="PMS Dashboard"
              description="The command center for your property. Manage check-ins, cleaning, and guest data in one place."
            />
            <FeatureCard 
              icon={<RefreshCw className="w-7 h-7" />}
              title="Signals AI"
              description="Advanced analytics, predictive insights, and revenue optimization."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-7 h-7" />}
              title="Reputation Management"
              description="Full review monitoring, automation, and performance insights."
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-surface-container-low overflow-hidden" id="comparison">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HostFlow?</h2>
            <p className="text-on-surface-variant">Let AI Run Your Property Business.</p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[600px] border-collapse bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-primary text-on-primary">
                  <th className="py-6 px-8 text-left font-bold">Feature</th>
                  <th className="py-6 px-8 text-center font-bold">HostFlow</th>
                  <th className="py-6 px-8 text-center font-bold">Standard Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <ComparisonRow label="AI WhatsApp Concierge" hostflow={true} standard={false} />
                <ComparisonRow label="Real-time OTA Sync" hostflow={true} standard={true} />
                <ComparisonRow label="Automated Task Management" hostflow={true} standard={false} />
                <ComparisonRow label="Revenue Optimization AI" hostflow={true} standard={false} />
                <ComparisonRow label="Direct Booking Engine" hostflow={true} standard={true} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32 px-6" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Flexible plans for every host</h2>
            <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">Scale your business with transparent pricing and no hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <PricingCard 
              title="Growth"
              price="2.5JT"
              features={["Up to 5 Properties", "Basic PMS & Automation", "AI WhatsApp Automation", "Booking Management", "Standard Support"]}
              buttonText="Get a Quotation"
            />
            <PricingCard 
              title="Scale"
              price="5JT"
              features={["Up to 15 Properties", "Advanced PMS & Automation", "Channel Manager + OTA Sync", "Signals AI Insights", "Reputation Management", "Mobile App Access"]}
              buttonText="Upgrade Now"
              featured={true}
            />
            <PricingCard 
              title="Enterprise"
              price="Custom"
              features={[ "Unlimited Properties", "Full PMS & Automation", "Channel Manager + OTA Integration", "Signals AI (Revenue Optimization)", "CRM & Guest Management", "Direct Booking Engine", "Payments Integration", "Dedicated Account Manager"]}
              buttonText="Get a Quotation"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-surface-container-lowest" id="testimonials">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest text-xs uppercase block mb-4">Success Stories</span>
            <h2 className="text-4xl font-bold text-on-surface tracking-tight">Trusted by 1,000+ hosts worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="HostFlow changed my life. I went from spending 4 hours a day on guest messages to just 15 minutes."
              author="Sarah Jenkins"
              role="Superhost, Bali"
              image="https://picsum.photos/seed/sarah/100/100"
            />
            <TestimonialCard 
              quote="The AI WhatsApp concierge is a game changer. My guests love the instant responses at 2 AM."
              author="Michael Chen"
              role="Property Manager, Singapore"
              image="https://picsum.photos/seed/michael/100/100"
            />
            <TestimonialCard 
              quote="Scaling from 2 to 15 properties was only possible because of HostFlow's automation."
              author="Emma Wilson"
              role="Host, London"
              image="https://picsum.photos/seed/emma/100/100"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-on-surface-variant">Everything you need to know about the platform.</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="How does the WhatsApp AI work?"
              answer="Our AI connects directly to your WhatsApp Business API. It uses advanced natural language processing to understand guest inquiries and provide accurate, helpful responses based on your property rules and local recommendations."
            />
            <FAQItem 
              question="Can I sync with multiple marketplaces?"
              answer="Yes! HostFlow offers direct, real-time synchronization with Airbnb, Booking.com, Agoda, and VRBO. Any booking on one platform instantly blocks the dates on all others."
            />
            <FAQItem 
              question="Is there a setup fee?"
              answer="No, we don't charge any setup fees. You can start with our Growth plan for free and upgrade as your business grows."
            />
            <FAQItem 
              question="Do you offer 24/7 support?"
              answer="Absolutely. Our Scale and Enterprise plans include 24/7 priority support via WhatsApp and Email. Growth plan users have access to our comprehensive help center and email support."
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-surface-container-low px-6" id="contact">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-8">Get in touch</h2>
              <p className="text-on-surface-variant text-lg mb-12">Have questions about how HostFlow can help your business? Our team is here to help you automate and scale.</p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Email Us</p>
                    <p className="text-on-surface-variant">hello@hostflow.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Call Us</p>
                    <p className="text-on-surface-variant">+971 58 842 3188</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Visit Us</p>
                    <p className="text-on-surface-variant">Jl. Sunset Road No. 123, Seminyak, Bali</p>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <AppContent isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </AuthProvider>
  );
}

function AppContent({ isMenuOpen, setIsMenuOpen }: { isMenuOpen: boolean, setIsMenuOpen: (o: boolean) => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup was closed by the user.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log("Login request was cancelled due to a newer request.");
      } else {
        console.error("Login error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900 font-headline">HostFlow</Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            {!user ? (
              <>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="/#features">Features</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="/#testimonials">Testimonials</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="/#faq">FAQ</a>
                <Link to="/pricing" className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium">Pricing</Link>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="/#contact">Contact</a>
                <button 
                  onClick={handleLogin}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold hover:translate-y-[-2px] transition-all duration-300 shadow-lg active:scale-95"
                >
                  Login
                </button>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 text-sm font-bold">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/pricing" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 text-sm font-bold">
                  Pricing
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-outline-variant" alt="User" />
                  <span className="text-sm font-bold text-on-surface">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-white border-t p-6 flex flex-col gap-4 shadow-xl"
            >
              {!user ? (
                <>
                  <a className="text-slate-600 font-medium py-2" href="/#features" onClick={() => setIsMenuOpen(false)}>Features</a>
                  <a className="text-slate-600 font-medium py-2" href="/#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
                  <a className="text-slate-600 font-medium py-2" href="/#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                  <Link to="/pricing" className="text-slate-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                  <a className="text-slate-600 font-medium py-2" href="/#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
                  <button onClick={handleLogin} className="bg-primary text-on-primary px-6 py-3 rounded-full font-semibold mt-4">
                    Login
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-on-surface-variant font-bold py-2 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link to="/pricing" className="text-on-surface-variant font-bold py-2" onClick={() => setIsMenuOpen(false)}>
                    Pricing
                  </Link>
                  <div className="flex items-center gap-3 py-2 border-b border-outline-variant mt-2">
                    <img src={user.photoURL || ''} className="w-10 h-10 rounded-full" alt="User" />
                    <span className="font-bold text-on-surface">{user.displayName}</span>
                  </div>
                  <button onClick={handleLogout} className="text-error font-bold flex items-center gap-2 py-2">
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/quote" element={<QuotePage />} />
      </Routes>

      {/* Final CTA (Only on landing) */}
      {!user && (
        <section className="py-24 px-6 bg-cta-gradient relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-8">Start increasing your bookings today</h2>
            <p className="text-blue-100 text-lg mb-12 opacity-80 max-w-xl mx-auto">Join over 1,000+ hosts who have automated their property management workflow.</p>
            <button 
              onClick={() => {
                const phone = "971588423188";
                const message = "Hello, I'm interested in HostFlow.";
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                window.open(url, "_blank");
              }}
              className="bg-[#25D366] text-white px-10 py-5 rounded-full text-xl font-bold flex items-center gap-3 mx-auto hover:scale-105 transition-transform shadow-2xl"
            >
              <MessageSquare className="w-6 h-6 fill-current" />
              Chat on WhatsApp
            </button>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-container/10 rounded-full blur-2xl -ml-32 -mb-32"></div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-50 py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="text-xl font-bold text-slate-900">HostFlow</div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">The premium automation shell for modern short-term rental businesses. Automate, scale, and grow your property management empire.</p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-slate-200 shadow-sm"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
          <FooterColumn title="Product" links={["Features", "Pricing", "Testimonials", "FAQ"]} />
          <FooterColumn title="Company" links={["About Us", "Careers", "Contact", "Blog"]} />
          <FooterColumn title="Legal" links={["Privacy Policy", "Terms of Service", "Cookie Policy"]} />
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-200 text-center text-slate-400 text-xs">
          © 2024 HostFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm hover:translate-y-[-8px] transition-all duration-500 border border-outline-variant/10 group">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-500 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-on-surface">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed">{description}</p>
    </div>
  );
}

function ComparisonRow({ label, hostflow, standard }: { label: string, hostflow: boolean, standard: boolean }) {
  return (
    <tr>
      <td className="py-6 px-8 font-medium">{label}</td>
      <td className="py-6 px-8 text-center">
        {hostflow ? <CheckCircle2 className="w-6 h-6 text-primary mx-auto" /> : <X className="w-6 h-6 text-outline-variant mx-auto" />}
      </td>
      <td className="py-6 px-8 text-center">
        {standard ? <CheckCircle2 className="w-6 h-6 text-primary mx-auto" /> : <X className="w-6 h-6 text-outline-variant mx-auto" />}
      </td>
    </tr>
  );
}

function PricingCard({ title, price, features, buttonText, featured = false }: { title: string, price: string, features: string[], buttonText: string, featured?: boolean }) {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      whileHover={{ 
        scale: 1.03,
        y: -8,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-6 sm:p-10 rounded-[2.5rem] flex flex-col h-full transition-all duration-300 ${
      featured 
        ? 'bg-white border-2 border-primary ring-8 ring-primary/5 relative z-10' 
        : 'bg-white border border-slate-100 shadow-sm'
    }`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] uppercase font-black px-4 py-1 rounded-full tracking-widest shadow-lg shadow-primary/20">
          Most Popular
        </div>
      )}
      <h3 className={`text-xl font-black mb-2 tracking-tight ${featured ? 'text-primary' : 'text-slate-900'}`}>{title}</h3>
      <div className="flex items-baseline gap-1 mb-8">
        {price !== 'Custom' && <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Rp</span>}
        <span className="text-5xl font-black text-slate-900 tracking-tighter">{price}</span>
        {price !== 'Custom' && <span className="text-slate-400 font-bold text-sm">/mo</span>}
      </div>
      <ul className="space-y-5 mb-10 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {f}
          </li>
        ))}
      </ul>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/quote?plan=${title.toLowerCase()}`)}
        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
        featured 
          ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30' 
          : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
      }`}>
        {buttonText}
      </motion.button>
    </motion.div>
  );
}

function FooterColumn({ title, links }: { title: string, links: string[] }) {
  return (
    <div>
      <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">{title}</h4>
      <ul className="space-y-4 text-sm text-slate-500">
        {links.map((l, i) => (
          <li key={i}><a className="hover:text-slate-900 transition-colors" href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}>{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({ quote, author, role, image }: { quote: string, author: string, role: string, image: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col h-full">
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-on-surface-variant italic mb-8 flex-grow">"{quote}"</p>
      <div className="flex items-center gap-4 pt-6 border-t border-outline-variant/5">
        <img src={image} className="w-12 h-12 rounded-full object-cover" alt={author} />
        <div>
          <p className="font-bold text-on-surface">{author}</p>
          <p className="text-xs text-on-surface-variant">{role}</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface-container-lowest transition-colors"
      >
        <span className="font-bold text-on-surface">{question}</span>
        <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

