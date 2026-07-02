from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# ---------- DB ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="Kayum Fabric ERP")
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Models ----------
class Firm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    gst_number: str = ""
    address: str = ""
    state: str = ""
    state_code: str = ""
    phone: str = ""
    created_at: str = Field(default_factory=now_iso)


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str  # admin | operator
    firm_id: Optional[str] = None
    firm_name: Optional[str] = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    firm_id: str
    role: str = "operator"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FabricItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firm_id: str
    mill_name: str
    fabric_name: str
    shade_no: str
    fabric_count: str
    meters: float
    low_stock_threshold: float = 50.0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class FabricCreate(BaseModel):
    mill_name: str
    fabric_name: str
    shade_no: str
    fabric_count: str
    meters: float
    low_stock_threshold: float = 50.0


class FabricUpdate(BaseModel):
    mill_name: Optional[str] = None
    fabric_name: Optional[str] = None
    shade_no: Optional[str] = None
    fabric_count: Optional[str] = None
    meters: Optional[float] = None
    low_stock_threshold: Optional[float] = None


class BillLineItem(BaseModel):
    fabric_id: Optional[str] = None
    fabric_name: str
    shade_no: str = ""
    fabric_count: str = ""
    hsn_code: str = ""
    pieces: int = 1
    meters: float
    rate: float
    amount: float = 0.0  # meters * rate


class BillCreate(BaseModel):
    customer_name: str
    customer_state: str = ""
    customer_state_code: str = ""
    customer_phone: str = ""
    customer_gst: str = ""
    items: List[BillLineItem]
    gst_rate: float = 5.0
    is_interstate: bool = False
    notes: str = ""


class Bill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firm_id: str
    bill_no: str
    customer_name: str
    customer_state: str = ""
    customer_state_code: str = ""
    customer_phone: str = ""
    customer_gst: str = ""
    items: List[BillLineItem]
    subtotal: float
    gst_rate: float
    is_interstate: bool
    cgst: float
    sgst: float
    igst: float
    total: float
    notes: str = ""
    created_at: str = Field(default_factory=now_iso)
    created_by: str = ""


# ---------- Auth Routes ----------
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    firm = await db.firms.find_one({"id": req.firm_id}, {"_id": 0})
    if not firm:
        raise HTTPException(status_code=400, detail="Firm not found")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "role": req.role,
        "firm_id": req.firm_id,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": req.name,
            "role": req.role,
            "firm_id": req.firm_id,
            "firm_name": firm.get("name"),
        },
    }


@api_router.post("/auth/login")
async def login(req: LoginRequest):
    email = req.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    firm = None
    if user.get("firm_id"):
        firm = await db.firms.find_one({"id": user["firm_id"]}, {"_id": 0})
    token = create_access_token(user["id"], email)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "firm_id": user.get("firm_id"),
            "firm_name": firm.get("name") if firm else None,
        },
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    firm = None
    if user.get("firm_id"):
        firm = await db.firms.find_one({"id": user["firm_id"]}, {"_id": 0})
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "firm_id": user.get("firm_id"),
        "firm_name": firm.get("name") if firm else None,
    }


# ---------- Firm Routes ----------
@api_router.get("/firms")
async def list_firms():
    firms = await db.firms.find({}, {"_id": 0}).to_list(100)
    return firms


@api_router.put("/firms/{firm_id}")
async def update_firm(firm_id: str, payload: dict, user: dict = Depends(get_current_user)):
    if user["role"] != "admin" and user.get("firm_id") != firm_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    allowed = {"name", "gst_number", "address", "state", "state_code", "phone"}
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.firms.update_one({"id": firm_id}, {"$set": update})
    return await db.firms.find_one({"id": firm_id}, {"_id": 0})


# ---------- Inventory ----------
def user_firm_or_403(user: dict, firm_id: Optional[str] = None) -> str:
    if user["role"] == "admin" and firm_id:
        return firm_id
    if not user.get("firm_id"):
        raise HTTPException(status_code=403, detail="User has no firm assigned")
    return user["firm_id"]


@api_router.get("/fabrics")
async def list_fabrics(firm_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user, firm_id)
    items = await db.fabrics.find({"firm_id": fid}, {"_id": 0}).sort("fabric_name", 1).to_list(1000)
    return items


