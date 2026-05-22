from __future__ import annotations

from typing import Dict, Optional

from pydantic import BaseModel, Field, field_validator


class ReturnRateInput(BaseModel):
    value: float = Field(..., gt=0, description="Expected return rate in percent")
    period: str = Field(..., pattern="^(monthly|annual)$")


class TenureInput(BaseModel):
    value: int = Field(..., gt=0, description="Tenure value")
    unit: str = Field(..., pattern="^(months|years)$")


class ReturnRateScenario(BaseModel):
    from_month: int = Field(..., ge=1)
    rate: ReturnRateInput


class ScenarioBandInput(BaseModel):
    conservative: Optional[float] = None
    base: Optional[float] = None
    aggressive: Optional[float] = None


class InvestmentInput(BaseModel):
    sip_per_month: float = Field(..., gt=0)
    return_rate: ReturnRateInput
    tenure: TenureInput
    tax_rate: float = Field(..., ge=0, le=100)
    inflation_rate: float = Field(..., ge=0, le=100)
    annual_step_up_percent: float = Field(0, ge=0, le=100)
    return_rate_scenarios: list[ReturnRateScenario] = Field(default_factory=list)
    scenario_bands: ScenarioBandInput = Field(default_factory=ScenarioBandInput)

    @field_validator("return_rate_scenarios")
    @classmethod
    def validate_scenarios(cls, scenarios: list[ReturnRateScenario]) -> list[ReturnRateScenario]:
        months = [item.from_month for item in scenarios]
        if len(set(months)) != len(months):
            raise ValueError("return_rate_scenarios should not contain duplicate from_month")
        return sorted(scenarios, key=lambda x: x.from_month)


class ScenarioResult(BaseModel):
    nominal_future_value: float
    pretax_corpus: float
    posttax_corpus: float
    real_corpus: float
    invested_amount: float
    approx_cagr_percent: float
    approx_xirr_percent: float


class SensitivityCell(BaseModel):
    return_adjustment_percent: float
    inflation_adjustment_percent: float
    nominal_future_value: float
    real_corpus: float


class InvestmentResult(BaseModel):
    base: ScenarioResult
    conservative: ScenarioResult
    aggressive: ScenarioResult
    sensitivity: list[SensitivityCell]
    metadata: Dict[str, int]
