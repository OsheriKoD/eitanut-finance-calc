export type PropertyType = 'firstHome' | 'replacement' | 'investment' | 'anyPurpose';
export type IncomeStability = 'employed' | 'selfEmployed' | 'pensioner';

export const MAX_LTV: Record<PropertyType, number> = {
  firstHome:   0.75,
  replacement: 0.70,
  investment:  0.50,
  anyPurpose:  0.50,
};

export const MAX_PTI = 0.40;

export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 12 / 100;
}

export function numPayments(loanYears: number): number {
  return loanYears * 12;
}

export function calcMonthlyPayment(principal: number, annualRatePct: number, loanYears: number): number {
  if (principal <= 0) return 0;
  const r = monthlyRate(annualRatePct);
  const n = numPayments(loanYears);
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcMaxPrincipal(monthlyPayment: number, annualRatePct: number, loanYears: number): number {
  const r = monthlyRate(annualRatePct);
  const n = numPayments(loanYears);
  if (r === 0) return monthlyPayment * n;
  return (monthlyPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

export function fromPropertyValue(propertyValue: number, propertyType: PropertyType, annualRatePct: number, loanYears: number) {
  const ltv = MAX_LTV[propertyType];
  const maxMortgage = propertyValue * ltv;
  const requiredEquity = propertyValue - maxMortgage;
  const monthlyPayment = calcMonthlyPayment(maxMortgage, annualRatePct, loanYears);
  const n = numPayments(loanYears);
  const totalPayments = monthlyPayment * n;
  return { propertyValue, mortgageAmount: maxMortgage, requiredEquity, monthlyPayment, totalPayments, totalInterest: totalPayments - maxMortgage, ltv, ltvPct: ltv * 100 };
}

export function fromEquity(equity: number, propertyType: PropertyType, annualRatePct: number, loanYears: number) {
  const ltv = MAX_LTV[propertyType];
  const propertyValue = equity / (1 - ltv);
  const mortgageAmount = propertyValue - equity;
  const monthlyPayment = calcMonthlyPayment(mortgageAmount, annualRatePct, loanYears);
  const n = numPayments(loanYears);
  const totalPayments = monthlyPayment * n;
  return { propertyValue, mortgageAmount, requiredEquity: equity, monthlyPayment, totalPayments, totalInterest: totalPayments - mortgageAmount, ltv, ltvPct: ltv * 100 };
}

export function fromMortgageAmount(mortgageAmount: number, propertyType: PropertyType, annualRatePct: number, loanYears: number) {
  const ltv = MAX_LTV[propertyType];
  const propertyValue = mortgageAmount / ltv;
  const requiredEquity = propertyValue - mortgageAmount;
  const monthlyPayment = calcMonthlyPayment(mortgageAmount, annualRatePct, loanYears);
  const n = numPayments(loanYears);
  const totalPayments = monthlyPayment * n;
  return { propertyValue, mortgageAmount, requiredEquity, monthlyPayment, totalPayments, totalInterest: totalPayments - mortgageAmount, ltv, ltvPct: ltv * 100 };
}

export function fromIncome(monthlyIncome: number, equity: number, propertyType: PropertyType, annualRatePct: number, loanYears: number) {
  const maxMonthlyPayment = monthlyIncome * MAX_PTI;
  const maxByPayment = calcMaxPrincipal(maxMonthlyPayment, annualRatePct, loanYears);
  const ltv = MAX_LTV[propertyType];
  const maxMortgageByLtv = (equity / (1 - ltv)) * ltv;
  const mortgageAmount = Math.min(maxByPayment, maxMortgageByLtv);
  const propertyValue = mortgageAmount / ltv;
  const requiredEquity = propertyValue - mortgageAmount;
  const monthlyPayment = calcMonthlyPayment(mortgageAmount, annualRatePct, loanYears);
  const n = numPayments(loanYears);
  const totalPayments = monthlyPayment * n;
  return { propertyValue, mortgageAmount, requiredEquity, monthlyPayment, maxMonthlyPayment, totalPayments, totalInterest: totalPayments - mortgageAmount, ltv, ltvPct: ltv * 100 };
}

export function calcPTI(monthlyPayment: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return monthlyPayment / monthlyIncome;
}

export type PTIRisk = 'green' | 'yellow' | 'red';

export function ptiRisk(pti: number): PTIRisk {
  if (pti < 0.30) return 'green';
  if (pti <= 0.40) return 'yellow';
  return 'red';
}

export function calcQualificationScore(inputs: { ltv: number; pti: number; incomeStability: IncomeStability; borrowerAge: number; loanYears: number }): number {
  const { ltv, pti, incomeStability, borrowerAge, loanYears } = inputs;
  const ltvScore = Math.max(0, Math.min(100, (1 - ltv) / 0.5 * 100));
  const ptiScore = Math.max(0, Math.min(100, (1 - pti / MAX_PTI) * 100));
  const stabilityScore = incomeStability === 'employed' ? 100 : incomeStability === 'pensioner' ? 80 : 60;
  const ageScore = borrowerAge >= 30 && borrowerAge <= 45 ? 100 : borrowerAge < 30 ? 70 : borrowerAge <= 55 ? 80 : borrowerAge <= 65 ? 60 : 40;
  const durationScore = Math.max(0, Math.min(100, (30 - loanYears) / 30 * 100 + 33));
  return Math.round(Math.max(0, Math.min(100, ltvScore * 0.30 + ptiScore * 0.30 + stabilityScore * 0.15 + ageScore * 0.15 + durationScore * 0.10)));
}

export function calcRefinance(currentBalance: number, currentRate: number, remainingYears: number, newRate: number, newDuration: number, closingCosts = 5000) {
  const currentPmt = calcMonthlyPayment(currentBalance, currentRate, remainingYears);
  const currentRemainingCost = currentPmt * numPayments(remainingYears);
  const newPmt = calcMonthlyPayment(currentBalance, newRate, newDuration);
  const newTotalCost = newPmt * numPayments(newDuration);
  const monthlySavings = currentPmt - newPmt;
  const totalSavings = currentRemainingCost - newTotalCost;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;
  return { currentMonthlyPayment: currentPmt, currentRemainingCost, newMonthlyPayment: newPmt, newTotalCost, monthlySavings, totalSavings, breakEvenMonths };
}

export function calcLoanForAnyPurpose(propertyValue: number, existingMortgage: number) {
  const maxDebt = propertyValue * 0.50;
  const availableLoan = Math.max(0, maxDebt - existingMortgage);
  return { maxDebt, availableLoan };
}
