// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  services: string[];
  location: string;
  founded: string;
  employees: string;
  verified: boolean;
  featured: boolean;
  revenue: string;
  completionRate: number;
}

export interface Task {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee: string;
  dueDate: string;
  project: string;
  description: string;
}

export interface Contract {
  id: string;
  client: string;
  value: number;
  status: 'active' | 'pending' | 'expired' | 'draft';
  startDate: string;
  endDate: string;
  type: string;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  issuedDate: string;
  items: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'provider' | 'buyer' | 'employee';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  avatar: string;
}

export interface KPI {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  provider: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: 'active' | 'on-leave' | 'inactive';
  joinDate: string;
  kpiScore: number;
  avatar: string;
}

// ─── PROVIDERS ────────────────────────────────────────────────────────────────

export const mockProviders: Provider[] = [
  {
    id: 'p1',
    name: 'TechSphere Solutions',
    logo: 'TS',
    category: 'Software Development',
    rating: 4.9,
    reviews: 247,
    description: 'Full-stack software development company specializing in enterprise SaaS, mobile apps, and cloud infrastructure.',
    services: ['Web Development', 'Mobile Apps', 'Cloud Architecture', 'DevOps'],
    location: 'Dubai, UAE',
    founded: '2018',
    employees: '50-100',
    verified: true,
    featured: true,
    revenue: '$2.4M',
    completionRate: 97,
  },
  {
    id: 'p2',
    name: 'CreativeForge Agency',
    logo: 'CF',
    category: 'Design & Branding',
    rating: 4.8,
    reviews: 189,
    description: 'Award-winning creative agency delivering brand identities, UI/UX design, and digital marketing campaigns.',
    services: ['Branding', 'UI/UX Design', 'Motion Graphics', 'Marketing'],
    location: 'Riyadh, KSA',
    founded: '2016',
    employees: '20-50',
    verified: true,
    featured: true,
    revenue: '$1.1M',
    completionRate: 95,
  },
  {
    id: 'p3',
    name: 'DataPulse Analytics',
    logo: 'DP',
    category: 'Data & AI',
    rating: 4.7,
    reviews: 132,
    description: 'Data science and AI consultancy helping businesses unlock insights through machine learning and analytics.',
    services: ['Data Analytics', 'Machine Learning', 'BI Dashboards', 'AI Consulting'],
    location: 'Cairo, Egypt',
    founded: '2020',
    employees: '10-20',
    verified: true,
    featured: false,
    revenue: '$800K',
    completionRate: 93,
  },
  {
    id: 'p4',
    name: 'CloudNine Infrastructure',
    logo: 'CN',
    category: 'Cloud & DevOps',
    rating: 4.6,
    reviews: 98,
    description: 'Cloud infrastructure specialists with expertise in AWS, GCP, and Azure migrations and optimization.',
    services: ['Cloud Migration', 'DevOps', 'Security', 'Monitoring'],
    location: 'Abu Dhabi, UAE',
    founded: '2019',
    employees: '20-50',
    verified: true,
    featured: false,
    revenue: '$1.5M',
    completionRate: 96,
  },
  {
    id: 'p5',
    name: 'GrowthLab Marketing',
    logo: 'GL',
    category: 'Digital Marketing',
    rating: 4.5,
    reviews: 215,
    description: 'Performance marketing agency specializing in ROI-driven campaigns across SEO, SEM, and social media.',
    services: ['SEO', 'Google Ads', 'Social Media', 'Content Strategy'],
    location: 'Amman, Jordan',
    founded: '2017',
    employees: '20-50',
    verified: false,
    featured: false,
    revenue: '$600K',
    completionRate: 91,
  },
  {
    id: 'p6',
    name: 'SecureNet Cybersecurity',
    logo: 'SN',
    category: 'Cybersecurity',
    rating: 4.9,
    reviews: 76,
    description: 'Enterprise cybersecurity firm providing penetration testing, compliance audits, and 24/7 SOC services.',
    services: ['Pen Testing', 'SOC', 'Compliance', 'Risk Assessment'],
    location: 'Manama, Bahrain',
    founded: '2015',
    employees: '50-100',
    verified: true,
    featured: true,
    revenue: '$3.2M',
    completionRate: 99,
  },
];

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const mockTasks: Task[] = [
  { id: 't1', title: 'Implement OAuth 2.0 integration', priority: 'P0', status: 'in-progress', assignee: 'Ahmed K.', dueDate: '2026-04-18', project: 'Client Portal v2', description: 'Integrate Google and Microsoft OAuth providers.' },
  { id: 't2', title: 'Design system component library', priority: 'P1', status: 'review', assignee: 'Sara M.', dueDate: '2026-04-20', project: 'Brand Refresh', description: 'Build reusable Figma components and document usage.' },
  { id: 't3', title: 'Database migration to PostgreSQL', priority: 'P0', status: 'todo', assignee: 'Khaled R.', dueDate: '2026-04-22', project: 'Infra Upgrade', description: 'Migrate legacy MySQL to Postgres with zero downtime.' },
  { id: 't4', title: 'Monthly KPI report generation', priority: 'P2', status: 'done', assignee: 'Nour A.', dueDate: '2026-04-15', project: 'Analytics', description: 'Auto-generate PDF reports for all client accounts.' },
  { id: 't5', title: 'Mobile app push notifications', priority: 'P1', status: 'in-progress', assignee: 'Lina T.', dueDate: '2026-04-25', project: 'Mobile App v3', description: 'Implement Firebase push notification system.' },
  { id: 't6', title: 'Security audit preparation', priority: 'P0', status: 'todo', assignee: 'Rami S.', dueDate: '2026-04-19', project: 'Compliance', description: 'Prepare docs and fix vulnerabilities before audit.' },
  { id: 't7', title: 'Landing page A/B testing', priority: 'P3', status: 'done', assignee: 'Yasmine H.', dueDate: '2026-04-14', project: 'Marketing', description: 'Set up A/B test variants with conversion tracking.' },
  { id: 't8', title: 'API rate limiting implementation', priority: 'P1', status: 'review', assignee: 'Omar F.', dueDate: '2026-04-21', project: 'Client Portal v2', description: 'Implement Redis-based rate limiting on all endpoints.' },
];

