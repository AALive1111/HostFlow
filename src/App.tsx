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
  Facebook
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

// --- Components ---

function AnalyticsDashboard({ properties, bookings }: { properties: Property[], bookings: Booking[] }) {
  // Process data for charts
  const revenueByMonth = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc: any[], booking) => {
      const date = booking.checkIn.toDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const label = `${month} ${year}`;
      
      const existing = acc.find(item => item.name === label);
      if (existing) {
        existing.revenue += booking.revenue;
      } else {
        acc.push({ name: label, revenue: booking.revenue, date });
      }
      return acc;
    }, [])
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const occupancyByProperty = properties.map(prop => {
    const propBookings = bookings.filter(b => b.propertyId === prop.id && b.status !== 'cancelled');
    // Simple occupancy calculation: (booked days / total days in period)
    // For this demo, we'll just show number of bookings as a proxy or a mock percentage
    const occupancy = Math.min(100, Math.floor(propBookings.length * 15 + Math.random() * 20));
    return { name: prop.name, occupancy };
  });

  const statusData = [
    { name: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#10b981' },
    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#3b82f6' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.revenue, 0);

  const avgOccupancy = occupancyByProperty.length > 0 
    ? Math.floor(occupancyByProperty.reduce((sum, item) => sum + item.occupancy, 0) / occupancyByProperty.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Revenue</p>
          <h3 className="text-3xl font-bold text-primary">Rp {totalRevenue.toLocaleString()}</h3>
          <p className="text-xs text-green-600 mt-2 font-bold">+12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Avg. Occupancy</p>
          <h3 className="text-3xl font-bold text-on-surface">{avgOccupancy}%</h3>
          <p className="text-xs text-blue-600 mt-2 font-bold">Stable performance</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Bookings</p>
          <h3 className="text-3xl font-bold text-on-surface">{bookings.length}</h3>
          <p className="text-xs text-on-surface-variant mt-2 font-bold">{bookings.filter(b => b.status === 'confirmed').length} upcoming</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="text-xl font-bold mb-8">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `Rp ${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy by Property */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="text-xl font-bold mb-8">Occupancy by Property</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyByProperty} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Occupancy']}
                />
                <Bar dataKey="occupancy" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="text-xl font-bold mb-8">Booking Status</h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              {statusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-on-surface-variant">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings List */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10">
          <h3 className="text-xl font-bold mb-8">Recent Bookings</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/5">
                <div>
                  <p className="font-bold text-on-surface">{booking.guestName}</p>
                  <p className="text-xs text-on-surface-variant">{booking.checkIn.toDate().toLocaleDateString()} - {booking.checkOut.toDate().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">Rp {booking.revenue.toLocaleString()}</p>
                  <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksView({ properties, tasks, onUpdateStatus, onDeleteTask, onAddTask }: { 
  properties: Property[], 
  tasks: Task[], 
  onUpdateStatus: (id: string, status: Task['status']) => void,
  onDeleteTask: (id: string) => void,
  onAddTask: (task: Partial<Task>) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: '',
    propertyId: properties[0]?.id || '',
    priority: 'medium',
    status: 'todo'
  });
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.propertyId || !dueDate) return;
    
    onAddTask({
      ...newTask,
      dueDate: Timestamp.fromDate(new Date(dueDate))
    });
    setIsAdding(false);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      propertyId: properties[0]?.id || '',
      priority: 'medium',
      status: 'todo'
    });
    setDueDate('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const isOverdue = (date: Timestamp) => {
    return date.toDate() < new Date() && date.toDate().toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Maintenance & Cleaning</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-outline-variant/10"
        >
          <h3 className="text-xl font-bold mb-6">Create New Task</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Task Title</label>
              <input 
                type="text" 
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="e.g. Deep clean kitchen"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Property</label>
              <select 
                value={newTask.propertyId}
                onChange={(e) => setNewTask({...newTask, propertyId: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none bg-white"
                required
              >
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Assigned To</label>
              <input 
                type="text" 
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                placeholder="e.g. John Cleaner"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Priority</label>
              <select 
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant">Description</label>
              <textarea 
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Any special instructions..."
                className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none h-12"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold">Create Task</button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-on-surface-variant font-bold px-8 py-3">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(['todo', 'in-progress', 'completed'] as const).map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-on-surface-variant uppercase text-xs tracking-widest flex items-center gap-2">
                {status === 'todo' && <Clock className="w-4 h-4" />}
                {status === 'in-progress' && <RefreshCw className="w-4 h-4 animate-spin-slow" />}
                {status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                {status.replace('-', ' ')}
              </h3>
              <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px] font-bold">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="space-y-4 min-h-[200px]">
              {tasks.filter(t => t.status === status).map((task) => (
                <motion.div 
                  key={task.id}
                  layoutId={task.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/10 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1">
                      {status !== 'completed' && (
                        <button 
                          onClick={() => onUpdateStatus(task.id, status === 'todo' ? 'in-progress' : 'completed')}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-full transition-colors"
                          title="Move to next stage"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 hover:bg-error/10 text-error rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-on-surface mb-1">{task.title}</h4>
                  <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/5">
                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{properties.find(p => p.id === task.propertyId)?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                        <UserIcon className="w-3 h-3" />
                        <span>{task.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${isOverdue(task.dueDate) && status !== 'completed' ? 'text-error' : 'text-on-surface-variant'}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate.toDate().toLocaleDateString()}</span>
                        {isOverdue(task.dueDate) && status !== 'completed' && <AlertCircle className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-outline-variant/10 rounded-2xl">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'properties' | 'analytics' | 'tasks'>('properties');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch Properties
    const qProps = query(collection(db, 'properties'), where('ownerUid', '==', user.uid));
    const unsubProps = onSnapshot(qProps, (snapshot) => {
      const props = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(props);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    });

    // Fetch Bookings
    const qBookings = query(collection(db, 'bookings'), where('ownerUid', '==', user.uid));
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const bks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    // Fetch Tasks
    const qTasks = query(collection(db, 'tasks'), where('ownerUid', '==', user.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const tks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tks);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => {
      unsubProps();
      unsubBookings();
      unsubTasks();
    };
  }, [user]);

  const generateSampleData = async () => {
    if (!user || properties.length === 0) return;
    
    try {
      const guests = ['Noah Elie', 'Sarah Jenkins', 'Michael Chen', 'Emma Wilson', 'David Miller', 'Sofia Garcia'];
      const statuses: ('confirmed' | 'completed' | 'cancelled')[] = ['completed', 'completed', 'confirmed', 'cancelled', 'completed'];
      
      for (let i = 0; i < 15; i++) {
        const prop = properties[Math.floor(Math.random() * properties.length)];
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 90));
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3 + Math.floor(Math.random() * 5));
        
        const bookingRef = doc(collection(db, 'bookings'));
        await setDoc(bookingRef, {
          id: bookingRef.id,
          propertyId: prop.id,
          ownerUid: user.uid,
          guestName: guests[Math.floor(Math.random() * guests.length)],
          checkIn: Timestamp.fromDate(checkIn),
          checkOut: Timestamp.fromDate(checkOut),
          revenue: 1500000 + Math.floor(Math.random() * 3000000),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          createdAt: serverTimestamp(),
        });
      }

      // Generate sample tasks
      const taskTitles = ['Deep clean kitchen', 'Fix leaky faucet', 'Restock toiletries', 'Check smoke detectors', 'Mow the lawn', 'Wash curtains'];
      const taskPriorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      const taskStatuses: ('todo' | 'in-progress' | 'completed')[] = ['todo', 'in-progress', 'completed'];
      const assignees = ['John Cleaner', 'Mike Handyman', 'Self', 'Sarah Staff'];

      for (let i = 0; i < 8; i++) {
        const prop = properties[Math.floor(Math.random() * properties.length)];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (Math.floor(Math.random() * 10) - 3));
        
        const taskRef = doc(collection(db, 'tasks'));
        await setDoc(taskRef, {
          id: taskRef.id,
          propertyId: prop.id,
          ownerUid: user.uid,
          title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
          description: 'Standard maintenance procedure for this property.',
          assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
          dueDate: Timestamp.fromDate(dueDate),
          status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
          priority: taskPriorities[Math.floor(Math.random() * taskPriorities.length)],
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sample_data');
    }
  };

  const handleAddProperty = async (e: any) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    try {
      const propertiesRef = collection(db, 'properties');
      const docRef = doc(propertiesRef);
      const newProp = {
        id: docRef.id,
        ownerUid: user.uid,
        name: newName,
        address: newAddress,
        status: 'active' as const,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(docRef, newProp);
      
      setNewName('');
      setNewAddress('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'properties');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'properties', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `properties/${id}`);
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!user) return;
    try {
      const taskRef = doc(collection(db, 'tasks'));
      await setDoc(taskRef, {
        ...taskData,
        id: taskRef.id,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Welcome back, {profile?.displayName || 'Host'}</h1>
          <p className="text-on-surface-variant">Manage your properties and track your performance.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container p-1 rounded-full overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setView('properties')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${view === 'properties' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            Properties
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${view === 'analytics' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setView('tasks')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${view === 'tasks' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            Tasks
          </button>
        </div>
      </div>

      {view === 'properties' && (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Your Properties</h2>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
          </div>

          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-white p-8 rounded-3xl shadow-xl border border-outline-variant/10"
            >
              <h2 className="text-xl font-bold mb-6">New Property Details</h2>
              <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Property Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Sunset Villa"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Address</label>
                  <input 
                    type="text" 
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. 123 Beach Rd, Bali"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold">Save Property</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-on-surface-variant font-bold px-8 py-3">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-surface-container rounded-3xl border-2 border-dashed border-outline-variant">
                  <Building2 className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                  <p className="text-on-surface-variant font-medium">No properties added yet. Start by adding your first one!</p>
                </div>
              ) : (
                properties.map((prop) => (
                  <motion.div 
                    key={prop.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10 group relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-error/10 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-on-surface">{prop.name}</h3>
                    <p className="text-on-surface-variant text-sm mb-4">{prop.address || 'No address provided'}</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${prop.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{prop.status}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {view === 'analytics' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {bookings.length === 0 ? (
            <div className="py-20 text-center bg-surface-container rounded-3xl border-2 border-dashed border-outline-variant">
              <BarChart3 className="w-12 h-12 text-outline-variant mx-auto mb-4" />
              <p className="text-on-surface-variant font-medium mb-6">No booking data available for analytics.</p>
              {properties.length > 0 && (
                <button 
                  onClick={generateSampleData}
                  className="bg-primary/10 text-primary px-6 py-3 rounded-full font-bold hover:bg-primary/20 transition-all"
                >
                  Generate Sample Data
                </button>
              )}
            </div>
          ) : (
            <AnalyticsDashboard properties={properties} bookings={bookings} />
          )}
        </div>
      )}

      {view === 'tasks' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <TasksView 
            properties={properties} 
            tasks={tasks} 
            onUpdateStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
          />
        </div>
      )}
    </div>
  );
}

function LandingPage() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 bg-hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight"
          >
            Stop replying to guest messages all day
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light opacity-90"
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
              className="bg-white text-primary px-10 py-4 rounded-full text-lg font-bold hover:translate-y-[-3px] transition-all duration-300 shadow-2xl"
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
            <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">Everything you need to scale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Smartphone className="w-7 h-7" />}
              title="AI WhatsApp"
              description="24/7 automated responses that sound human. Handle inquiries and bookings while you sleep."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-7 h-7" />}
              title="PMS Dashboard"
              description="The command center for your property. Manage check-ins, cleaning, and guest data in one place."
            />
            <FeatureCard 
              icon={<RefreshCw className="w-7 h-7" />}
              title="Marketplace Sync"
              description="Real-time synchronization with Airbnb, Booking.com, and Agoda. Never worry about double bookings."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-7 h-7" />}
              title="Analytics"
              description="Deep insights into occupancy rates and revenue trends. Make data-driven decisions to grow."
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-surface-container-low" id="comparison">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HostFlow?</h2>
            <p className="text-on-surface-variant">See how we compare to traditional management methods.</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-outline-variant/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="py-6 px-8 text-on-surface font-bold">Features</th>
                  <th className="py-6 px-8 text-center text-primary font-bold">HostFlow AI</th>
                  <th className="py-6 px-8 text-center text-on-surface-variant font-medium">Standard PMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <ComparisonRow label="Automated PMS" hostflow={true} standard={true} />
                <ComparisonRow label="WhatsApp AI Concierge" hostflow={true} standard={false} />
                <ComparisonRow label="Marketplace Integration" hostflow={true} standard={true} />
                <ComparisonRow label="Mobile Operations App" hostflow={true} standard={false} />
                <ComparisonRow label="Integrated Payments" hostflow={true} standard={false} />
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
              features={["Up to 5 properties", "Basic WhatsApp Bot", "Email Support"]}
              buttonText="Start for free"
            />
            <PricingCard 
              title="Scale"
              price="5JT"
              features={["Unlimited properties", "Advanced AI WhatsApp", "Marketplace Direct Sync", "Priority Support 24/7"]}
              buttonText="Get Started Now"
              featured={true}
            />
            <PricingCard 
              title="Enterprise"
              price="Custom"
              features={["Custom integrations", "Account Manager", "Training & Onboarding"]}
              buttonText="Contact Sales"
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
                    <p className="text-on-surface-variant">+62 812 3456 7890</p>
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

            <div className="bg-white p-10 rounded-3xl shadow-xl border border-outline-variant/10">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Subject</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Message</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary outline-none h-32" placeholder="Tell us more about your needs..."></textarea>
                </div>
                <button type="button" className="w-full bg-primary text-on-primary py-4 rounded-full font-bold hover:shadow-lg transition-all">Send Message</button>
              </form>
            </div>
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
    } catch (error) {
      console.error("Login error:", error);
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
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-headline">HostFlow</div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            {!user ? (
              <>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="#features">Features</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="#testimonials">Testimonials</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="#faq">FAQ</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="#pricing">Pricing</a>
                <a className="text-slate-600 hover:text-primary transition-colors duration-200 text-sm font-medium" href="#contact">Contact</a>
                <button 
                  onClick={handleLogin}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold hover:translate-y-[-2px] transition-all duration-300 shadow-lg active:scale-95"
                >
                  Login
                </button>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
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
                  <a className="text-slate-600 font-medium py-2" href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
                  <a className="text-slate-600 font-medium py-2" href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
                  <a className="text-slate-600 font-medium py-2" href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                  <a className="text-slate-600 font-medium py-2" href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                  <a className="text-slate-600 font-medium py-2" href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
                  <button onClick={handleLogin} className="bg-primary text-on-primary px-6 py-3 rounded-full font-semibold mt-4">
                    Login
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 py-2 border-b border-outline-variant">
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

      {user ? <Dashboard /> : <LandingPage />}

      {/* Final CTA (Only on landing) */}
      {!user && (
        <section className="py-24 px-6 bg-cta-gradient relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-8">Start increasing your bookings today</h2>
            <p className="text-blue-100 text-lg mb-12 opacity-80 max-w-xl mx-auto">Join over 1,000+ hosts who have automated their property management workflow.</p>
            <button className="bg-[#25D366] text-white px-10 py-5 rounded-full text-xl font-bold flex items-center gap-3 mx-auto hover:scale-105 transition-transform shadow-2xl">
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
  return (
    <div className={`p-10 rounded-3xl flex flex-col h-full transition-all duration-300 ${
      featured 
        ? 'bg-white shadow-2xl border-2 border-primary ring-4 ring-primary/5 md:scale-105 relative z-10' 
        : 'bg-white shadow-sm border border-outline-variant/10 hover:translate-y-[-4px]'
    }`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] uppercase font-black px-4 py-1 rounded-full tracking-widest">
          Most Popular
        </div>
      )}
      <h3 className={`text-lg font-bold mb-2 ${featured ? 'text-primary' : 'text-on-surface-variant'}`}>{title}</h3>
      <div className="flex items-baseline gap-1 mb-8">
        {price !== 'Custom' && <span className="text-sm font-bold text-on-surface">Rp</span>}
        <span className="text-4xl font-bold text-on-surface">{price}</span>
        {price !== 'Custom' && <span className="text-on-surface-variant text-sm">/mo</span>}
      </div>
      <ul className="space-y-4 mb-10 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-full font-bold transition-all ${
        featured 
          ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30' 
          : 'border border-primary text-primary hover:bg-primary hover:text-white'
      }`}>
        {buttonText}
      </button>
    </div>
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
