import type { LoanProduct } from '@/types/database';

export interface LoanCalculation {
  principal: number;
  interestRate: number;
  termMonths: number;
  interestAmount: number;
  totalRepayable: number;
  monthlyPayment: number;
  processingFee: number;
}

export function calculateLoan(
  product: Pick<
    LoanProduct,
    'interest_rate' | 'processing_fee_type' | 'processing_fee_value'
  >,
  amount: number,
  termMonths: number
): LoanCalculation {
  const principal = amount;
  const interestAmount = (principal * (product.interest_rate / 100) * termMonths) / 12;
  const totalRepayable = principal + interestAmount;
  const monthlyPayment = totalRepayable / termMonths;

  let processingFee = 0;
  if (product.processing_fee_type === 'fixed') {
    processingFee = product.processing_fee_value;
  } else if (product.processing_fee_type === 'percentage') {
    processingFee = (principal * product.processing_fee_value) / 100;
  }

  return {
    principal,
    interestRate: product.interest_rate,
    termMonths,
    interestAmount: round2(interestAmount),
    totalRepayable: round2(totalRepayable),
    monthlyPayment: round2(monthlyPayment),
    processingFee: round2(processingFee),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isFeeRequired(product: Pick<LoanProduct, 'processing_fee_value'>): boolean {
  return product.processing_fee_value > 0;
}
