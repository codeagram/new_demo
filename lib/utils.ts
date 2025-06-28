import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type {
  Customer,
  Loan,
  LoanApplication,
  Partner,
  User,
  Repayment,
  CollectionSchedule,
  Voucher,
  Journal,
  ReportFilter,
  PortfolioReport,
  CollectionReport,
  AgentPerformance,
  FinancialReport,
  MonthlyFinancial,
  CustomerReport,
  CustomerByPartner,
  ApplicationReport,
  ApplicationByProduct,
  LoanProduct,
} from "./types"
import { mockData } from "./mock-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// EMI Calculation Functions
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths === 0 || annualRate === 0) return principal

  const monthlyRate = annualRate / 100 / 12
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  return Math.round(emi)
}

export function calculateTotalInterest(principal: number, emi: number, tenureMonths: number): number {
  const totalPayment = emi * tenureMonths
  return totalPayment - principal
}

export function calculateTotalAmount(principal: number, emi: number, tenureMonths: number): number {
  return emi * tenureMonths
}

// Amortization Schedule
export interface AmortizationRow {
  installmentNumber: number
  dueDate: string
  emi: number
  principal: number
  interest: number
  outstandingBalance: number
  cumulativeInterest: number
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  disbursementDate: string = new Date().toISOString()
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12
  const emi = calculateEMI(principal, annualRate, tenureMonths)
  const schedule: AmortizationRow[] = []

  let outstandingBalance = principal
  let cumulativeInterest = 0

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(outstandingBalance * monthlyRate)
    let principalPaid = emi - interest

    // For the last installment, ensure outstanding balance becomes exactly 0
    if (i === tenureMonths) {
      principalPaid = outstandingBalance
    }

    const newOutstandingBalance = outstandingBalance - principalPaid

    cumulativeInterest += interest

    // Calculate due date (monthly from disbursement)
    const dueDate = new Date(disbursementDate)
    dueDate.setMonth(dueDate.getMonth() + i)

    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      emi: i === tenureMonths ? principalPaid + interest : emi,
      principal: Math.round(principalPaid),
      interest,
      outstandingBalance: Math.max(0, Math.round(newOutstandingBalance)),
      cumulativeInterest
    })

    outstandingBalance = newOutstandingBalance
  }

  return schedule
}