// ─── CONTRACTS ────────────────────────────────────────────────────────────────

export const mockContracts: Contract[] = [
  { id: 'c1', client: 'Nasser Holdings', value: 120000, status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', type: 'Retainer' },
  { id: 'c2', client: 'Al Fardan Group', value: 85000, status: 'active', startDate: '2026-02-15', endDate: '2026-08-15', type: 'Project' },
  { id: 'c3', client: 'Emirates Tech', value: 45000, status: 'pending', startDate: '2026-05-01', endDate: '2026-07-31', type: 'Consulting' },
  { id: 'c4', client: 'Gulf Dynamics', value: 200000, status: 'active', startDate: '2025-10-01', endDate: '2026-09-30', type: 'Enterprise' },
  { id: 'c5', client: 'Horizon Retail', value: 30000, status: 'expired', startDate: '2025-06-01', endDate: '2025-12-31', type: 'Project' },
  { id: 'c6', client: 'Savola Group', value: 75000, status: 'draft', startDate: '2026-05-15', endDate: '2026-11-15', type: 'Retainer' },
];

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', client: 'Nasser Holdings', amount: 10000, status: 'paid', dueDate: '2026-03-31', issuedDate: '2026-03-01', items: 4 },
  { id: 'INV-002', client: 'Al Fardan Group', amount: 14166, status: 'paid', dueDate: '2026-03-31', issuedDate: '2026-03-01', items: 3 },
  { id: 'INV-003', client: 'Emirates Tech', amount: 7500, status: 'pending', dueDate: '2026-04-30', issuedDate: '2026-04-01', items: 2 },
  { id: 'INV-004', client: 'Gulf Dynamics', amount: 16666, status: 'pending', dueDate: '2026-04-30', issuedDate: '2026-04-01', items: 5 },
  { id: 'INV-005', client: 'Horizon Retail', amount: 5000, status: 'overdue', dueDate: '2026-01-31', issuedDate: '2026-01-01', items: 2 },
  { id: 'INV-006', client: 'Savola Group', amount: 0, status: 'draft', dueDate: '', issuedDate: '2026-04-15', items: 0 },
];

