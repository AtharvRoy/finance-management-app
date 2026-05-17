from fastapi import APIRouter

from .models import InvestmentInput, InvestmentResult
from .service import build_result

router = APIRouter(prefix="/investments", tags=["investments"])


@router.post("/calculate", response_model=InvestmentResult)
def calculate_investment(payload: InvestmentInput) -> InvestmentResult:
    return build_result(payload)