// Prepayment Calculator
export function calculatePrepaymentSavings(
  originalPrincipal: number,
  originalRate: number,
  originalTenure: number,
  prepaymentAmount: number,
  monthsPaid: number
): {
  newEMI: number
  newTenure: number
  interestSaved: number
  totalSavings: number
} {
  // Calculate remaining principal after prepayment
  const originalEMI = calculateEMI(originalPrincipal, originalRate, originalTenure)
  const schedule = generateAmortizationSchedule(originalPrincipal, originalRate, originalTenure)

  if (monthsPaid >= originalTenure) {
    return {
      newEMI: 0,
      newTenure: 0,
      interestSaved: 0,
      totalSavings: 0
    }
  }

  const remainingPrincipal = schedule[monthsPaid]?.outstandingBalance || originalPrincipal
  const newPrincipal = Math.max(0, remainingPrincipal - prepaymentAmount)
  const remainingTenure = originalTenure - monthsPaid

  if (newPrincipal <= 0) {
    return {
      newEMI: 0,
      newTenure: 0,
      interestSaved: calculateTotalInterest(remainingPrincipal, originalEMI, remainingTenure),
      totalSavings: calculateTotalInterest(remainingPrincipal, originalEMI, remainingTenure)
    }
  }

  const newEMI = calculateEMI(newPrincipal, originalRate, remainingTenure)
  const newTotalInterest = calculateTotalInterest(newPrincipal, newEMI, remainingTenure)
  const originalTotalInterest = calculateTotalInterest(remainingPrincipal, originalEMI, remainingTenure)
  const interestSaved = originalTotalInterest - newTotalInterest

  return {
    newEMI,
    newTenure: remainingTenure,
    interestSaved,
    totalSavings: interestSaved
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Partner assignment based on pincode
export function assignPartnerByPincode(pincode: string, partners: Partner[]): Partner | null {
  const partner = partners.find(p =>
    p.status === "Active" &&
    p.servicingPincodes.includes(pincode)
  )
  return partner || null
}

// Multi-tenancy filtering functions
export function filterByUserAccess<T extends { partnerId?: number }>(
  items: T[],
  user: User
): T[] {
  if (user.role === "admin") {
    return items // Admin can see all items
  }

  if (user.role === "staff" && user.partnerId) {
    return items.filter(item => item.partnerId === user.partnerId)
  }

  return [] // Staff without partner access see nothing
}

// Filter customers by user access
export function filterCustomersByUser(customers: Customer[], user: User): Customer[] {
  return filterByUserAccess(customers, user)
}

// Filter loan applications by user access
export function filterLoanApplicationsByUser(applications: LoanApplication[], customers: Customer[], user: User): LoanApplication[] {
  if (user.role === "admin") {
    return applications
  }

  if (user.role === "staff" && user.partnerId) {
    const accessibleCustomerIds = customers
      .filter(customer => customer.partnerId === user.partnerId)
      .map(customer => customer.id)

    return applications.filter(app => accessibleCustomerIds.includes(app.customerId))
  }

  return []
}

// Filter loans by user access
export function filterLoansByUser(loans: Loan[], customers: Customer[], user: User): Loan[] {
  if (user.role === "admin") {
    return loans
  }

  if (user.role === "staff" && user.partnerId) {
    const accessibleCustomerIds = customers
      .filter(customer => customer.partnerId === user.partnerId)
      .map(customer => customer.id)

    return loans.filter(loan => accessibleCustomerIds.includes(loan.customerId))
  }

  return []
}

// Get partner name by ID
export function getPartnerName(partnerId: number, partners: Partner[]): string {
  const partner = partners.find(p => p.id === partnerId)
  return partner?.name || "Unknown Partner"
}

// Validate pincode format (6 digits)
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode)
}

// Reporting Utilities
export function generatePortfolioReport(
  loans: Loan[],
  repayments: Repayment[],
  customers: Customer[],
  filter?: ReportFilter
): PortfolioReport {
  let filteredLoans = loans;

  if (filter?.partnerId) {
    filteredLoans = loans.filter(loan => {
      const customer = customers.find(c => c.id === loan.customerId);
      return customer?.partnerId === filter.partnerId;
    });
  }

  if (filter?.startDate && filter?.endDate) {
    filteredLoans = filteredLoans.filter(loan => {
      const disbursementDate = new Date(loan.disbursementDate);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return disbursementDate >= startDate && disbursementDate <= endDate;
    });
  }

  const activeLoans = filteredLoans.filter(loan => loan.status === "Active");
  const closedLoans = filteredLoans.filter(loan => loan.status === "Closed");
  const defaultedLoans = filteredLoans.filter(loan => loan.status === "Defaulted");

  const totalDisbursed = filteredLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalOutstanding = activeLoans.reduce((sum, loan) => {
    const paidRepayments = repayments.filter(r => r.loanId === loan.id && r.status === "Paid");
    const totalPaid = paidRepayments.reduce((sum, r) => sum + r.principalAmount, 0);
    return sum + (loan.amount - totalPaid);
  }, 0);

  const totalCollected = repayments
    .filter(r => r.status === "Paid" && filteredLoans.some(loan => loan.id === r.loanId))
    .reduce((sum, r) => sum + r.paidAmount, 0);

  const overdueAmount = activeLoans.reduce((sum, loan) => {
    const overdueRepayments = repayments.filter(r =>
      r.loanId === loan.id && r.status === "Overdue"
    );
    return sum + overdueRepayments.reduce((sum, r) => sum + r.expectedAmount, 0);
  }, 0);

  const overdueLoans = activeLoans.filter(loan => {
    const overdueRepayments = repayments.filter(r =>
      r.loanId === loan.id && r.status === "Overdue"
    );
    return overdueRepayments.length > 0;
  }).length;

  return {
    totalLoans: filteredLoans.length,
    activeLoans: activeLoans.length,
    closedLoans: closedLoans.length,
    defaultedLoans: defaultedLoans.length,
    totalDisbursed,
    totalOutstanding,
    totalCollected,
    averageLoanSize: filteredLoans.length > 0 ? totalDisbursed / filteredLoans.length : 0,
    averageInterestRate: filteredLoans.length > 0
      ? filteredLoans.reduce((sum, loan) => sum + loan.interestRate, 0) / filteredLoans.length
      : 0,
    collectionEfficiency: totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0,
    overdueAmount,
    overdueLoans,
  };
}

