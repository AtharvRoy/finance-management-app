from datetime import date
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Date, Float, ForeignKey, Integer, String, UniqueConstraint, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


DATABASE_URL = "sqlite:///./finance.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("normalized_name", "group_id", name="uq_category_name_group"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    normalized_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("category_groups.id"), nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False)

    group: Mapped[Optional["CategoryGroup"]] = relationship(back_populates="categories")


class CategoryGroup(Base):
    __tablename__ = "category_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    categories: Mapped[list[Category]] = relationship(back_populates="group")


class MonthlyIncome(Base):
    __tablename__ = "monthly_incomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)


class PlannedAllocation(Base):
    __tablename__ = "planned_allocations"
    __table_args__ = (UniqueConstraint("month", "category_id", name="uq_planned_month_category"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[date] = mapped_column(Date, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)


class ActualSpend(Base):
    __tablename__ = "actual_spends"
    __table_args__ = (UniqueConstraint("month", "category_id", name="uq_actual_month_category"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[date] = mapped_column(Date, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)


class CategoryGroupCreate(BaseModel):
    name: str = Field(min_length=2)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2)
    group_id: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    group_id: Optional[int]
    is_default: bool


class MonthlyIncomeIn(BaseModel):
    month: date
    amount: float = Field(gt=0)


class BudgetEntryIn(BaseModel):
    month: date
    category_id: int
    amount: float = Field(ge=0)


class PersonNamesIn(BaseModel):
    person_a: str = Field(min_length=1)
    person_b: str = Field(min_length=1)

    @field_validator("person_a", "person_b")
    @classmethod
    def non_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value


class PersonNames(Base):
    __tablename__ = "person_names"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    person_a: Mapped[str] = mapped_column(String, nullable=False)
    person_b: Mapped[str] = mapped_column(String, nullable=False)


DEFAULT_CATEGORIES = [
    "Food and beverage",
    "Food, beverages, groceries",
    "Utility and bills",
    "Travel and transport",
    "Education",
    "Health",
    "Lifestyle",
    "Two-person section",
    "Agriculture",
    "Airlines",
    "Cabs and cab rentals",
    "Clothing and apparel",
    "Durables and home goods",
    "Fuel",
    "Government services",
    "Hotels, motels, resorts",
    "Online shopping",
    "Railways and roadways",
    "Repairs and services",
    "Tolls",
    "Trading",
    "Others",
]


app = FastAPI(title="Finance Management API")


def normalize_name(name: str) -> str:
    return " ".join(name.lower().replace("&", "and").replace(",", " ").split())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = {row[0] for row in db.query(Category.normalized_name).all()}
        for category in DEFAULT_CATEGORIES:
            normalized = normalize_name(category)
            if normalized not in existing:
                db.add(Category(name=category, normalized_name=normalized, is_default=True))
        db.commit()
    finally:
        db.close()


@app.post("/category-groups")
def create_category_group(payload: CategoryGroupCreate, db: Session = Depends(get_db)):
    group = CategoryGroup(name=payload.name.strip())
    db.add(group)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category group already exists")
    db.refresh(group)
    return group


@app.post("/categories", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    normalized = normalize_name(payload.name)

    duplicate = db.query(Category).filter(Category.normalized_name == normalized, Category.group_id == payload.group_id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Duplicate or conflicting category name in the same group")

    category = Category(name=payload.name.strip(), normalized_name=normalized, group_id=payload.group_id, is_default=False)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()


@app.post("/person-names")
def set_person_names(payload: PersonNamesIn, db: Session = Depends(get_db)):
    record = db.query(PersonNames).first()
    if record is None:
        record = PersonNames(person_a=payload.person_a, person_b=payload.person_b)
        db.add(record)
    else:
        record.person_a = payload.person_a
        record.person_b = payload.person_b
    db.commit()
    db.refresh(record)
    return {"person_a": record.person_a, "person_b": record.person_b}


@app.post("/monthly-income")
def upsert_monthly_income(payload: MonthlyIncomeIn, db: Session = Depends(get_db)):
    record = db.query(MonthlyIncome).filter_by(month=payload.month).first()
    if record is None:
        record = MonthlyIncome(month=payload.month, amount=payload.amount)
        db.add(record)
    else:
        record.amount = payload.amount
    db.commit()
    db.refresh(record)
    return record


@app.post("/planned-allocations")
def upsert_planned_allocation(payload: BudgetEntryIn, db: Session = Depends(get_db)):
    record = db.query(PlannedAllocation).filter_by(month=payload.month, category_id=payload.category_id).first()
    if record is None:
        record = PlannedAllocation(month=payload.month, category_id=payload.category_id, amount=payload.amount)
        db.add(record)
    else:
        record.amount = payload.amount
    db.commit()
    db.refresh(record)
    return record


@app.post("/actual-spends")
def upsert_actual_spend(payload: BudgetEntryIn, db: Session = Depends(get_db)):
    record = db.query(ActualSpend).filter_by(month=payload.month, category_id=payload.category_id).first()
    if record is None:
        record = ActualSpend(month=payload.month, category_id=payload.category_id, amount=payload.amount)
        db.add(record)
    else:
        record.amount = payload.amount
    db.commit()
    db.refresh(record)
    return record


@app.get("/monthly-summary/{month}")
def monthly_summary(month: date, db: Session = Depends(get_db)):
    income = db.query(MonthlyIncome).filter_by(month=month).first()
    planned = (
        db.query(func.coalesce(func.sum(PlannedAllocation.amount), 0.0))
        .filter(PlannedAllocation.month == month)
        .scalar()
    )
    actual = (
        db.query(func.coalesce(func.sum(ActualSpend.amount), 0.0))
        .filter(ActualSpend.month == month)
        .scalar()
    )

    by_category = (
        db.query(
            Category.id,
            Category.name,
            func.coalesce(func.sum(PlannedAllocation.amount), 0.0).label("planned"),
            func.coalesce(func.sum(ActualSpend.amount), 0.0).label("actual"),
        )
        .outerjoin(PlannedAllocation, (PlannedAllocation.category_id == Category.id) & (PlannedAllocation.month == month))
        .outerjoin(ActualSpend, (ActualSpend.category_id == Category.id) & (ActualSpend.month == month))
        .group_by(Category.id, Category.name)
        .all()
    )

    return {
        "month": month,
        "income": income.amount if income else 0.0,
        "total_planned": float(planned),
        "total_actual": float(actual),
        "savings": (income.amount if income else 0.0) - float(actual),
        "categories": [
            {
                "category_id": row.id,
                "category_name": row.name,
                "planned": float(row.planned),
                "actual": float(row.actual),
                "delta": float(row.planned) - float(row.actual),
            }
            for row in by_category
            if float(row.planned) > 0 or float(row.actual) > 0
        ],
    }
