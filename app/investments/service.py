from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from math import isclose

from .models import InvestmentInput, InvestmentResult, ScenarioResult, SensitivityCell


@dataclass(frozen=True)
class MonthlyPlan:
    months: int
    monthly_rate: float
    inflation_monthly_rate: float


def to_months(value: int, unit: str) -> int:
    return value if unit == "months" else value * 12


def to_monthly_rate(percent: float, period: str) -> float:
    decimal = percent / 100
    if period == "monthly":
        return decimal
    return (1 + decimal) ** (1 / 12) - 1


def annual_to_monthly(percent: float) -> float:
    return (1 + percent / 100) ** (1 / 12) - 1


def monthly_cashflows(payload: InvestmentInput, monthly_rate_override: float | None = None) -> tuple[list[float], list[float]]:
    total_months = to_months(payload.tenure.value, payload.tenure.unit)
    base_rate = monthly_rate_override if monthly_rate_override is not None else to_monthly_rate(payload.return_rate.value, payload.return_rate.period)
    scenario_map = {item.from_month: to_monthly_rate(item.rate.value, item.rate.period) for item in payload.return_rate_scenarios}

    investment = payload.sip_per_month
    corpus = 0.0
    outflows: list[float] = []
    inflows: list[float] = []

    current_rate = base_rate
    for m in range(1, total_months + 1):
        if m in scenario_map:
            current_rate = scenario_map[m]

        if m > 1 and (m - 1) % 12 == 0 and payload.annual_step_up_percent:
            investment *= 1 + payload.annual_step_up_percent / 100

        outflows.append(-investment)
        corpus = (corpus + investment) * (1 + current_rate)
        inflows.append(corpus)

    return outflows, inflows


def _xirr_from_cashflows(flows: list[float], dates: list[date], guess: float = 0.1) -> float:
    rate = guess
    for _ in range(100):
        f = 0.0
        df = 0.0
        for cf, dt in zip(flows, dates):
            days = (dt - dates[0]).days / 365
            denom = (1 + rate) ** days
            f += cf / denom
            if not isclose(denom, 0.0):
                df -= (days * cf) / ((1 + rate) ** (days + 1))

        if isclose(df, 0.0):
            break
        new_rate = rate - f / df
        if abs(new_rate - rate) < 1e-8:
            return max(new_rate, -0.999)
        rate = new_rate
    return max(rate, -0.999)


def evaluate(payload: InvestmentInput, monthly_rate_override: float | None = None, inflation_override: float | None = None) -> ScenarioResult:
    outflows, inflows = monthly_cashflows(payload, monthly_rate_override)
    total_invested = abs(sum(outflows))
    nominal = inflows[-1]

    tax = payload.tax_rate / 100
    gain = max(0.0, nominal - total_invested)
    post_tax = nominal - (gain * tax)

    months = to_months(payload.tenure.value, payload.tenure.unit)
    inflation_monthly = annual_to_monthly((payload.inflation_rate + (inflation_override or 0)))
    real_corpus = post_tax / ((1 + inflation_monthly) ** months)

    years = months / 12
    approx_cagr = ((nominal / total_invested) ** (1 / years) - 1) * 100 if total_invested > 0 and years > 0 else 0

    start = date(2026, 1, 1)
    flow_dates = [date(start.year + (i // 12), ((start.month + i - 1) % 12) + 1, 1) for i in range(len(outflows))]
    flows = outflows + [nominal]
    xirr_dates = flow_dates + [date(start.year + (months // 12), ((start.month + months - 1) % 12) + 1, 28)]
    approx_xirr = _xirr_from_cashflows(flows, xirr_dates) * 100

    return ScenarioResult(
        nominal_future_value=round(nominal, 2),
        pretax_corpus=round(nominal, 2),
        posttax_corpus=round(post_tax, 2),
        real_corpus=round(real_corpus, 2),
        invested_amount=round(total_invested, 2),
        approx_cagr_percent=round(approx_cagr, 4),
        approx_xirr_percent=round(approx_xirr, 4),
    )


def build_result(payload: InvestmentInput) -> InvestmentResult:
    base_rate = to_monthly_rate(payload.return_rate.value, payload.return_rate.period)

    conservative_delta = payload.scenario_bands.conservative if payload.scenario_bands.conservative is not None else -2.0
    aggressive_delta = payload.scenario_bands.aggressive if payload.scenario_bands.aggressive is not None else 2.0
    base_delta = payload.scenario_bands.base if payload.scenario_bands.base is not None else 0.0

    base = evaluate(payload, monthly_rate_override=base_rate + (base_delta / 100 / 12))
    conservative = evaluate(payload, monthly_rate_override=max(0.0, base_rate + (conservative_delta / 100 / 12)))
    aggressive = evaluate(payload, monthly_rate_override=max(0.0, base_rate + (aggressive_delta / 100 / 12)))

    sensitivity: list[SensitivityCell] = []
    for r_delta in (-3, -2, -1, 1, 2, 3):
        for i_delta in (-2, -1, 1, 2):
            scenario = evaluate(
                payload,
                monthly_rate_override=max(0.0, base_rate + (r_delta / 100 / 12)),
                inflation_override=i_delta,
            )
            sensitivity.append(
                SensitivityCell(
                    return_adjustment_percent=r_delta,
                    inflation_adjustment_percent=i_delta,
                    nominal_future_value=scenario.nominal_future_value,
                    real_corpus=scenario.real_corpus,
                )
            )

    return InvestmentResult(
        base=base,
        conservative=conservative,
        aggressive=aggressive,
        sensitivity=sensitivity,
        metadata={"sensitivity_rows": len(sensitivity)},
    )