export function generateCollectionReport(
  collectionSchedules: CollectionSchedule[],
  repayments: Repayment[],
  filter?: ReportFilter
): CollectionReport {
  let filteredSchedules = collectionSchedules;

  if (filter?.startDate && filter?.endDate) {
    filteredSchedules = collectionSchedules.filter(schedule => {
      const dueDate = new Date(schedule.dueDate);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return dueDate >= startDate && dueDate <= endDate;
    });
  }

  const totalDue = filteredSchedules.reduce((sum, schedule) => sum + schedule.emiAmount, 0);
  const collectedAmount = filteredSchedules
    .filter(schedule => schedule.status === "Paid")
    .reduce((sum, schedule) => sum + schedule.emiAmount, 0);
  const overdueAmount = filteredSchedules
    .filter(schedule => schedule.status === "Overdue")
    .reduce((sum, schedule) => sum + schedule.emiAmount, 0);

  const today = new Date();
  const dueToday = filteredSchedules.filter(schedule => {
    const dueDate = new Date(schedule.dueDate);
    return dueDate.toDateString() === today.toDateString() && schedule.status !== "Paid";
  }).length;

  const dueThisWeek = filteredSchedules.filter(schedule => {
    const dueDate = new Date(schedule.dueDate);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    return dueDate <= weekFromNow && dueDate >= today && schedule.status !== "Paid";
  }).length;

  const dueThisMonth = filteredSchedules.filter(schedule => {
    const dueDate = new Date(schedule.dueDate);
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(today.getMonth() + 1);
    return dueDate <= monthFromNow && dueDate >= today && schedule.status !== "Paid";
  }).length;

  // Agent Performance
  const agentMap = new Map<string, AgentPerformance>();

  filteredSchedules.forEach(schedule => {
    if (schedule.collectionAgent) {
      const existing = agentMap.get(schedule.collectionAgent) || {
        agentName: schedule.collectionAgent,
        totalAssigned: 0,
        collected: 0,
        overdue: 0,
        efficiency: 0,
        totalAmount: 0,
      };

      existing.totalAssigned++;
      existing.totalAmount += schedule.emiAmount;

      if (schedule.status === "Paid") {
        existing.collected++;
      } else if (schedule.status === "Overdue") {
        existing.overdue++;
      }

      existing.efficiency = existing.totalAssigned > 0
        ? (existing.collected / existing.totalAssigned) * 100
        : 0;

      agentMap.set(schedule.collectionAgent, existing);
    }
  });

  return {
    totalDue,
    collectedAmount,
    overdueAmount,
    collectionEfficiency: totalDue > 0 ? (collectedAmount / totalDue) * 100 : 0,
    overdueLoans: filteredSchedules.filter(s => s.status === "Overdue").length,
    dueToday,
    dueThisWeek,
    dueThisMonth,
    agentPerformance: Array.from(agentMap.values()),
  };
}

