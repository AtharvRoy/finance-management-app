from app.investments.models import InvestmentInput, ReturnRateInput, TenureInput
from app.investments.service import build_result, to_monthly_rate, to_months


def sample_payload() -> InvestmentInput:
    return InvestmentInput(
        sip_per_month=10000,
        return_rate=ReturnRateInput(value=12, period="annual"),
        tenure=TenureInput(value=10, unit="years"),
        tax_rate=10,
        inflation_rate=6,
        annual_step_up_percent=5,
    )


def test_month_conversions():
    assert to_months(2, "years") == 24
    assert round(to_monthly_rate(12, "annual"), 6) > 0


def test_build_result_shapes():
    result = build_result(sample_payload())
    assert result.base.nominal_future_value > 0
    assert result.base.posttax_corpus <= result.base.pretax_corpus
    assert len(result.sensitivity) == 24


def test_step_up_increases_corpus():
    payload = sample_payload()
    no_step = payload.model_copy(update={"annual_step_up_percent": 0})

    with_step = build_result(payload)
    without_step = build_result(no_step)

    assert with_step.base.nominal_future_value > without_step.base.nominal_future_value
