import { describe, expect, it } from "vitest";
import { INITIAL_STATE, type GameState } from "./gameLogic";
import { collectLoanPayment, createLoan, getLoanDue, getLoanEligibility, LOAN_OFFERS, payOffLoanEarly } from "./loanSystem";
import { advanceWithSimulation } from "./useGameState";

const clone = () => structuredClone(INITIAL_STATE) as GameState;
const communityLoan = LOAN_OFFERS[0];

describe("career loans", () => {
  it("enforces offer eligibility and one active loan", () => {
    const state = clone();
    expect(getLoanEligibility(state, communityLoan).eligible).toBe(true);
    expect(getLoanEligibility(state, LOAN_OFFERS[1]).eligible).toBe(false);
    state.activeLoan = createLoan(communityLoan, state.week);
    expect(getLoanEligibility(state, communityLoan).eligible).toBe(false);
  });

  it("collects the agreed weekly payment and reduces the balance", () => {
    const state = clone();
    state.money = 500;
    state.activeLoan = createLoan(communityLoan, state.week);
    expect(getLoanDue(state.activeLoan)).toBe(165);

    expect(collectLoanPayment(state)).toBe(165);
    expect(state.money).toBe(335);
    expect(state.activeLoan?.remainingBalance).toBe(1485);
    expect(state.activeLoan?.arrears).toBe(0);
  });

  it("carries an uncovered payment into arrears and costs reputation", () => {
    const state = clone();
    state.money = 100;
    state.rep = 10;
    state.activeLoan = createLoan(communityLoan, state.week);

    expect(collectLoanPayment(state)).toBe(100);
    expect(state.money).toBe(0);
    expect(state.activeLoan?.arrears).toBe(65);
    expect(state.activeLoan?.remainingBalance).toBe(1550);
    expect(state.rep).toBe(9);
  });

  it("allows an early payoff without adding a fee", () => {
    const state = clone();
    state.activeLoan = createLoan(communityLoan, state.week);
    state.money = state.activeLoan.remainingBalance;

    expect(payOffLoanEarly(state)).toBe(true);
    expect(state.money).toBe(0);
    expect(state.activeLoan).toBeNull();
  });

  it("records the actual loan collection in the weekly ledger", () => {
    const state = clone();
    state.money = 10000;
    state.weeklyExpenses = 380;
    state.activeLoan = createLoan(communityLoan, state.week);
    const next = advanceWithSimulation(state);
    expect(next.weeklyLedger[0].costByCategory?.["Loan payment"]).toBe(165);
  });
});