export function generateFinancialReport(
  vouchers: Voucher[],
  journals: Journal[],
  filter?: ReportFilter
): FinancialReport {
  let filteredVouchers = vouchers;
  let filteredJournals = journals;

  if (filter?.startDate && filter?.endDate) {
    filteredVouchers = vouchers.filter(voucher => {
      const voucherDate = new Date(voucher.date);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return voucherDate >= startDate && voucherDate <= endDate;
    });

    filteredJournals = journals.filter(journal => {
      const journalDate = new Date(journal.date);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return journalDate >= startDate && journalDate <= endDate;
    });
  }

  const totalReceipts = filteredVouchers
    .filter(v => v.type === "Receipt")
    .reduce((sum, v) => sum + v.amount, 0);

  const totalPayments = filteredVouchers
    .filter(v => v.type === "Payment")
    .reduce((sum, v) => sum + v.amount, 0);

  const interestEarned = filteredJournals
    .filter(j => j.entry.toLowerCase().includes("interest"))
    .reduce((sum, j) => sum + j.amount, 0);

  const feesCollected = filteredVouchers
    .filter(v => v.category?.toLowerCase().includes("fee"))
    .reduce((sum, v) => sum + v.amount, 0);

  const penaltiesCollected = filteredVouchers
    .filter(v => v.category?.toLowerCase().includes("penalty"))
    .reduce((sum, v) => sum + v.amount, 0);

  // Monthly breakdown
  const monthlyMap = new Map<string, MonthlyFinancial>();

  filteredVouchers.forEach(voucher => {
    const month = new Date(voucher.date).toISOString().slice(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month) || {
      month,
      receipts: 0,
      payments: 0,
      netAmount: 0,
      interestEarned: 0,
    };

    if (voucher.type === "Receipt") {
      existing.receipts += voucher.amount;
    } else {
      existing.payments += voucher.amount;
    }

    existing.netAmount = existing.receipts - existing.payments;
    monthlyMap.set(month, existing);
  });

  // Add interest earned to monthly breakdown
  filteredJournals
    .filter(j => j.entry.toLowerCase().includes("interest"))
    .forEach(journal => {
      const month = new Date(journal.date).toISOString().slice(0, 7);
      const existing = monthlyMap.get(month);
      if (existing) {
        existing.interestEarned += journal.amount;
        monthlyMap.set(month, existing);
      }
    });

  return {
    totalReceipts,
    totalPayments,
    netBalance: totalReceipts - totalPayments,
    interestEarned,
    feesCollected,
    penaltiesCollected,
    monthlyBreakdown: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export function generateCustomerReport(
  customers: Customer[],
  loans: Loan[],
  partners: Partner[],
  filter?: ReportFilter
): CustomerReport {
  let filteredCustomers = customers;

  if (filter?.partnerId) {
    filteredCustomers = customers.filter(customer => customer.partnerId === filter.partnerId);
  }

  if (filter?.startDate && filter?.endDate) {
    filteredCustomers = filteredCustomers.filter(customer => {
      const createdDate = new Date(customer.createdAt);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return createdDate >= startDate && createdDate <= endDate;
    });
  }

  const newCustomers = filteredCustomers.filter(customer => {
    const createdDate = new Date(customer.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  const activeCustomers = filteredCustomers.filter(customer => {
    return loans.some(loan => loan.customerId === customer.id && loan.status === "Active");
  }).length;

  const kycPending = filteredCustomers.filter(c => c.kycStatus === "Pending").length;
  const kycVerified = filteredCustomers.filter(c => c.kycStatus === "Verified").length;
  const kycRejected = filteredCustomers.filter(c => c.kycStatus === "Rejected").length;

  // Customer by partner
  const customerByPartner = partners.map(partner => {
    const partnerCustomers = customers.filter(c => c.partnerId === partner.id);
    const partnerLoans = loans.filter(loan => {
      const customer = customers.find(c => c.id === loan.customerId);
      return customer?.partnerId === partner.id;
    });

    return {
      partnerName: partner.name,
      totalCustomers: partnerCustomers.length,
      activeLoans: partnerLoans.filter(l => l.status === "Active").length,
      totalDisbursed: partnerLoans.reduce((sum, l) => sum + l.amount, 0),
    };
  });

  return {
    totalCustomers: filteredCustomers.length,
    newCustomers,
    activeCustomers,
    kycPending,
    kycVerified,
    kycRejected,
    customerByPartner,
  };
}

export function generateApplicationReport(
  applications: LoanApplication[],
  customers: Customer[],
  filter?: ReportFilter
): ApplicationReport {
  let filteredApplications = applications;

  if (filter?.partnerId) {
    filteredApplications = applications.filter(app => {
      const customer = customers.find(c => c.id === app.customerId);
      return customer?.partnerId === filter.partnerId;
    });
  }

  if (filter?.startDate && filter?.endDate) {
    filteredApplications = applications.filter(app => {
      const createdDate = new Date(app.createdAt);
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      return createdDate >= startDate && createdDate <= endDate;
    });
  }

  const approvedApplications = filteredApplications.filter(app => app.status === "Approved").length;
  const rejectedApplications = filteredApplications.filter(app => app.status === "Rejected").length;
  const pendingApplications = filteredApplications.filter(app =>
    ["Draft", "Submitted", "Under Review"].includes(app.status)
  ).length;

  const approvalRate = filteredApplications.length > 0
    ? (approvedApplications / filteredApplications.length) * 100
    : 0;

  // Calculate average processing time
  const processedApplications = filteredApplications.filter(app =>
    ["Approved", "Rejected"].includes(app.status)
  );

  const totalProcessingTime = processedApplications.reduce((sum, app) => {
    const created = new Date(app.createdAt);
    const updated = new Date(app.updatedAt);
    return sum + (updated.getTime() - created.getTime());
  }, 0);

  const averageProcessingTime = processedApplications.length > 0
    ? totalProcessingTime / processedApplications.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Applications by product
  const productMap = new Map<string, ApplicationByProduct>();

  filteredApplications.forEach(app => {
    const existing = productMap.get(app.product) || {
      product: app.product,
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      approvalRate: 0,
    };

    existing.total++;

    if (app.status === "Approved") {
      existing.approved++;
    } else if (app.status === "Rejected") {
      existing.rejected++;
    } else {
      existing.pending++;
    }

    existing.approvalRate = existing.total > 0 ? (existing.approved / existing.total) * 100 : 0;
    productMap.set(app.product, existing);
  });

  return {
    totalApplications: filteredApplications.length,
    approvedApplications,
    rejectedApplications,
    pendingApplications,
    approvalRate,
    averageProcessingTime,
    applicationsByProduct: Array.from(productMap.values()),
  };
}

// Product Management Utilities
export function validateLoanAmount(product: LoanProduct, amount: number): { isValid: boolean; message?: string } {
  if (amount < product.minAmount) {
    return { isValid: false, message: `Minimum loan amount is ${formatCurrency(product.minAmount)}` };
  }
  if (amount > product.maxAmount) {
    return { isValid: false, message: `Maximum loan amount is ${formatCurrency(product.maxAmount)}` };
  }
  return { isValid: true };
}

export function validateLoanTenure(product: LoanProduct, tenureMonths: number): { isValid: boolean; message?: string } {
  if (tenureMonths < product.minTenureMonths) {
    return { isValid: false, message: `Minimum tenure is ${product.minTenureMonths} months` };
  }
  if (tenureMonths > product.maxTenureMonths) {
    return { isValid: false, message: `Maximum tenure is ${product.maxTenureMonths} months` };
  }
  return { isValid: true };
}

export function checkCustomerEligibility(product: LoanProduct, customer: Customer): { isEligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Age check
  const customerAge = new Date().getFullYear() - new Date(customer.dob).getFullYear();
  if (customerAge < product.eligibilityCriteria.minAge) {
    reasons.push(`Customer must be at least ${product.eligibilityCriteria.minAge} years old`);
  }
  if (customerAge > product.eligibilityCriteria.maxAge) {
    reasons.push(`Customer must be under ${product.eligibilityCriteria.maxAge} years old`);
  }

  // Income check
  if (customer.monthlyIncome && customer.monthlyIncome < product.eligibilityCriteria.minIncome) {
    reasons.push(`Minimum monthly income required is ${formatCurrency(product.eligibilityCriteria.minIncome)}`);
  }

  // KYC check
  if (customer.kycStatus !== "Verified") {
    reasons.push("KYC must be verified");
  }

  return {
    isEligible: reasons.length === 0,
    reasons
  };
}

export function getActiveProducts(): LoanProduct[] {
  return mockData.loanProducts.filter((product: LoanProduct) => product.status === "Active");
}

export function getProductByCode(code: string): LoanProduct | undefined {
  return mockData.loanProducts.find((product: LoanProduct) => product.code === code);
}

export function getProductById(id: number): LoanProduct | undefined {
  return mockData.loanProducts.find((product: LoanProduct) => product.id === id);
}

export function calculateProcessingFee(product: LoanProduct, amount: number): number {
  return product.processingFee;
}

export function calculatePrepaymentPenalty(product: LoanProduct, outstandingAmount: number): number {
  return (outstandingAmount * product.prepaymentPenalty) / 100;
}

export function calculateLatePaymentPenalty(product: LoanProduct, overdueAmount: number): number {
  return (overdueAmount * product.latePaymentPenalty) / 100;
}

// Notification and Alert Utilities
export interface Notification {
  id: number;
  type: "overdue" | "due_today" | "kyc_pending" | "application_pending" | "collection_due";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  isRead: boolean;
  relatedId?: number; // ID of related loan, customer, or application
  relatedType?: "loan" | "customer" | "application";
}

export function generateNotifications(
  loans: Loan[],
  customers: Customer[],
  applications: LoanApplication[],
  repayments: Repayment[],
  user: User
): Notification[] {
  const notifications: Notification[] = [];
  let notificationId = 1;

  // Filter data based on user access
  const accessibleLoans = filterLoansByUser(loans, customers, user);
  const accessibleCustomers = filterCustomersByUser(customers, user);
  const accessibleApplications = filterLoanApplicationsByUser(applications, customers, user);

  // Overdue payments
  const overdueRepayments = repayments.filter(r =>
    r.status === "Overdue" && accessibleLoans.some(loan => loan.id === r.loanId)
  );

  overdueRepayments.forEach(repayment => {
    const loan = accessibleLoans.find(l => l.id === repayment.loanId);
    const customer = accessibleCustomers.find(c => c.id === loan?.customerId);

    if (loan && customer) {
      notifications.push({
        id: notificationId++,
        type: "overdue",
        title: "Overdue Payment",
        message: `${customer.name} has an overdue payment of ${formatCurrency(repayment.expectedAmount)} for Loan #${loan.id}`,
        priority: repayment.overdueDays > 30 ? "critical" : repayment.overdueDays > 15 ? "high" : "medium",
        createdAt: new Date().toISOString(),
        isRead: false,
        relatedId: loan.id,
        relatedType: "loan"
      });
    }
  });

  // Payments due today
  const today = new Date().toISOString().split('T')[0];
  const dueTodayRepayments = repayments.filter(r =>
    r.dueDate === today && r.status === "Pending" && accessibleLoans.some(loan => loan.id === r.loanId)
  );

  dueTodayRepayments.forEach(repayment => {
    const loan = accessibleLoans.find(l => l.id === repayment.loanId);
    const customer = accessibleCustomers.find(c => c.id === loan?.customerId);

    if (loan && customer) {
      notifications.push({
        id: notificationId++,
        type: "due_today",
        title: "Payment Due Today",
        message: `${customer.name} has a payment due today of ${formatCurrency(repayment.expectedAmount)} for Loan #${loan.id}`,
        priority: "medium",
        createdAt: new Date().toISOString(),
        isRead: false,
        relatedId: loan.id,
        relatedType: "loan"
      });
    }
  });

  // KYC pending customers
  const kycPendingCustomers = accessibleCustomers.filter(c => c.kycStatus === "Pending");
  kycPendingCustomers.forEach(customer => {
    notifications.push({
      id: notificationId++,
      type: "kyc_pending",
      title: "KYC Pending",
      message: `KYC verification is pending for ${customer.name}`,
      priority: "medium",
      createdAt: new Date().toISOString(),
      isRead: false,
      relatedId: customer.id,
      relatedType: "customer"
    });
  });

  // Pending applications
  const pendingApplications = accessibleApplications.filter(app =>
    ["Draft", "Submitted", "Under Review"].includes(app.status)
  );
  pendingApplications.forEach(application => {
    const customer = accessibleCustomers.find(c => c.id === application.customerId);
    if (customer) {
      notifications.push({
        id: notificationId++,
        type: "application_pending",
        title: "Application Pending",
        message: `Application #${application.id} from ${customer.name} is pending review`,
        priority: "low",
        createdAt: new Date().toISOString(),
        isRead: false,
        relatedId: application.id,
        relatedType: "application"
      });
    }
  });

  return notifications.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export function getNotificationCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead).length;
}

export function getCriticalNotificationCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead && n.priority === "critical").length;
}

// Dashboard Summary Utilities
export interface DashboardSummary {
  totalCustomers: number;
  totalApplications: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  collectionEfficiency: number;
  overdueAmount: number;
  overdueLoans: number;
  pendingApplications: number;
  kycPending: number;
  dueToday: number;
  criticalAlerts: number;
}

export function generateDashboardSummary(
  loans: Loan[],
  customers: Customer[],
  applications: LoanApplication[],
  repayments: Repayment[],
  user: User
): DashboardSummary {
  const accessibleLoans = filterLoansByUser(loans, customers, user);
  const accessibleCustomers = filterCustomersByUser(customers, user);
  const accessibleApplications = filterLoanApplicationsByUser(applications, customers, user);

  const totalDisbursed = accessibleLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalCollected = repayments
    .filter(r => r.status === "Paid" && accessibleLoans.some(loan => loan.id === r.loanId))
    .reduce((sum, r) => sum + r.paidAmount, 0);

  const overdueAmount = repayments
    .filter(r => r.status === "Overdue" && accessibleLoans.some(loan => loan.id === r.loanId))
    .reduce((sum, r) => sum + r.expectedAmount, 0);

  const overdueLoans = accessibleLoans.filter(loan => {
    const loanRepayments = repayments.filter(r => r.loanId === loan.id && r.status === "Overdue");
    return loanRepayments.length > 0;
  }).length;

  const today = new Date().toISOString().split('T')[0];
  const dueToday = repayments.filter(r =>
    r.dueDate === today && r.status === "Pending" && accessibleLoans.some(loan => loan.id === r.loanId)
  ).length;

  const notifications = generateNotifications(loans, customers, applications, repayments, user);
  const criticalAlerts = getCriticalNotificationCount(notifications);

  return {
    totalCustomers: accessibleCustomers.length,
    totalApplications: accessibleApplications.length,
    activeLoans: accessibleLoans.filter(loan => loan.status === "Active").length,
    totalDisbursed,
    totalCollected,
    collectionEfficiency: totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0,
    overdueAmount,
    overdueLoans,
    pendingApplications: accessibleApplications.filter(app =>
      ["Draft", "Submitted", "Under Review"].includes(app.status)
    ).length,
    kycPending: accessibleCustomers.filter(c => c.kycStatus === "Pending").length,
    dueToday,
    criticalAlerts
  };
}

// Search Utilities
export interface SearchResult {
  type: "customer" | "loan" | "application";
  id: number;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  priority: number;
}

export function searchAll(
  query: string,
  customers: Customer[],
  loans: Loan[],
  applications: LoanApplication[],
  user: User
): SearchResult[] {
  const results: SearchResult[] = [];
  const searchTerm = query.toLowerCase().trim();

  if (searchTerm.length < 2) return results;

  // Filter accessible data
  const accessibleCustomers = filterCustomersByUser(customers, user);
  const accessibleLoans = filterLoansByUser(loans, customers, user);
  const accessibleApplications = filterLoanApplicationsByUser(applications, customers, user);

  // Search customers
  accessibleCustomers.forEach(customer => {
    const matches = [
      customer.name.toLowerCase(),
      customer.phone,
      customer.email.toLowerCase(),
      customer.pincode
    ].some(field => field.includes(searchTerm));

    if (matches) {
      results.push({
        type: "customer",
        id: customer.id,
        title: customer.name,
        subtitle: customer.phone,
        description: `${customer.email} • ${customer.kycStatus} • ${customer.pincode}`,
        url: `/customers`,
        priority: customer.name.toLowerCase().startsWith(searchTerm) ? 3 : 1
      });
    }
  });

  // Search loans
  accessibleLoans.forEach(loan => {
    const customer = accessibleCustomers.find(c => c.id === loan.customerId);
    const matches = [
      loan.id.toString(),
      customer?.name.toLowerCase() || "",
      loan.status.toLowerCase(),
      formatCurrency(loan.amount)
    ].some(field => field.includes(searchTerm));

    if (matches) {
      results.push({
        type: "loan",
        id: loan.id,
        title: `Loan #${loan.id}`,
        subtitle: customer?.name || "Unknown Customer",
        description: `${formatCurrency(loan.amount)} • ${loan.status} • ${loan.interestRate}% • ${loan.tenureMonths} months`,
        url: `/loans`,
        priority: loan.id.toString().includes(searchTerm) ? 3 : 1
      });
    }
  });

  // Search applications
  accessibleApplications.forEach(application => {
    const customer = accessibleCustomers.find(c => c.id === application.customerId);
    const matches = [
      application.id.toString(),
      customer?.name.toLowerCase() || "",
      application.product.toLowerCase(),
      application.status.toLowerCase(),
      formatCurrency(application.amount)
    ].some(field => field.includes(searchTerm));

    if (matches) {
      results.push({
        type: "application",
        id: application.id,
        title: `Application #${application.id}`,
        subtitle: customer?.name || "Unknown Customer",
        description: `${application.product} • ${formatCurrency(application.amount)} • ${application.status}`,
        url: `/applications`,
        priority: application.id.toString().includes(searchTerm) ? 3 : 1
      });
    }
  });

  // Sort by priority and relevance
  return results.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.title.localeCompare(b.title);
  }).slice(0, 10); // Limit to top 10 results
}

// Export utility for getting search suggestions
export function getSearchSuggestions(
  customers: Customer[],
  loans: Loan[],
  applications: LoanApplication[],
  user: User
): string[] {
  const suggestions: string[] = [];

  const accessibleCustomers = filterCustomersByUser(customers, user);
  const accessibleLoans = filterLoansByUser(loans, customers, user);
  const accessibleApplications = filterLoanApplicationsByUser(applications, customers, user);

  // Add customer names
  accessibleCustomers.forEach(customer => {
    suggestions.push(customer.name);
  });

  // Add loan IDs
  accessibleLoans.forEach(loan => {
    suggestions.push(`Loan #${loan.id}`);
  });

  // Add application IDs
  accessibleApplications.forEach(app => {
    suggestions.push(`Application #${app.id}`);
  });

  // Add common statuses
  suggestions.push("Active", "Pending", "Approved", "Rejected", "Overdue");

  return suggestions.slice(0, 20); // Limit suggestions
}
