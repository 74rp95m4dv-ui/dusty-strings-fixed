import type { ActiveLoan, GameState } from "./gameLogic";

export type LoanOffer = {
  id: string;
  lenderName: string;
  principal: number;
  termWeeks: number;
  totalRepayment: number;
  weeklyPayment: number;
  eligibility: string;
  isEligible: (state: Pick<GameState, "totalReleases" | "fans" | "totalShows">) => boolean;
};

export const LOAN_OFFERS: LoanOffer[] = [
  { id: "community_credit", lenderName: "Community Credit Union", principal: 1500, termWeeks: 10, totalRepayment: 1650, weeklyPayment: 165, eligibility: "Available from career start", isEligible: () => true },
  { id: "artist_services", lenderName: "Artist Services Finance", principal: 3000, termWeeks: 18, totalRepayment: 3600, weeklyPayment: 200, eligibility: "Requires 1 release and 500 fans", isEligible: state => state.totalReleases >= 1 && state.fans >= 500 },
  { id: "tour_underwriter", lenderName: "Tour Underwriter", principal: 6000, termWeeks: 30, totalRepayment: 7800, weeklyPayment: 260, eligibility: "Requires 4 shows and 2,000 fans", isEligible: state => state.totalShows >= 4 && state.fans >= 2000 },
];

export function getLoanOffer(id: string) {
  return LOAN_OFFERS.find(offer => offer.id === id);
}

export function getLoanEligibility(state: GameState, offer: LoanOffer) {
  if (state.activeLoan) return { eligible: false, reason: "Pay off your active loan before applying again." };
  if (!offer.isEligible(state)) return { eligible: false, reason: offer.eligibility };
  return { eligible: true, reason: "" };
}

export function createLoan(offer: LoanOffer, week: number): ActiveLoan {
  return {
    lenderId: offer.id,
    lenderName: offer.lenderName,
    principal: offer.principal,
    totalRepayment: offer.totalRepayment,
    weeklyPayment: offer.weeklyPayment,
    termWeeks: offer.termWeeks,
    paymentsDue: 0,
    remainingBalance: offer.totalRepayment,
    arrears: 0,
    startedWeek: week,
  };
}

export function getLoanDue(loan: ActiveLoan): number {
  const scheduled = loan.paymentsDue < loan.termWeeks
    ? Math.min(loan.weeklyPayment, Math.max(0, loan.remainingBalance - loan.arrears))
    : 0;
  return Math.min(loan.remainingBalance, loan.arrears + scheduled);
}

/** Collects as much of the due payment as the career can safely cover. */
export function collectLoanPayment(state: GameState): number {
  const loan = state.activeLoan;
  if (!loan) return 0;

  const due = getLoanDue(loan);
  const paid = Math.min(Math.max(0, state.money), due);
  state.money -= paid;
  loan.remainingBalance = Math.max(0, loan.remainingBalance - paid);

  if (loan.paymentsDue < loan.termWeeks) loan.paymentsDue += 1;
  loan.arrears = Math.max(0, due - paid);

  if (loan.arrears > 0) {
    state.rep = Math.max(0, state.rep - 1);
    state.log.unshift({ week: state.week, msg: `${loan.lenderName} payment fell short by $${Math.round(loan.arrears).toLocaleString()}. Your account is now past due.`, type: "bad" });
  } else if (paid > 0) {
    state.log.unshift({ week: state.week, msg: `${loan.lenderName} payment: $${Math.round(paid).toLocaleString()}.`, type: "neutral" });
  }

  if (loan.remainingBalance <= 0) {
    state.log.unshift({ week: state.week, msg: `${loan.lenderName} loan paid in full.`, type: "great" });
    state.activeLoan = null;
  }
  return paid;
}

export function payOffLoanEarly(state: GameState): boolean {
  const loan = state.activeLoan;
  if (!loan || state.money < loan.remainingBalance) return false;
  state.money -= loan.remainingBalance;
  state.activeLoan = null;
  return true;
}