// ─── USERS ────────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  { id: 'u1', name: 'Ahmed Al-Rashid', email: 'ahmed@techsphere.io', role: 'provider', status: 'active', joinDate: '2024-01-15', avatar: 'AR' },
  { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'buyer', status: 'active', joinDate: '2024-03-22', avatar: 'SJ' },
  { id: 'u3', name: 'Mohammed Ali', email: 'moh@creativeforge.io', role: 'provider', status: 'active', joinDate: '2023-11-10', avatar: 'MA' },
  { id: 'u4', name: 'Laila Hassan', email: 'laila@corp.ae', role: 'buyer', status: 'active', joinDate: '2024-06-08', avatar: 'LH' },
  { id: 'u5', name: 'Rami Khoury', email: 'rami@equinox.io', role: 'employee', status: 'active', joinDate: '2024-02-01', avatar: 'RK' },
  { id: 'u6', name: 'Admin User', email: 'admin@equinox.io', role: 'admin', status: 'active', joinDate: '2023-01-01', avatar: 'AU' },
  { id: 'u7', name: 'Ziad Mansour', email: 'ziad@tech.com', role: 'buyer', status: 'inactive', joinDate: '2024-09-14', avatar: 'ZM' },
  { id: 'u8', name: 'Nour El-Din', email: 'nour@datapulse.io', role: 'provider', status: 'suspended', joinDate: '2024-05-20', avatar: 'NE' },
];

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export const mockEmployees: Employee[] = [
  { id: 'e1', name: 'Rami Khoury', role: 'Senior Developer', department: 'Engineering', email: 'rami@equinox.io', status: 'active', joinDate: '2024-02-01', kpiScore: 92, avatar: 'RK' },
  { id: 'e2', name: 'Sara Nasser', role: 'UI/UX Designer', department: 'Design', email: 'sara@equinox.io', status: 'active', joinDate: '2024-03-15', kpiScore: 88, avatar: 'SN' },
  { id: 'e3', name: 'Kareem Farid', role: 'DevOps Engineer', department: 'Engineering', email: 'kareem@equinox.io', status: 'on-leave', joinDate: '2023-11-01', kpiScore: 79, avatar: 'KF' },
  { id: 'e4', name: 'Hana Younis', role: 'Account Manager', department: 'Sales', email: 'hana@equinox.io', status: 'active', joinDate: '2024-01-20', kpiScore: 95, avatar: 'HY' },
  { id: 'e5', name: 'Omar Saber', role: 'Data Analyst', department: 'Analytics', email: 'omar@equinox.io', status: 'active', joinDate: '2024-07-01', kpiScore: 85, avatar: 'OS' },
];

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export const mockKPIs: KPI[] = [
  { label: 'Task Completion Rate', value: 87, target: 90, unit: '%', trend: 3.2 },
  { label: 'Client Satisfaction', value: 4.7, target: 4.8, unit: '/5', trend: 0.1 },
  { label: 'Revenue Target', value: 78, target: 100, unit: '%', trend: -2.1 },
  { label: 'SLA Compliance', value: 94, target: 95, unit: '%', trend: 1.5 },
  { label: 'Avg Response Time', value: 2.4, target: 2.0, unit: 'hrs', trend: -0.3 },
  { label: 'Active Projects', value: 12, target: 15, unit: '', trend: 2 },
];

// ─── WALLET TRANSACTIONS ──────────────────────────────────────────────────────

export const mockTransactions: WalletTransaction[] = [
  { id: 'tx1', type: 'credit', amount: 5000, description: 'Payment from Nasser Holdings - INV-001', date: '2026-04-10', status: 'completed' },
  { id: 'tx2', type: 'debit', amount: 1200, description: 'Platform fee - March 2026', date: '2026-04-05', status: 'completed' },
  { id: 'tx3', type: 'credit', amount: 14166, description: 'Payment from Al Fardan Group - INV-002', date: '2026-04-03', status: 'completed' },
  { id: 'tx4', type: 'debit', amount: 350, description: 'Subscription renewal', date: '2026-04-01', status: 'completed' },
  { id: 'tx5', type: 'credit', amount: 7500, description: 'Advance payment - Emirates Tech', date: '2026-03-28', status: 'pending' },
  { id: 'tx6', type: 'debit', amount: 2800, description: 'Freelancer payment - UI project', date: '2026-03-25', status: 'completed' },
];

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────

export const mockComplaints: Complaint[] = [
  { id: 'comp1', title: 'Delayed project delivery', description: 'The project was delivered 2 weeks late without prior notice.', status: 'in-progress', priority: 'high', createdAt: '2026-04-08', provider: 'TechSphere Solutions' },
  { id: 'comp2', title: 'Invoice discrepancy', description: 'Charged for 5 items but only 3 were delivered.', status: 'open', priority: 'medium', createdAt: '2026-04-12', provider: 'CreativeForge Agency' },
  { id: 'comp3', title: 'Poor communication', description: 'Account manager unresponsive for 3+ days.', status: 'resolved', priority: 'low', createdAt: '2026-03-25', provider: 'GrowthLab Marketing' },
  { id: 'comp4', title: 'Security vulnerability found', description: 'Critical XSS vulnerability discovered post-delivery.', status: 'open', priority: 'high', createdAt: '2026-04-14', provider: 'SecureNet Cybersecurity' },
];

