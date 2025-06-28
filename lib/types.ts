// src/app/core/models/models.ts

export interface Partner {
  id: number;
  name: string;
  code: string;
  status: "Active" | "Inactive";
  servicingPincodes: string[]; // Array of pincodes this partner can service
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
  partnerId?: number; // null for admin, partner ID for staff
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  guardianName?: string;
  occupation?: string;
  incomeSource?: string;
  monthlyIncome?: number;
  kycStatus: "NotStarted" | "Pending" | "Verified" | "Rejected";
  pincode: string; // Primary pincode for partner assignment
  partnerId?: number; // Assigned partner based on pincode
  createdAt: string;
}

export interface Address {
  id: number;
  customerId: number;
  type: "permanent" | "residence" | "office";
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  isVerified: boolean;
  verificationDate?: string;
}

export interface LoanApplication {
  id: number;
  customerId: number; // primary applicant
  amount: number;
  product: string;
  purpose: string;
  interestRate: number;
  tenureMonths: number;
  repaymentFrequency: "Monthly" | "Weekly" | "Daily" | "Quarterly";
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected";
  remarks?: string;
  documents?: string[];

  // 👥 Role-based relationships (Customer IDs)
  coApplicantIds: number[];
  guarantorIds: number[];

  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: number;
  customerId: number; // primary applicant
  applicationId: number;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  disbursementDate: string;
  gracePeriodDays: number;
  repaymentFrequency: "Monthly" | "Weekly" | "Daily" | "Quarterly";
  amortizationType: "EMI" | "Flat" | "Reducing";
  overdueDays?: number;
  status: "Active" | "Closed" | "Defaulted" | "PreClosed";

  // 👥 Role-based relationships (Customer IDs)
  coApplicantIds: number[];
  guarantorIds: number[];

  createdAt: string;
  updatedAt: string;
}

export interface Repayment {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  paidDate: string | null;
  paidAmount: number;
  expectedAmount: number;
  principalAmount: number;
  interestAmount: number;
  paymentMode: "Cash" | "UPI" | "BankTransfer";
  isAdvancePayment: boolean;
  status: "Pending" | "Paid" | "Overdue" | "Partial";
  overdueDays: number;
  collectionAgent?: string;
  remarks?: string;
}

export interface CollectionSchedule {
  id: number;
  loanId: number;
  customerId: number;
  dueDate: string;
  emiAmount: number;
  status: "Upcoming" | "Due" | "Overdue" | "Paid" | "Partial";
  overdueDays: number;
  collectionAgent?: string;
  lastReminderDate?: string;
  nextReminderDate?: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface Penalty {
  id: number;
  loanId: number;
  repaymentId?: number;
  date: string;
  amount: number;
  reason: string;
  penaltyType: "LatePayment" | "PreClosure" | "BounceCharge";
  calculationMethod: "Fixed" | "Percentage" | "PerDay";
}

export interface TopUp {
  id: number;
  loanId: number;
  requestedAmount: number;
  tenureMonths: number;
  interestRate: number;
  status: "Requested" | "Approved" | "Rejected";
  requestDate: string;
  approvedDate?: string;
}

export interface LoanClosure {
  id: number;
  loanId: number;
  closureDate: string | null;
  status: "Pending" | "Closed";
  settlementAmount: number;
  remarks?: string;
  closedBy?: string;
  requestDate: string;
}

export interface Voucher {
  id: number;
  type: "Receipt" | "Payment";
  amount: number;
  note: string;
  loanId?: number;
  customerId?: number;
  referenceId?: string;
  category?: string;
  date: string;
}

export interface Journal {
  id: number;
  entry: string;
  loanId?: number;
  amount: number;
  type: "Debit" | "Credit";
  referenceId?: string;
  category?: string;
  date: string;
}

export interface Transaction {
  id: number;
  customerId: number;
  loanId?: number;
  description: string;
  amount: number;
  type: "Debit" | "Credit";
  date: string;
  referenceId?: string;
}

// Reporting Types
export interface ReportFilter {
  startDate: string;
  endDate: string;
  partnerId?: number;
  status?: string;
  product?: string;
}

export interface PortfolioReport {
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  defaultedLoans: number;
  totalDisbursed: number;
  totalOutstanding: number;
  totalCollected: number;
  averageLoanSize: number;
  averageInterestRate: number;
  collectionEfficiency: number;
  overdueAmount: number;
  overdueLoans: number;
}

export interface CollectionReport {
  totalDue: number;
  collectedAmount: number;
  overdueAmount: number;
  collectionEfficiency: number;
  overdueLoans: number;
  dueToday: number;
  dueThisWeek: number;
  dueThisMonth: number;
  agentPerformance: AgentPerformance[];
}

export interface AgentPerformance {
  agentName: string;
  totalAssigned: number;
  collected: number;
  overdue: number;
  efficiency: number;
  totalAmount: number;
}

export interface FinancialReport {
  totalReceipts: number;
  totalPayments: number;
  netBalance: number;
  interestEarned: number;
  feesCollected: number;
  penaltiesCollected: number;
  monthlyBreakdown: MonthlyFinancial[];
}

export interface MonthlyFinancial {
  month: string;
  receipts: number;
  payments: number;
  netAmount: number;
  interestEarned: number;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  kycPending: number;
  kycVerified: number;
  kycRejected: number;
  customerByPartner: CustomerByPartner[];
}

export interface CustomerByPartner {
  partnerName: string;
  totalCustomers: number;
  activeLoans: number;
  totalDisbursed: number;
}

export interface ApplicationReport {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  approvalRate: number;
  averageProcessingTime: number;
  applicationsByProduct: ApplicationByProduct[];
}

export interface ApplicationByProduct {
  product: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
}

export interface LoanProduct {
  id: number;
  name: string;
  code: string;
  description: string;
  category: "Personal" | "Business" | "Home" | "Vehicle" | "Education" | "Other";
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  interestRate: number;
  processingFee: number;
  prepaymentPenalty: number;
  latePaymentPenalty: number;
  eligibilityCriteria: {
    minAge: number;
    maxAge: number;
    minIncome: number;
    requiredDocuments: string[];
    creditScoreRequired: boolean;
  };
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}