@api_router.post("/fabrics")
async def create_fabric(payload: FabricCreate, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    item = FabricItem(firm_id=fid, **payload.model_dump())
    await db.fabrics.insert_one(item.model_dump())
    doc = await db.fabrics.find_one({"id": item.id}, {"_id": 0})
    return doc


@api_router.put("/fabrics/{fabric_id}")
async def update_fabric(fabric_id: str, payload: FabricUpdate, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    existing = await db.fabrics.find_one({"id": fabric_id, "firm_id": fid})
    if not existing:
        raise HTTPException(status_code=404, detail="Fabric not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.fabrics.update_one({"id": fabric_id}, {"$set": update})
    return await db.fabrics.find_one({"id": fabric_id}, {"_id": 0})


@api_router.delete("/fabrics/{fabric_id}")
async def delete_fabric(fabric_id: str, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    res = await db.fabrics.delete_one({"id": fabric_id, "firm_id": fid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fabric not found")
    return {"ok": True}


# ---------- Billing ----------
async def next_bill_no(firm_id: str) -> str:
    firm = await db.firms.find_one({"id": firm_id})
    prefix = (firm.get("name", "BILL")[:3] or "BIL").upper().replace(" ", "")
    year = datetime.now(timezone.utc).strftime("%y")
    counter = await db.bill_counters.find_one_and_update(
        {"firm_id": firm_id, "year": year},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = counter["seq"] if counter else 1
    return f"{prefix}/{year}/{seq:04d}"


@api_router.post("/bills")
async def create_bill(payload: BillCreate, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one item required")

    # compute amounts & validate stock
    items_out: List[BillLineItem] = []
    subtotal = 0.0
    for it in payload.items:
        amount = round(it.meters * it.rate, 2)
        items_out.append(BillLineItem(**{**it.model_dump(), "amount": amount}))
        subtotal += amount
        if it.fabric_id:
            fab = await db.fabrics.find_one({"id": it.fabric_id, "firm_id": fid})
            if not fab:
                raise HTTPException(status_code=400, detail=f"Fabric not found: {it.fabric_name}")
            if fab["meters"] < it.meters:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {it.fabric_name}: available {fab['meters']}m, requested {it.meters}m",
                )

    subtotal = round(subtotal, 2)
    gst_total = round(subtotal * payload.gst_rate / 100, 2)
    if payload.is_interstate:
        igst = gst_total
        cgst = 0.0
        sgst = 0.0
    else:
        igst = 0.0
        cgst = round(gst_total / 2, 2)
        sgst = round(gst_total - cgst, 2)
    total = round(subtotal + gst_total, 2)

    bill_no = await next_bill_no(fid)
    bill = Bill(
        firm_id=fid,
        bill_no=bill_no,
        customer_name=payload.customer_name,
        customer_state=payload.customer_state,
        customer_state_code=payload.customer_state_code,
        customer_phone=payload.customer_phone,
        customer_gst=payload.customer_gst,
        items=items_out,
        subtotal=subtotal,
        gst_rate=payload.gst_rate,
        is_interstate=payload.is_interstate,
        cgst=cgst,
        sgst=sgst,
        igst=igst,
        total=total,
        notes=payload.notes,
        created_by=user["id"],
    )

    # deduct stock
    for it in items_out:
        if it.fabric_id:
            await db.fabrics.update_one(
                {"id": it.fabric_id, "firm_id": fid},
                {"$inc": {"meters": -it.meters}, "$set": {"updated_at": now_iso()}},
            )

    doc = bill.model_dump()
    await db.bills.insert_one(doc)
    return await db.bills.find_one({"id": bill.id}, {"_id": 0})


@api_router.get("/bills")
async def list_bills(firm_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user, firm_id)
    items = await db.bills.find({"firm_id": fid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.get("/bills/{bill_id}")
async def get_bill(bill_id: str, user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    bill = await db.bills.find_one({"id": bill_id, "firm_id": fid}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    firm = await db.firms.find_one({"id": fid}, {"_id": 0})
    return {"bill": bill, "firm": firm}


# ---------- Dashboard ----------
@api_router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    fid = user_firm_or_403(user)
    # Stock
    fabrics = await db.fabrics.find({"firm_id": fid}, {"_id": 0}).to_list(2000)
    total_meters = sum(f["meters"] for f in fabrics)
    low_stock = [f for f in fabrics if f["meters"] <= f.get("low_stock_threshold", 50)]

    # Sales this month
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
    bills_month = await db.bills.find(
        {"firm_id": fid, "created_at": {"$gte": month_start}}, {"_id": 0}
    ).to_list(2000)
    monthly_sales = sum(b["total"] for b in bills_month)

    # All-time
    all_bills = await db.bills.find({"firm_id": fid}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    total_sales = sum(b["total"] for b in all_bills)
    recent_bills = all_bills[:5]

    firm = await db.firms.find_one({"id": fid}, {"_id": 0})

    return {
        "firm": firm,
        "metrics": {
            "monthly_sales": round(monthly_sales, 2),
            "total_sales": round(total_sales, 2),
            "total_meters": round(total_meters, 2),
            "fabric_count": len(fabrics),
            "low_stock_count": len(low_stock),
            "bills_this_month": len(bills_month),
        },
        "low_stock": low_stock[:10],
        "recent_bills": recent_bills,
    }


# ---------- Seed ----------
SEED_FIRMS = [
    {"name": "M/s. ABDUL KAYUM MOHAMMED SALAR", "gst_number": "", "phone": ""},
    {"name": "M/s. H.A KAYUM & COMPANY", "gst_number": "", "phone": ""},
    {"name": "M/s. HAJI ABDUL KAYUM AND SONS", "gst_number": "", "phone": ""},
]


async def seed():
    # Firms
    firm_ids = []
    for f in SEED_FIRMS:
        existing = await db.firms.find_one({"name": f["name"]})
        if existing:
            firm_ids.append(existing["id"])
        else:
            firm = Firm(**f)
            await db.firms.insert_one(firm.model_dump())
            firm_ids.append(firm.id)

    # Admin (no firm assignment - admin)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kayum.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "firm_id": firm_ids[0],  # default to firm 1 view
            "created_at": now_iso(),
        })

    # Operator users for each firm
    operators = [
        ("salar@kayum.com", "salar123", "Salar Operator", firm_ids[0]),
        ("hakayum@kayum.com", "hakayum123", "H.A Kayum Operator", firm_ids[1]),
        ("sons@kayum.com", "sons123", "Sons Operator", firm_ids[2]),
    ]
    for email, pwd, name, fid in operators:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": hash_password(pwd),
                "name": name,
                "role": "operator",
                "firm_id": fid,
                "created_at": now_iso(),
            })


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.firms.create_index("name", unique=True)
    await db.fabrics.create_index([("firm_id", 1), ("fabric_name", 1)])
    await db.bills.create_index([("firm_id", 1), ("created_at", -1)])
    await db.bill_counters.create_index([("firm_id", 1), ("year", 1)], unique=True)
    await seed()
    logger.info("Startup complete - seeded firms & users")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


@api_router.get("/")
async def root():
    return {"message": "Kayum Fabric ERP API", "version": "1.0"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