// ─── CHART DATA ───────────────────────────────────────────────────────────────

export const revenueChartData = [
  { month: 'Jan', revenue: 42000, target: 50000, expenses: 28000 },
  { month: 'Feb', revenue: 58000, target: 50000, expenses: 31000 },
  { month: 'Mar', revenue: 47000, target: 55000, expenses: 29000 },
  { month: 'Apr', revenue: 63000, target: 55000, expenses: 35000 },
  { month: 'May', revenue: 71000, target: 60000, expenses: 38000 },
  { month: 'Jun', revenue: 55000, target: 60000, expenses: 32000 },
  { month: 'Jul', revenue: 82000, target: 65000, expenses: 41000 },
  { month: 'Aug', revenue: 76000, target: 65000, expenses: 39000 },
  { month: 'Sep', revenue: 91000, target: 70000, expenses: 45000 },
  { month: 'Oct', revenue: 88000, target: 70000, expenses: 43000 },
  { month: 'Nov', revenue: 95000, target: 75000, expenses: 47000 },
  { month: 'Dec', revenue: 112000, target: 80000, expenses: 52000 },
];

export const taskDistribution = [
  { name: 'Done', value: 45, color: '#22c55e' },
  { name: 'In Progress', value: 28, color: '#3b82f6' },
  { name: 'Review', value: 15, color: '#f59e0b' },
  { name: 'Todo', value: 12, color: '#e2e8f0' },
];

export const serviceCategories = [
  { name: 'Software Dev', providers: 24, color: '#3b82f6' },
  { name: 'Design', providers: 18, color: '#8b5cf6' },
  { name: 'Marketing', providers: 31, color: '#ec4899' },
  { name: 'Data & AI', providers: 12, color: '#06b6d4' },
  { name: 'Cloud', providers: 15, color: '#f59e0b' },
  { name: 'Security', providers: 8, color: '#ef4444' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const mockNotifications = [
  { id: 'n1', type: 'info', title: 'New contract request', message: 'Gulf Dynamics submitted a new contract for review.', time: '5 min ago', read: false },
  { id: 'n2', type: 'success', title: 'Invoice paid', message: 'INV-001 has been paid by Nasser Holdings.', time: '1 hr ago', read: false },
  { id: 'n3', type: 'warning', title: 'Task overdue', message: 'Security audit preparation is past its due date.', time: '3 hrs ago', read: false },
  { id: 'n4', type: 'error', title: 'SLA breach risk', message: 'Project delivery for Emirates Tech at risk of SLA breach.', time: '6 hrs ago', read: true },
  { id: 'n5', type: 'info', title: 'New review received', message: 'Client left a 5-star review on your profile.', time: '1 day ago', read: true },
];

// ─── LEARNING MODULES ─────────────────────────────────────────────────────────

export const mockCourses = [
  { id: 'course1', title: 'Advanced React Patterns', category: 'Frontend', duration: '4h 30m', progress: 65, instructor: 'Dan Abramov', level: 'Advanced' },
  { id: 'course2', title: 'PostgreSQL Performance Tuning', category: 'Database', duration: '3h 15m', progress: 30, instructor: 'Greg Smith', level: 'Intermediate' },
  { id: 'course3', title: 'Product Management Fundamentals', category: 'Business', duration: '5h 00m', progress: 0, instructor: 'Marty Cagan', level: 'Beginner' },
  { id: 'course4', title: 'AI/ML for Engineers', category: 'AI', duration: '8h 45m', progress: 80, instructor: 'Andrew Ng', level: 'Intermediate' },
];

// ─── LEAVE REQUESTS ───────────────────────────────────────────────────────────

export const mockLeaveRequests = [
  { id: 'lr1', type: 'Annual Leave', startDate: '2026-05-01', endDate: '2026-05-05', days: 5, status: 'approved', reason: 'Family vacation' },
  { id: 'lr2', type: 'Sick Leave', startDate: '2026-04-10', endDate: '2026-04-11', days: 2, status: 'approved', reason: 'Medical appointment' },
  { id: 'lr3', type: 'Annual Leave', startDate: '2026-06-15', endDate: '2026-06-20', days: 6, status: 'pending', reason: 'Eid Al-Adha' },
];
