from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
import pyotp
from dotenv import load_dotenv

# -------------------- Configuration --------------------
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    "DATABASE_URL", "postgresql://postgres:stenaman@localhost:5432/authdb"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET'] = os.getenv("JWT_SECRET", "qadeokfxvjkoecvdmfwjjmhhgkld")

db = SQLAlchemy(app)
load_dotenv()

# In-memory OTP store for development (use Redis/DB in production)
otp_store = {}

# -------------------- Models --------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    phone = db.Column(db.String(20), unique=True)
    phone_verified = db.Column(db.Boolean, default=False)

# -------------------- Auth Routes --------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400
    hashed_pw = generate_password_hash(data["password"])
    user = User(email=data["email"], password_hash=hashed_pw, name=data.get("name"), phone=data.get("phone"))
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered"}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user and check_password_hash(user.password_hash, data["password"]):
        token = jwt.encode({
            "user_id": user.id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config["JWT_SECRET"], algorithm="HS256")
        return jsonify({"token": token})
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/api/auth/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"message": "Missing token"}), 401
    token = auth_header.split(" ")[1]
    try:
        data = jwt.decode(token, app.config["JWT_SECRET"], algorithms=["HS256"])
        user = User.query.get(data["user_id"])
        return jsonify({"id": user.id, "email": user.email, "name": user.name})
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# -------------------- OTP Routes --------------------
@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    phone = data.get('phone')
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400

    # Generate OTP + secret
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=300)  # valid for 5 mins
    otp = totp.now()

    # Store in memory (use Redis/db in prod)
    otp_store[phone] = {
        "secret": secret,
        "expires": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }

    print(f"🔐 DEV OTP for {phone}: {otp}")  # Show in terminal for dev testing

    return jsonify({"message": "OTP generated for phone (check terminal)"}), 200

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    phone = data.get('phone')
    user_otp = data.get('otp')

    if phone not in otp_store:
        return jsonify({"error": "No OTP requested for this phone"}), 400

    otp_data = otp_store[phone]
    if datetime.datetime.utcnow() > otp_data["expires"]:
        del otp_store[phone]
        return jsonify({"error": "OTP expired"}), 400

    totp = pyotp.TOTP(otp_data["secret"], interval=300)
    if not totp.verify(user_otp):
        return jsonify({"error": "Invalid OTP"}), 400

    # Mark user phone as verified
    user = User.query.filter_by(phone=phone).first()
    if user:
        user.phone_verified = True
        db.session.commit()

    del otp_store[phone]  # Clean up

    return jsonify({"message": "Phone verified successfully"}), 200

# -------------------- DB Init --------------------
@app.cli.command("init-db")
def init_db():
    db.create_all()
    print("✅ Database tables created.")

# -------------------- Run Server --------------------
if __name__ == "__main__":
    app.run(debug=True)
