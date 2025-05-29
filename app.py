from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from flask.cli import with_appcontext
import click
import datetime
import os
import pyotp
from dotenv import load_dotenv

# -------------------- Configuration --------------------
app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:property007@localhost:5432/authdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET'] = os.getenv("JWT_SECRET", "qadeokfxvjkoecvdmfwjjmhhgkld")

db = SQLAlchemy(app)
load_dotenv()

# -------------------- Models --------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    phone = db.Column(db.String(20), unique=True)
    phone_verified = db.Column(db.Boolean, default=False)

class Program(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(200))
    answer = db.Column(db.Text)

# JWT token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# -------------------- Routes --------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirm_password')

    # Validation
    if not all([full_name, phone, email, password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify({'error': 'Phone number already exists'}), 400

    hashed_pw = generate_password_hash(password)
    user = User(full_name=full_name, phone=phone, email=email, password=hashed_pw)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token}), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_user(current_user):
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'created_at': current_user.created_at.isoformat()
    })

@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    data = request.json
    phone = data.get('phone')
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400
    totp = pyotp.TOTP(pyotp.random_base32(), interval=300)
    otp = totp.now()
    session['otp_secret'] = totp.secret
    session['otp_phone'] = phone
    session['otp_expiry'] = (datetime.datetime.now() + datetime.timedelta(minutes=5)).isoformat()
    print(f"DEV: OTP for {phone} is {otp}")
    return jsonify({'message': 'OTP sent successfully'}), 200

@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    user_otp = data.get('otp')
    phone = session.get('otp_phone')
    secret = session.get('otp_secret')
    expiry = session.get('otp_expiry')
    if not all([phone, secret, expiry]):
        return jsonify({'error': 'OTP session expired'}), 400
    if datetime.datetime.fromisoformat(expiry) < datetime.datetime.now():
        return jsonify({'error': 'OTP expired'}), 400
    totp = pyotp.TOTP(secret, interval=300)
    if not totp.verify(user_otp):
        return jsonify({'error': 'Invalid OTP'}), 400
    user = User.query.filter_by(phone=phone).first()
    if user:
        user.phone_verified = True
        db.session.commit()
    session.pop('otp_secret', None)
    session.pop('otp_phone', None)
    session.pop('otp_expiry', None)
    return jsonify({'message': 'Phone verified successfully'}), 200

# -------------------- Content Routes --------------------
@app.route("/api/programs", methods=["GET"])
def get_programs():
    programs = Program.query.all()
    return jsonify([{"id": p.id, "title": p.title, "description": p.description} for p in programs])

@app.route("/api/news", methods=["GET"])
def get_news():
    news = News.query.order_by(News.created_at.desc()).all()
    return jsonify([{"id": n.id, "title": n.title, "content": n.content} for n in news])

@app.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.json
    message = ContactMessage(
        name=data.get("name"),
        email=data.get("email"),
        message=data.get("message")
    )
    db.session.add(message)
    db.session.commit()
    return jsonify({"message": "Contact form submitted."}), 200

@app.route("/api/faqs", methods=["GET"])
def get_faqs():
    faqs = FAQ.query.all()
    return jsonify([{"question": f.question, "answer": f.answer} for f in faqs])

# -------------------- Cli Command --------------------

@app.cli.command('init-db')
@with_appcontext
def init_db():
    db.create_all()
    click.echo('Initialized the database.')

# -------------------- Run Server --------------------
if __name__ == '__main__':
    app.run(debug=True)
    
