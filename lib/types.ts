// ===== USER / MEMBER =====
export type UserRole = 'super_admin' | 'admin' | 'finance_manager' | 'loan_manager' | 'member';
export type UserStatus = 'pending' | 'active' | 'suspended';

export interface User {
  uid:          string;
  name:         string;
  email:        string;
  phone:        string;
  address:      string;
  profession:   string;
  nidNumber:    string;
  nidFrontUrl?: string;
  nidBackUrl?:  string;
  familyCount:  number;
  refCode:      string;
  referredBy?:  string;
  role:         UserRole;
  status:       UserStatus;
  createdAt:    string;
  updatedAt:    string;
}

// ===== DONATION =====
export type DonationMethod  = 'bkash' | 'nagad' | 'rocket' | 'dbbl' | 'sslcommerz' | 'direct';
export type DonationStatus  = 'pending' | 'confirmed' | 'rejected';
export type DonationType    = 'সাধারণ' | 'মাসিক দান' | 'বিশেষ' | 'যাকাত' | 'ফিতরা';

export interface FamilyMember {
  name:         string;
  relation:     string;
}

export interface Donation {
  id:            string;
  userId:        string;
  userName:      string;
  userPhone:     string;
  amount:        number;
  type:          DonationType | string;
  method:        DonationMethod;
  transactionId: string;
  status:        DonationStatus;
  familyMembers?: FamilyMember[];
  note?:         string;
  createdAt:     string;
  confirmedAt?:  string;
  confirmedBy?:  string;
}

// ===== LOAN =====
export type LoanPurpose = 'চিকিৎসা' | 'ব্যবসা' | 'শিক্ষা' | 'কৃষি' | 'জরুরি' | 'অন্যান্য';
export type LoanStatus  = 'pending' | 'approved' | 'rejected' | 'repaid';

export interface Guarantor {
  name:       string;
  phone:      string;
  address:    string;
  relation:   string;
}

export interface Loan {
  id:              string;
  userId:          string;
  userName:        string;
  userPhone:       string;
  userAddress:     string;
  userProfession:  string;
  userIncome:      number;
  amount:          number;
  purpose:         LoanPurpose;
  repaymentPlan:   string;
  guarantors:      Guarantor[];
  status:          LoanStatus;
  note?:           string;
  createdAt:       string;
  approvedAt?:     string;
  approvedBy?:     string;
}

// ===== NOTIFICATION =====
export interface Notification {
  id:        string;
  userId:    string;
  title:     string;
  message:   string;
  type:      'info' | 'success' | 'warning' | 'error';
  read:      boolean;
  createdAt: string;
}

// ===== NOTICE =====
export interface Notice {
  id:        string;
  title:     string;
  content:   string;
  createdBy: string;
  createdAt: string;
}

// ===== SAVINGS =====
export interface Saving {
  id:          string;
  userId:      string;
  userName:    string;
  amount:      number;
  note?:       string;
  createdBy:   string;
  createdAt:   string;
}

// ===== EXPENSE =====
export interface Expense {
  id:          string;
  title:       string;
  amount:      number;
  category:    string;
  note?:       string;
  createdBy:   string;
  createdAt:   string;
}

// ===== SAVING REQUEST =====
export type SavingMethod        = 'bkash' | 'nagad' | 'rocket' | 'dbbl' | 'direct';
export type SavingRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SavingRequest {
  id:            string;
  userId:        string;
  userName:      string;
  userPhone:     string;
  amount:        number;
  method:        SavingMethod;
  transactionId: string;
  status:        SavingRequestStatus;
  note?:         string;
  createdAt:     string;
  approvedAt?:   string;
  approvedBy?:   string;
  receiptData?:  {
    receiptNo:   string;
    approvedAt:  string;
    approvedBy:  string;
  };
}
