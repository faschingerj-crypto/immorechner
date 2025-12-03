export enum AppTab {
  CALCULATOR = 'CALCULATOR',
  PORTFOLIO = 'PORTFOLIO',
  MARKET = 'MARKET',
  SAVINGS = 'SAVINGS',
}

export interface CalculatorState {
  purchasePrice: number;
  renovationCost: number;
  closingCostsPercent: number;
  interestRate: number;
  loanTermYears: number;
  downPaymentMode: 'percent' | 'absolute';
  downPaymentValue: number; // stores either % (e.g., 20) or value (e.g., 50000)
  monthlyRent: number;
  monthlyMaintenance: number; // Hausgeld/Instandhaltung nicht umlagefähig
  location: string;
}

export interface FinancialResult {
  totalInvestment: number; // Eigenkapital total
  loanAmount: number;
  monthlyRate: number; // Kreditrate
  monthlyCashflow: number;
  roi: number; // Cash on Cash Return %
  breakEvenRent: number; // Minimum rent for 0 cashflow
  totalCost: number; // Kaufpreis + NK + Sanierung
  amortizationYears: number; // Years until investment is paid back via cashflow
}

export interface SearchResult {
  title: string;
  url: string;
  price?: string;
  location?: string;
  description?: string;
}