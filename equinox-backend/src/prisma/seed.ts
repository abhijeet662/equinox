import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Equinox database...\n');

  // ─── CLEAR EXISTING DATA ──────────────────────────────────────────────────

  await prisma.aIInsight.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.kPIRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.walletAccount.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('  ✓ Cleared existing data');

  // ─── USERS ────────────────────────────────────────────────────────────────

  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@equinox.dev',
      password,
      name: 'Alex Morgan',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'AM',
      company: 'Equinox Platform',
      phone: '+1-555-0100',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@equinox.dev',
      password,
      name: 'Sarah Chen',
      role: 'BUYER',
      status: 'ACTIVE',
      avatar: 'SC',
      company: 'TechCorp Inc.',
      phone: '+1-555-0101',
    },
  });

  const provider = await prisma.user.create({
    data: {
      email: 'provider@equinox.dev',
      password,
      name: 'Marcus Williams',
      role: 'PROVIDER',
      status: 'ACTIVE',
      avatar: 'MW',
      company: 'Williams Dev Studio',
      phone: '+1-555-0102',
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@equinox.dev',
      password,
      name: 'Jordan Lee',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      avatar: 'JL',
      phone: '+1-555-0103',
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      email: 'nova@equinox.dev',
      password,
      name: 'Emily Nova',
      role: 'PROVIDER',
      status: 'ACTIVE',
      avatar: 'EN',
      company: 'Nova Design Co.',
      phone: '+1-555-0104',
    },
  });

  const provider3 = await prisma.user.create({
    data: {
      email: 'apex@equinox.dev',
      password,
      name: 'Raj Patel',
      role: 'PROVIDER',
      status: 'ACTIVE',
      avatar: 'RP',
      company: 'Apex Cloud Solutions',
      phone: '+1-555-0105',
    },
  });

  console.log('  ✓ Created users');

  // ─── WALLETS ──────────────────────────────────────────────────────────────

  const buyerWallet = await prisma.walletAccount.create({
    data: { userId: buyer.id, balance: 15000, currency: 'USD' },
  });

  const providerWallet = await prisma.walletAccount.create({
    data: { userId: provider.id, balance: 8500, currency: 'USD' },
  });

  await prisma.walletAccount.create({ data: { userId: provider2.id, balance: 3200 } });
  await prisma.walletAccount.create({ data: { userId: provider3.id, balance: 12000 } });

  await prisma.walletTransaction.createMany({
    data: [
      {
        walletId: buyerWallet.id,
        amount: 15000,
        type: 'CREDIT',
        status: 'COMPLETED',
        reference: 'TOPUP-001',
        description: 'Initial top-up',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        walletId: providerWallet.id,
        amount: 5000,
        type: 'CREDIT',
        status: 'COMPLETED',
        reference: 'PAY-INV001',
        description: 'Payment for INV-202501-0001',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        walletId: providerWallet.id,
        amount: 3500,
        type: 'CREDIT',
        status: 'COMPLETED',
        reference: 'PAY-INV002',
        description: 'Payment for INV-202501-0002',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('  ✓ Created wallets & transactions');

  // ─── PROVIDER PROFILES ────────────────────────────────────────────────────

  await prisma.providerProfile.create({
    data: {
      userId: provider.id,
      businessName: 'Williams Dev Studio',
      description: 'Full-stack development, API design, cloud infrastructure, and DevOps solutions.',
      category: 'Software Development',
      services: ['Web Development', 'API Design', 'Cloud Infrastructure', 'DevOps', 'Mobile Apps'],
      rating: 4.8,
      reviewCount: 47,
      completedJobs: 63,
      logoInitials: 'MW',
      website: 'https://williamsdev.studio',
    },
  });

  await prisma.providerProfile.create({
    data: {
      userId: provider2.id,
      businessName: 'Nova Design Co.',
      description: 'Brand identity, UI/UX design, and digital marketing for modern businesses.',
      category: 'Design & Creative',
      services: ['Brand Identity', 'UI/UX Design', 'Logo Design', 'Digital Marketing'],
      rating: 4.9,
      reviewCount: 89,
      completedJobs: 112,
      logoInitials: 'EN',
      website: 'https://novadesign.co',
    },
  });

  const profile3 = await prisma.providerProfile.create({
    data: {
      userId: provider3.id,
      businessName: 'Apex Cloud Solutions',
      description: 'Enterprise cloud migrations, Kubernetes, security audits, and managed infrastructure.',
      category: 'Cloud & DevOps',
      services: ['Cloud Migration', 'Kubernetes', 'Security Audit', 'Managed Infrastructure'],
      rating: 4.7,
      reviewCount: 34,
      completedJobs: 41,
      logoInitials: 'RP',
      website: 'https://apexcloud.io',
    },
  });

  console.log('  ✓ Created provider profiles');

  // ─── EMPLOYEE PROFILE ─────────────────────────────────────────────────────

  await prisma.employeeProfile.create({
    data: {
      userId: employee.id,
      department: 'Engineering',
      jobTitle: 'Senior Engineer',
      employeeId: 'EMP-001',
    },
  });

  console.log('  ✓ Created employee profile');

  // ─── CONTRACTS ────────────────────────────────────────────────────────────

  const contract1 = await prisma.contract.create({
    data: {
      title: 'E-Commerce Platform Development',
      description: 'Full-stack development of a modern e-commerce platform with payment integration.',
      buyerId: buyer.id,
      providerId: provider.id,
      type: 'PROJECT',
      status: 'ACTIVE',
      value: 45000,
      currency: 'USD',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      terms: 'Payment in milestones: 30% upfront, 40% at midpoint, 30% at delivery.',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      title: 'Brand Refresh & UI Redesign',
      description: 'Complete brand identity refresh and UI redesign of the main product.',
      buyerId: buyer.id,
      providerId: provider2.id,
      type: 'PROJECT',
      status: 'ACTIVE',
      value: 18000,
      currency: 'USD',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      title: 'Cloud Infrastructure Setup',
      description: 'Kubernetes cluster setup, CI/CD pipelines, and monitoring for production.',
      buyerId: buyer.id,
      providerId: provider3.id,
      type: 'MILESTONE',
      status: 'COMPLETED',
      value: 22000,
      currency: 'USD',
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  ✓ Created contracts');

  // ─── TASKS ────────────────────────────────────────────────────────────────

  const tasksData = [
    { title: 'Set up project repository and CI/CD pipeline', priority: 'P1' as const, status: 'DONE' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['devops', 'setup'] },
    { title: 'Design database schema and ERD', priority: 'P1' as const, status: 'DONE' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['backend', 'database'] },
    { title: 'Implement user authentication module', priority: 'P0' as const, status: 'IN_PROGRESS' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['backend', 'auth'] },
    { title: 'Build product catalog API', priority: 'P1' as const, status: 'IN_PROGRESS' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['backend', 'api'] },
    { title: 'Integrate Stripe payment gateway', priority: 'P1' as const, status: 'TODO' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['payments'] },
    { title: 'Frontend — product listing page', priority: 'P2' as const, status: 'TODO' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['frontend'] },
    { title: 'Frontend — shopping cart & checkout', priority: 'P2' as const, status: 'TODO' as const, contractId: contract1.id, assignedToId: provider.id, createdById: buyer.id, tags: ['frontend'] },
    { title: 'Logo and brand color palette exploration', priority: 'P1' as const, status: 'DONE' as const, contractId: contract2.id, assignedToId: provider2.id, createdById: buyer.id, tags: ['design', 'brand'] },
    { title: 'Design system component library', priority: 'P1' as const, status: 'IN_PROGRESS' as const, contractId: contract2.id, assignedToId: provider2.id, createdById: buyer.id, tags: ['design', 'ui'] },
    { title: 'Homepage redesign mockups', priority: 'P2' as const, status: 'IN_REVIEW' as const, contractId: contract2.id, assignedToId: provider2.id, createdById: buyer.id, tags: ['design', 'ux'] },
    { title: 'Quarterly team performance review', priority: 'P2' as const, status: 'TODO' as const, assignedToId: employee.id, createdById: admin.id, tags: ['hr', 'review'] },
    { title: 'Update employee handbook', priority: 'P3' as const, status: 'IN_PROGRESS' as const, assignedToId: employee.id, createdById: admin.id, tags: ['hr', 'docs'] },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority,
        status: t.status,
        contractId: t.contractId,
        assignedToId: t.assignedToId,
        createdById: t.createdById,
        tags: t.tags,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        completedAt: t.status === 'DONE' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined,
      },
    });
  }

  console.log('  ✓ Created tasks');

  // ─── INVOICES ─────────────────────────────────────────────────────────────

  await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-202501-0001',
      providerId: provider.id,
      buyerId: buyer.id,
      contractId: contract1.id,
      status: 'PAID',
      subtotal: 13500,
      tax: 0,
      total: 13500,
      currency: 'USD',
      paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      notes: 'Milestone 1: Project setup and architecture',
      items: {
        create: [
          { description: 'Project setup & architecture', quantity: 1, unitPrice: 8000, total: 8000 },
          { description: 'Database design', quantity: 1, unitPrice: 3500, total: 3500 },
          { description: 'CI/CD pipeline configuration', quantity: 1, unitPrice: 2000, total: 2000 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-202501-0002',
      providerId: provider.id,
      buyerId: buyer.id,
      contractId: contract1.id,
      status: 'PENDING',
      subtotal: 18000,
      tax: 0,
      total: 18000,
      currency: 'USD',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Milestone 2: Core API development',
      items: {
        create: [
          { description: 'Authentication module', quantity: 1, unitPrice: 6000, total: 6000 },
          { description: 'Product catalog API', quantity: 1, unitPrice: 7000, total: 7000 },
          { description: 'Admin panel backend', quantity: 1, unitPrice: 5000, total: 5000 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-202501-0003',
      providerId: provider2.id,
      buyerId: buyer.id,
      contractId: contract2.id,
      status: 'PENDING',
      subtotal: 9000,
      tax: 0,
      total: 9000,
      currency: 'USD',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Brand refresh phase 1: Identity & design system',
      items: {
        create: [
          { description: 'Logo design & brand guidelines', quantity: 1, unitPrice: 4500, total: 4500 },
          { description: 'Design system components', quantity: 1, unitPrice: 4500, total: 4500 },
        ],
      },
    },
  });

  console.log('  ✓ Created invoices');

  // ─── REVIEWS ──────────────────────────────────────────────────────────────

  await prisma.review.create({
    data: {
      providerId: profile3.id,
      buyerId: buyer.id,
      rating: 5,
      comment: 'Exceptional cloud infrastructure work. Delivered ahead of schedule with zero downtime.',
    },
  });

  await prisma.providerProfile.update({
    where: { id: profile3.id },
    data: { reviewCount: 35, completedJobs: 42 },
  });

  console.log('  ✓ Created reviews');

  // ─── COMPLAINTS ───────────────────────────────────────────────────────────

  await prisma.complaint.create({
    data: {
      title: 'Delayed deliverable — homepage mockups',
      description: 'The homepage redesign mockups were promised by last Friday but have not been delivered yet.',
      raisedById: buyer.id,
      againstId: provider2.id,
      contractId: contract2.id,
      priority: 'HIGH',
      status: 'IN_REVIEW',
    },
  });

  console.log('  ✓ Created complaints');

  // ─── KPI RECORDS ─────────────────────────────────────────────────────────

  await prisma.kPIRecord.createMany({
    data: [
      { userId: employee.id, metric: 'Tasks Completed', value: 47, target: 40, unit: 'tasks', period: 'Q1-2025' },
      { userId: employee.id, metric: 'On-Time Delivery Rate', value: 94, target: 90, unit: '%', period: 'Q1-2025' },
      { userId: employee.id, metric: 'Bug Resolution Time', value: 3.2, target: 4, unit: 'hours', period: 'Q1-2025' },
      { userId: employee.id, metric: 'Code Review Coverage', value: 87, target: 85, unit: '%', period: 'Q1-2025' },
      { userId: provider.id, metric: 'Client Satisfaction', value: 4.8, target: 4.5, unit: '/5', period: 'Q1-2025' },
      { userId: provider.id, metric: 'Project Delivery Rate', value: 96, target: 95, unit: '%', period: 'Q1-2025' },
    ],
  });

  console.log('  ✓ Created KPI records');

  // ─── LEAVE REQUESTS ───────────────────────────────────────────────────────

  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      type: 'ANNUAL',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      days: 8,
      reason: 'Family vacation — pre-planned annual leave.',
      status: 'PENDING',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: employee.id,
      type: 'SICK',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      days: 3,
      reason: 'Flu recovery.',
      status: 'APPROVED',
      approvedById: admin.id,
      reviewedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  ✓ Created leave requests');

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      { userId: buyer.id, type: 'INVOICE', title: 'Invoice received', message: 'INV-202501-0002 for $18,000 from Williams Dev Studio is due in 14 days.', link: '/buyer/invoices', read: false },
      { userId: buyer.id, type: 'INVOICE', title: 'Invoice received', message: 'INV-202501-0003 for $9,000 from Nova Design Co. is due in 7 days.', link: '/buyer/invoices', read: false },
      { userId: provider.id, type: 'TASK', title: 'Task assigned', message: 'New task: "Integrate Stripe payment gateway" has been added to your contract.', link: '/provider/tasks', read: false },
      { userId: provider2.id, type: 'COMPLAINT', title: 'Complaint filed', message: 'A complaint regarding delayed homepage mockups is under review.', link: '/provider/complaints', read: false },
      { userId: employee.id, type: 'TASK', title: 'New task assigned', message: 'You have been assigned: "Quarterly team performance review".', link: '/employee/tasks', read: true },
      { userId: admin.id, type: 'SYSTEM', title: 'Complaint requires review', message: 'A HIGH priority complaint has been filed between TechCorp and Nova Design Co.', link: '/admin/complaints', read: false },
    ],
  });

  console.log('  ✓ Created notifications');

  // ─── AI INSIGHTS ─────────────────────────────────────────────────────────

  await prisma.aIInsight.createMany({
    data: [
      {
        userId: buyer.id,
        type: 'SPEND_ALERT',
        title: 'High spend concentration',
        content: '68% of your total spend is with a single provider. Consider diversifying to reduce dependency risk.',
        metadata: { severity: 'warning', percentage: 68 },
      },
      {
        userId: buyer.id,
        type: 'RECOMMENDATION',
        title: 'Invoice due soon',
        content: 'You have 2 invoices totalling $27,000 due within the next 14 days. Ensure sufficient wallet balance.',
        metadata: { invoiceCount: 2, totalAmount: 27000 },
      },
      {
        userId: provider.id,
        type: 'PERFORMANCE',
        title: 'SLA compliance excellent',
        content: 'Your task completion rate is 96% on-time this quarter, above the platform average of 82%.',
        metadata: { rate: 96, platformAverage: 82 },
      },
      {
        userId: admin.id,
        type: 'PLATFORM',
        title: 'Platform revenue growing',
        content: 'Contract value grew 23% month-over-month. Provider onboarding is up 18%.',
        metadata: { revenueGrowth: 23, onboardingGrowth: 18 },
      },
    ],
  });

  console.log('  ✓ Created AI insights');

  // ─── SUMMARY ─────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!\n');
  console.log('  Demo accounts (password: password123):');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │ admin@equinox.dev    → ADMIN             │');
  console.log('  │ buyer@equinox.dev    → BUYER             │');
  console.log('  │ provider@equinox.dev → PROVIDER          │');
  console.log('  │ employee@equinox.dev → EMPLOYEE          │');
  console.log('  └─────────────────────────────────────────┘\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
