from flask import Flask, request, jsonify, Response, make_response, send_file, Blueprint, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import click
from flask.cli import with_appcontext
from datetime import datetime, timedelta
from sqlalchemy import func
from dotenv import load_dotenv
import os
from flask_jwt_extended import (
    JWTManager, 
    jwt_required, 
    create_access_token, 
    get_jwt_identity,
)
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Mail, Message
import random
import requests
import logging
import string
import time
from iStokvel.utils.email_utils import send_verification_email
from flask_migrate import Migrate
from twilio.rest import Client
import phonenumbers
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import event
from sqlalchemy.engine import Engine
from jwt import ExpiredSignatureError, InvalidTokenError
from openai import OpenAI
import uuid
import openai
import jwt as pyjwt
from sqlalchemy import select
from flask_socketio import SocketIO, emit

# Load environment variables from .env file
load_dotenv()

# Config
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Ayanda%4023@172.20.64.1:5432/stokvel_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT')) if os.getenv('MAIL_PORT') else None
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['SENDGRID_API_KEY'] = os.getenv('SENDGRID_API_KEY')
app.config['SENDGRID_FROM_EMAIL'] = os.getenv('SENDGRID_FROM_EMAIL')

# Add JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token expires in 1 hour
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Add to your app configuration
app.config['DAILY_DEPOSIT_LIMIT'] = 10000.00  # R10,000 daily limit
app.config['DAILY_TRANSFER_LIMIT'] = 5000.00   # R5,000 daily limit
app.config['MIN_TRANSACTION_AMOUNT'] = 1.00    # R1 minimum
app.config['MAX_TRANSACTION_AMOUNT'] = 50000.00 # R50,000 maximum

# Add these constants at the top of your file (around line 50)
WITHDRAWAL_FEE_PERCENTAGE = 0.02  # 2% fee
MIN_WITHDRAWAL_AMOUNT = 10.00     # R10 minimum
MAX_WITHDRAWAL_AMOUNT = 50000.00  # R50,000 maximum

# -------------------- INITIALIZE EXTENSIONS --------------------
db = SQLAlchemy(app)
mail = Mail(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------- CORS SETUP --------------------
CORS(app, origins="http://localhost:5173", supports_credentials=True)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
CORS(app, resources={r"/admin/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# -------------------- UTILITY FUNCTIONS --------------------
def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_sms(phone_number, otp_code):
    """Send verification SMS with OTP"""
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_NUMBER')
    if not all([account_sid, auth_token, from_number]):
        print("Twilio credentials are not set in environment variables.")
        return False, "Twilio credentials missing"
    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"Your iStokvel verification code is: {otp_code}",
            from_=from_number,
            to=phone_number
        )
        print(f"Sent SMS to {phone_number}: {message.sid}")
        return True, "SMS sent"
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False, str(e)

def generate_group_code(length=6):
    """Generate a random alphanumeric group code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def normalize_phone(phone):
    # Remove spaces, dashes, etc.
    phone = phone.replace(' ', '').replace('-', '')
    # Convert +27... to 0... for lookup if your DB uses 0...
    if phone.startswith('+27'):
        phone = '0' + phone[3:]
    return phone

def generate_account_number():
    """Generate a unique 10-digit account number"""
    while True:
        # Generate exactly 10 digits (1000000000 to 9999999999)
        account_num = str(random.randint(1000000000, 9999999999))
        # Check if it's unique
        if not User.query.filter_by(account_number=account_num).first():
            return account_num

# -------------------- MODELS --------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='member')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_picture = db.Column(db.String(200))
    gender = db.Column(db.String(10))
    employment_status = db.Column(db.String(100))
    is_verified = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_method = db.Column(db.String(10), default='email')  # 'email' or 'sms'
    otps = db.relationship('OTP', backref='user', lazy=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_code_expiry = db.Column(db.DateTime, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade="all, delete-orphan")
    _table_args_ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )
    referral_code = db.Column(db.String(8), unique=True, nullable=True, default=lambda: uuid.uuid4().hex[:8].upper())
    points = db.Column(db.Integer, default=0)
    valid_referrals = db.Column(db.Integer, default=0)
    account_number = db.Column(db.String(20), unique=True, nullable=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def generate_verification(self):
        """Generate and save new verification code"""
        from iStokvel.utils.email_utils import generate_verification_code
        self.verification_code = generate_verification_code()
        self.verification_code_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        return self.verification_code

class StokvelGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    tier = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=True)  # or nullable=True
    contribution_amount = db.Column(db.Float, nullable=False)  # <-- ADD THIS LINE
    rules = db.Column(db.String(255))
    benefits = db.Column(db.ARRAY(db.String))
    description = db.Column(db.Text)
    frequency = db.Column(db.String(50), nullable=False)
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    group_code = db.Column(db.String(10), unique=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    members = db.relationship('StokvelMember', backref='group', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contribution_amount': float(self.contribution_amount or 0),
            'frequency': self.frequency,
            'max_members': self.max_members,
            'member_count': len(self.members),
            'group_code': self.group_code,
            'admin_id': self.admin_id,
            'created_at': self.created_at.isoformat()
        }

class StokvelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
    role = db.Column(db.String(20), default='member')  # member, admin
    user = db.relationship('User', backref='memberships')

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, rejected
    member = db.relationship('StokvelMember', backref='contributions')

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='active')  # active, closed
    group = db.relationship('StokvelGroup', backref='polls')

class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    votes = db.Column(db.Integer, default=0)
    poll = db.relationship('Poll', backref='options')

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='scheduled')  # scheduled, completed, cancelled
    group = db.relationship('StokvelGroup', backref='meetings')

class WithdrawalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    approvals_needed = db.Column(db.Integer, default=2)
    approvals_received = db.Column(db.Integer, default=0)
    member = db.relationship('StokvelMember', backref='withdrawal_requests')

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='wallet')

class NotificationSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    email_announcements = db.Column(db.Boolean, default=True)
    email_stokvel_updates = db.Column(db.Boolean, default=True)
    email_marketplace_offers = db.Column(db.Boolean, default=False)
    push_announcements = db.Column(db.Boolean, default=True)
    push_stokvel_updates = db.Column(db.Boolean, default=True)
    push_marketplace_offers = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='notification_settings')

class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    language = db.Column(db.String(10), default='en')
    currency = db.Column(db.String(3), default='ZAR')
    theme = db.Column(db.String(10), default='light')
    data_for_personalization = db.Column(db.Boolean, default=True)
    data_for_analytics = db.Column(db.Boolean, default=True)
    data_for_third_parties = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='preferences')

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='general')  # kyc_required, approved, rejected, etc.
    data = db.Column(db.JSON)  # Additional data like group_id, join_request_id
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_used = db.Column(db.Boolean, default=False)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at and not self.is_used

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)


#---------------------------------------------------------------------------new models-----------------------------------

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(200))
    is_stokvel_related = db.Column(db.Boolean, default=False)
    stokvel_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user', 'assistant'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

#------------------------------------------------------------------------------------------

class KYCVerification(db.Model):
    __tablename__ = 'kyc_verification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    full_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    id_number = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    employment_status = db.Column(db.String(50))
    employer_name = db.Column(db.String(100))
    street_address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    postal_code = db.Column(db.String(10))
    country = db.Column(db.String(100))
    monthly_income = db.Column(db.Float)
    income_source = db.Column(db.String(50))
    employment_type = db.Column(db.String(50))
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(20))
    account_type = db.Column(db.String(20))
    branch_code = db.Column(db.String(10))
    id_document_path = db.Column(db.String(200))
    proof_of_address_path = db.Column(db.String(200))
    proof_of_income_path = db.Column(db.String(200))
    bank_statement_path = db.Column(db.String(200))
    verification_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cardholder = db.Column(db.String(100), nullable=False)
    card_number_last4 = db.Column(db.String(4), nullable=False)  # Only store last 4 digits!
    expiry = db.Column(db.String(5), nullable=False)  # MM/YY
    is_primary = db.Column(db.Boolean, default=False)
    card_type = db.Column(db.String(20), default='visa')  # visa, mastercard, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('cards', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'cardholder': self.cardholder,
            'card_number': f"**** **** **** {self.card_number_last4}",
            'expiry': self.expiry,
            'is_primary': self.is_primary,
            'card_type': self.card_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def detect_card_type(card_number):
        """Detect card type based on card number"""
        card_number = card_number.replace(' ', '').replace('-', '')
        
        if card_number.startswith('4'):
            return 'visa'
        elif card_number.startswith('5'):
            return 'mastercard'
        elif card_number.startswith('3'):
            return 'amex'
        else:
            return 'unknown'

# -------------------- DECORATORS --------------------
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # SECURITY FIX: Check if user is verified
        if not current_user.is_verified:
            return jsonify({'error': 'Please verify your email address to access this feature'}), 403
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('Authorization')
            print("DEBUG: Authorization header:", token)
            if not token:
                print("DEBUG: No token provided")
                return jsonify({'error': 'No token provided'}), 401

            try:
                token = token.split(' ')[1]  # Remove 'Bearer ' prefix
                print("DEBUG: Token after split:", token)
            except Exception as e:
                print("DEBUG: Error splitting token:", repr(e))
                return jsonify({'error': 'Malformed token'}), 401

            try:
                payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                print("DEBUG: Decoded JWT payload:", payload)
            except ExpiredSignatureError:
                print("DEBUG: Token has expired")
                return jsonify({'error': 'Token has expired'}), 401
            except InvalidTokenError:
                print("DEBUG: Invalid token")
                return jsonify({'error': 'Invalid token'}), 401
            except Exception as e:
                print("DEBUG: Error decoding token:", repr(e))
                return jsonify({'error': 'Token decode error'}), 401

            user_id = payload.get('user_id') or payload.get('sub')
            print("DEBUG: User ID from payload:", user_id)
            user = User.query.get(user_id)
            print("DEBUG: User from DB:", user)

            if not user:
                print("DEBUG: User not found in DB")
                return jsonify({'error': 'User not found'}), 401

            print(f"DEBUG: User role: {user.role}, is_verified: {user.is_verified}")

            if not user.is_verified:
                print("DEBUG: User not verified")
                return jsonify({'error': 'Please verify your email address to access this feature'}), 403

            if user.role != 'admin':
                print("DEBUG: User is not admin")
                return jsonify({'error': 'Admin access required'}), 403

            print("DEBUG: Admin access granted")
            return f(*args, **kwargs)
        except Exception as e:
            print("DEBUG: Unhandled exception in admin_required:", repr(e))
            return jsonify({'error': 'Unknown error'}), 401
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                token = request.headers.get('Authorization')
                print("DEBUG: Authorization header:", token)
                if not token:
                    print("DEBUG: No token provided")
                    return jsonify({'error': 'No token provided'}), 401

                try:
                    token = token.split(' ')[1]
                    print("DEBUG: Token after split:", token)
                except Exception as e:
                    print("DEBUG: Error splitting token:", repr(e))
                    return jsonify({'error': 'Malformed token'}), 401

                try:
                    payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                    print("DEBUG: Decoded JWT payload:", payload)
                except ExpiredSignatureError:
                    print("DEBUG: Token has expired")
                    return jsonify({'error': 'Token has expired'}), 401
                except InvalidTokenError:
                    print("DEBUG: Invalid token")
                    return jsonify({'error': 'Invalid token'}), 401
                except Exception as e:
                    print("DEBUG: Error decoding token:", repr(e))
                    return jsonify({'error': 'Token decode error'}), 401

                user_id = payload.get('user_id') or payload.get('sub')
                print("DEBUG: User ID from payload:", user_id)
                user = User.query.get(user_id)
                print("DEBUG: User from DB:", user)

                if not user:
                    print("DEBUG: User not found in DB")
                    return jsonify({'error': 'User not found'}), 401

                print(f"DEBUG: User role: {user.role}, is_verified: {user.is_verified}")

                if not user.is_verified:
                    print("DEBUG: User not verified")
                    return jsonify({'error': 'Please verify your email address to access this feature'}), 403

                if user.role not in allowed_roles:
                    print("DEBUG: User does not have required role")
                    return jsonify({'error': 'Insufficient permissions'}), 403

                print("DEBUG: Role access granted")
                return f(*args, **kwargs)
            except Exception as e:
                print("DEBUG: Unhandled exception in role_required:", repr(e))
                return jsonify({'error': 'Unknown error'}), 401
        return decorated_function
    return decorator

# -------------------- ROUTES --------------------


@app.route('/api/test', methods=['GET'])
def test():
    logger.debug('Test route accessed')
    return jsonify({"message": "Server is working!"}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        phone = data.get('phone')

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user with account number
        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role='member',
            account_number=generate_account_number()  # <-- ADD THIS
        )
        user.set_password(password)

        db.session.add(user)
        db.session.flush()  # Get the user ID

        # Create wallet for the new user
        wallet = Wallet(user_id=user.id, balance=0.00)
        db.session.add(wallet)

        # --- Refer and Earn: Referral logic ---
        referral_code = data.get('referral_code') or request.args.get('ref')
        if referral_code:
            referrer = get_user_by_referral_code(referral_code)
            if referrer:
                referral = Referral(referrer_id=referrer.id, referee_id=user.id, status='pending')
                db.session.add(referral)

        db.session.commit()

        # Generate and send verification code with better error handling
        try:
            verification_code = user.generate_verification()
            print(f"Generated verification code: {verification_code} for user: {email}")
            
            success, message = send_verification_email(user.email, verification_code)
            print(f"Email sending result - Success: {success}, Message: {message}")
            
            if not success:
                print(f"Warning: Failed to send verification email: {message}")
                # Still return success but with a warning
                return jsonify({
                    'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                    'email': user.email,
                    'user_id': user.id,
                    'account_number': user.account_number,  # <-- ADD THIS
                    'email_sent': False
                }), 201
            else:
                return jsonify({
                    'message': 'Registration successful. Please check your email for verification code.',
                    'email': user.email,
                    'user_id': user.id,
                    'account_number': user.account_number,  # <-- ADD THIS
                    'email_sent': True
                }), 201
                
        except Exception as email_e:
            print(f"Warning: Exception during verification email sending: {str(email_e)}")
            import traceback
            traceback.print_exc()
            # Still return success but with a warning
            return jsonify({
                'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                'email': user.email,
                'user_id': user.id,
                'account_number': user.account_number,  # <-- ADD THIS
                'email_sent': False
            }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred during registration'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # SECURITY FIX: Check if user is verified before allowing login
    if not user.is_verified:
        return jsonify({'error': 'Please verify your email address before logging in'}), 401

    if user.two_factor_enabled:
        otp_code = generate_otp()
        expiry = datetime.utcnow() + timedelta(minutes=10)
        otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
        db.session.add(otp)
        db.session.commit()
        if user.two_factor_method == 'sms':
            send_verification_sms(user.phone, otp_code)
        else:
            send_verification_email(user.email, otp_code)
        return jsonify({'message': '2FA code sent', 'user_id': user.id, 'two_factor_required': True}), 200

    access_token = create_access_token(identity=str(user.id))

    user_agent = request.headers.get('User-Agent', 'Unknown')
    ip_address = request.remote_addr or 'Unknown'
    session = UserSession(
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    db.session.add(session)
    db.session.commit()

    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "gender": user.gender,
        "employment_status": user.employment_status,
        "is_verified": user.is_verified,
        "two_factor_enabled": user.two_factor_enabled
    }
    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "user": user_data
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'profilePicture': current_user.profile_picture
    })

@app.route('/api/admin/groups', methods=['GET'])
@token_required
def get_admin_groups(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    groups = StokvelGroup.query.all()
    groups_data = []
    for group in groups:
        groups_data.append(StokvelGroup.to_dict(group))
    return jsonify(groups_data), 200

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user):
    # Your implementation here
    pass

@app.route('/api/admin/groups', methods=['POST'])
@token_required
def create_stokvel_group(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Generate a unique group code if not provided
        group_code = data.get('group_code')
        if not group_code:
            # Ensure uniqueness
            while True:
                group_code = generate_group_code()
                if not StokvelGroup.query.filter_by(group_code=group_code).first():
                    break

        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            category=data['category'],  # <-- ADD THIS LINE
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            rules=data['rules'],
            tier=data['tier'],
            group_code=group_code,  # <-- Set the generated code
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        db.session.commit()
        return jsonify({
            'id': new_group.id,
            'name': new_group.name,
            'description': new_group.description,
            'contribution_amount': new_group.contribution_amount,
            'frequency': new_group.frequency,
            'max_members': new_group.max_members,
            'tier': new_group.tier,
            'group_code': new_group.group_code,  # <-- Return the code
            'member_count': 0,
            'created_at': new_group.created_at.isoformat()
        }), 201

    except Exception as e:
        print(f"Error creating stokvel group: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create stokvel group'}), 500

@app.cli.command('init-db')
@with_appcontext
def init_db():
    db.create_all()
    click.echo('Initialized the database.')

@app.cli.command('create-admin')
@with_appcontext
def create_admin():
    """Creates a new admin user."""
    email = click.prompt('Enter admin email', type=str)
    password = click.prompt('Enter admin password', type=str, hide_input=True, confirmation_prompt=True)
    full_name = click.prompt('Enter admin full name', type=str, default='Admin User')
    phone = click.prompt('Enter admin phone number', type=str)

    if User.query.filter_by(email=email).first():
        click.echo(click.style(f"Error: Email '{email}' already exists.", fg='red'))
        return
        
    if User.query.filter_by(phone=phone).first():
        click.echo(click.style(f"Error: Phone number '{phone}' already exists.", fg='red'))
        return

    admin = User(
        email=email,
        full_name=full_name,
        phone=phone,
        role='admin',
        is_verified=True # Admins should be verified by default
    )
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    click.echo(click.style(f"Admin user '{full_name}' created successfully with email '{email}'.", fg='green'))

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    db.drop_all()
    db.create_all()
    click.echo(click.style('Database has been reset.', fg='green'))

@app.cli.command('reset-users')
@with_appcontext
def reset_users():
    """Delete all users and their related data from the database"""
    try:
        # Delete in order of dependencies (child tables first)
        
        # Delete messages (depends on conversations)
        Message.query.delete()
        
        # Delete conversations (depends on users and stokvel_groups)
        Conversation.query.delete()
        
        # Delete withdrawal requests (depends on stokvel_members)
        WithdrawalRequest.query.delete()
        
        # Delete contributions (depends on stokvel_members)
        Contribution.query.delete()
        
        # Delete stokvel members (depends on users and stokvel_groups)
        StokvelMember.query.delete()
        
        # Delete polls and poll options (depends on stokvel_groups)
        PollOption.query.delete()
        Poll.query.delete()
        
        # Delete meetings (depends on stokvel_groups)
        Meeting.query.delete()
        
        # Delete stokvel groups (depends on users via admin_id)
        StokvelGroup.query.delete()
        
        # Delete KYC verifications (depends on users)
        KYCVerification.query.delete()
        
        # Delete user sessions (depends on users)
        UserSession.query.delete()
        
        # Delete OTPs (depends on users)
        OTP.query.delete()
        
        # Delete wallets (depends on users)
        Wallet.query.delete()
        
        # Delete notification settings (depends on users)
        NotificationSettings.query.delete()
        
        # Delete user preferences (depends on users)
        UserPreferences.query.delete()
        
        # Finally delete all users
        User.query.delete()
        
        db.session.commit()
        print('All users and related data deleted successfully')
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')

@app.route('/api/polls', methods=['GET'])
@token_required
def get_polls(current_user):
    polls = Poll.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': poll.id,
        'title': poll.title,
        'description': poll.description,
        'end_date': poll.end_date.isoformat() if poll.end_date else None,
        'status': poll.status,
        'options': [{
            'id': option.id,
            'text': option.text,
            'votes': option.votes
        } for option in poll.options]
    } for poll in polls])

@app.route('/api/polls', methods=['POST'])
@token_required
def create_poll(current_user):
    data = request.get_json()
    poll = Poll(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None
    )
    db.session.add(poll)
    db.session.commit()
    
    for option_text in data['options']:
        option = PollOption(poll_id=poll.id, text=option_text)
        db.session.add(option)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Poll created successfully', 'poll_id': poll.id})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500

@app.route('/api/meetings', methods=['GET'])
@token_required
def get_meetings(current_user):
    meetings = Meeting.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': meeting.id,
        'title': meeting.title,
        'description': meeting.description,
        'date': meeting.date.isoformat(),
        'location': meeting.location,
        'status': meeting.status
    } for meeting in meetings])

@app.route('/api/meetings', methods=['POST'])
@token_required
def create_meeting(current_user):
    data = request.get_json()
    meeting = Meeting(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        date=datetime.fromisoformat(data['date']),
        location=data.get('location')
    )
    db.session.add(meeting)
    db.session.commit()
    return jsonify({'message': 'Meeting created successfully', 'meeting_id': meeting.id})

@app.route('/api/withdrawals', methods=['GET'])
@token_required
def get_withdrawals(current_user):
    withdrawals = WithdrawalRequest.query.filter_by(member_id=current_user.id).all()
    return jsonify([{
        'id': w.id,
        'amount': w.amount,
        'reason': w.reason,
        'created_at': w.created_at.isoformat(),
        'status': w.status,
        'approvals_needed': w.approvals_needed,
        'approvals_received': w.approvals_received
    } for w in withdrawals])

@app.route('/api/withdrawals', methods=['POST'])
@token_required
def create_withdrawal(current_user):
    data = request.get_json()
    withdrawal = WithdrawalRequest(
        member_id=current_user.id,
        amount=data['amount'],
        reason=data.get('reason'),
        approvals_needed=data.get('approvals_needed', 2)
    )
    db.session.add(withdrawal)
    db.session.commit()
    return jsonify({'message': 'Withdrawal request created successfully', 'withdrawal_id': withdrawal.id})

@app.route('/api/groups/available', methods=['GET'])
def get_available_groups():
    groups = StokvelGroup.query.all()
    return jsonify([{
        'id': g.id,
        'name': g.name,
        'category': g.category,  # <-- ADD THIS LINE
        'tier': g.tier,
        'amount': g.amount,
        'rules': g.rules,
        'benefits': g.benefits,
        'description': g.description,
        'frequency': g.frequency,
        'max_members': g.max_members,
        # ... any other fields you want to expose ...
    } for g in groups])

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Get user's role in each group
        memberships = StokvelMember.query.filter_by(user_id=current_user.id).all()
        is_group_admin = any(m.role == 'admin' for m in memberships)
        
        # Get user's active groups
        active_groups = [m.group for m in memberships if m.status == 'active']
        
        # Get total contributions
        total_contributions = db.session.query(func.sum(Contribution.amount)) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .scalar() or 0.0

        # Get recent transactions
        recent_transactions = Contribution.query \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .order_by(Contribution.date.desc()) \
            .limit(5) \
            .all()

        # Get monthly contribution summary
        monthly_contributions = db.session.query(
            func.to_char(Contribution.date, 'YYYY-MM').label('month'),
            func.sum(Contribution.amount).label('total')
        ) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .group_by('month') \
            .order_by('month') \
            .all()

        # Get wallet balance
        wallet_balance = current_user.wallet[0].balance if current_user.wallet else 0.0

        # Get group-specific stats if user is a group admin
        group_stats = []
        if is_group_admin:
            for membership in memberships:
                if membership.role == 'admin':
                    group = membership.group
                    group_contributions = db.session.query(func.sum(Contribution.amount)) \
                        .join(StokvelMember) \
                        .filter(StokvelMember.group_id == group.id) \
                        .scalar() or 0.0
                    
                    group_stats.append({
                        'group_id': group.id,
                        'group_name': group.name,
                        'total_contributions': float(group_contributions),
                        'member_count': len(group.members),
                        'active_members': len([m for m in group.members if m.status == 'active']),
                        'group_code': group.group_code
                    })

        return jsonify({
            'user': {
                'id': current_user.id,
                'name': current_user.full_name,
                'email': current_user.email,
                'role': current_user.role,
                'is_group_admin': is_group_admin
            },
            'walletBalance': float(wallet_balance),
            'activeGroupsCount': len(active_groups),
            'totalContributions': float(total_contributions),
            'recentTransactions': [{
                'id': t.id,
                'amount': float(t.amount),
                'date': t.date.isoformat(),
                'type': 'deposit',
                'description': f'Contribution to {t.member.group.name}'
            } for t in recent_transactions],
            'monthlySummary': [{'month': row.month, 'total': float(row.total)} for row in monthly_contributions],
            'groupStats': group_stats if is_group_admin else [],
            'activeGroups': [{
                'id': g.id,
                'name': g.name,
                'role': next(m.role for m in memberships if m.group_id == g.id),
                'contribution_amount': float(g.contribution_amount),
                'frequency': g.frequency
            } for g in active_groups]
        })

    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

@app.route('/api/stokvel/register-group', methods=['POST'])
@token_required
def register_stokvel_group(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Generate unique group code
        while True:
            group_code = generate_group_code()
            if not StokvelGroup.query.filter_by(group_code=group_code).first():
                break

        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            category=data['category'],  # <-- ADD THIS LINE
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            rules=data['rules'],
            tier=data['tier'],
            group_code=group_code,
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        
        # Create membership for the admin
        admin_membership = StokvelMember(
            user_id=current_user.id,
            group_id=new_group.id,
            status='active',
            role='admin'
        )
        
        db.session.add(admin_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Stokvel group created successfully',
            'group': new_group.to_dict(),
            'group_code': group_code  # Send this to admin to share with members
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stokvel/join-group', methods=['POST'])
@token_required
def join_stokvel_group(current_user):
    try:
        data = request.get_json()
        group_code = data.get('group_code')
        
        if not group_code:
            return jsonify({'error': 'Group code is required'}), 400
            
        # Find group by code
        group = StokvelGroup.query.filter_by(group_code=group_code).first()
        if not group:
            return jsonify({'error': 'Invalid group code'}), 404
            
        # Check if user is already a member
        existing_membership = StokvelMember.query.filter_by(
            user_id=current_user.id,
            group_id=group.id
        ).first()
        
        if existing_membership:
            return jsonify({'error': 'You are already a member of this group'}), 400
            
        # Check if group is full
        if group.max_members and len(group.members) >= group.max_members:
            return jsonify({'error': 'Group has reached maximum member limit'}), 400
            
        # Create new membership
        new_membership = StokvelMember(
            user_id=current_user.id,
            group_id=group.id,
            status='active',
            role='member'
        )
        
        db.session.add(new_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully joined stokvel group',
            'group': group.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def validate_email(email):
    # Add email validation
    pass

def validate_phone(phone):
    # Add phone validation
    pass

@app.route('/api/auth/verify', methods=['POST'])
def verify_otp():
    data = request.get_json()
    phone = data.get('phone')
    otp_code = data.get('otp_code')

    if not phone or not otp_code:
        return jsonify({'success': False, 'message': 'Phone and OTP code are required'}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    db.session.commit()

    # Create JWT token and return user info
    access_token = create_access_token(identity=str(user.id))
    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_verified": user.is_verified
    }
    return jsonify({
        'success': True,
        'message': 'Phone verified successfully',
        'access_token': access_token,
        'user': user_data
    })

@app.route('/api/delete-all-users', methods=['GET'])
def delete_all_users():
    try:
        # Delete all OTPs first
        OTP.query.delete()
        # Then delete all users
        User.query.delete()
        db.session.commit()
        return jsonify({'message': 'All users and OTPs deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-users', methods=['GET'])
def test_users():
    try:
        users = User.query.all()
        return jsonify({
            'count': len(users),
            'users': [{'id': user.id, 'email': user.email} for user in users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-email', methods=['POST'])
def test_email():
    """Test endpoint to verify email configuration"""
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check configuration
        if not check_email_config():
            return jsonify({'error': 'Email configuration is incomplete'}), 500
        
        # Send test email
        test_code = '123456'
        success, message = send_verification_email(test_email, test_code)
        
        if success:
            return jsonify({'message': 'Test email sent successfully', 'details': message}), 200
        else:
            return jsonify({'error': f'Failed to send test email: {message}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Test email failed: {str(e)}'}), 500

# After your app configuration
try:
   # db.engine.connect()
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    raise

@app.route('/api/test-connection')
def test_connection():
    try:
        # Test database
        db.engine.connect()
        db_status = "Database: Connected"
        
        # Test email
        mail_status = "Email: Not tested"
        if app.config['MAIL_USERNAME'] and app.config['MAIL_PASSWORD']:
            mail_status = "Email: Configured"
        
        return jsonify({
            'status': 'success',
            'database': db_status,
            'email': mail_status,
            'database_url': app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres:postgres', ':')  # Hide password
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/dashboard/users', methods=['GET'])
@role_required(['admin'])
def get_users():
    # Only admin can access this endpoint
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/dashboard/contributions', methods=['GET'])
@role_required(['admin', 'member'])
def get_contributions():
    # Both admin and members can access this endpoint
    user_id = get_jwt_identity()
    if request.args.get('all') and User.query.get(user_id).role == 'admin':
        # Admin can see all contributions
        contributions = Contribution.query.all()
    else:
        # Members can only see their own contributions
        contributions = Contribution.query.filter_by(user_id=user_id).all()
    return jsonify([contribution.to_dict() for contribution in contributions])

@app.route('/api/verify-email', methods=['POST', 'OPTIONS'])
def verify_email():
    if request.method == 'OPTIONS':
        # Explicitly handle OPTIONS preflight request
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers'))
        response.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

    # Handle the POST request
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email')
            code = data.get('verification_code')
            
            if not email or not code:
                return jsonify({'error': 'Email and verification code are required'}), 400

            # Clean the verification code
            code = code.replace(' ', '')
            
            user = User.query.filter_by(email=email).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.is_verified:
                return jsonify({'error': 'Email already verified'}), 400
            
            if not user.verification_code or not user.verification_code_expiry:
                return jsonify({'error': 'No verification code found for this user'}), 400
            
            if datetime.utcnow() > user.verification_code_expiry:
                return jsonify({'error': 'Verification code expired'}), 400
            
            # Clean the stored verification code for comparison
            stored_code = user.verification_code.replace(' ', '')
            if stored_code != code:
                print(f"Code mismatch - Received: '{code}', Stored: '{stored_code}'")  # Debug log
                return jsonify({'error': 'Invalid verification code'}), 400
            
            # Mark user as verified
            user.is_verified = True
            user.verification_code = None
            user.verification_code_expiry = None

            # --- Referral Completion Logic ---
            stmt = select(Referral).where(Referral.referee_id == user.id, Referral.status == 'pending')
            pending_referral = db.session.execute(stmt).scalar_one_or_none()
            if pending_referral:
                pending_referral.status = 'verified'
            check_and_process_referral_completion(user)
            db.session.commit()
            
            return jsonify({'message': 'Email verified successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Verification error: {str(e)}")  # Debug log
            return jsonify({'error': str(e)}), 500

@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'error': 'Email already verified'}), 400
        
        # Generate and send new verification code
        verification_code = user.generate_verification()
        print(f"Resending verification code: {verification_code} for user: {email}")
        
        success, message = send_verification_email(user.email, verification_code)
        print(f"Resend email result - Success: {success}, Message: {message}")
        
        if not success:
            db.session.rollback()
            return jsonify({'error': f'Failed to send verification email: {message}'}), 500
        
        db.session.commit()

        return jsonify({'message': 'New verification code sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error during resend: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to resend verification code: {str(e)}'}), 500

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    try:
        # Automatically generate account number if user doesn't have one
        if not current_user.account_number:
            current_user.account_number = generate_account_number()
            db.session.commit()
            print(f"✅ Generated account number {current_user.account_number} for user {current_user.id} ({current_user.email})")
        
        # Ensure user has a wallet
        wallet = get_or_create_wallet(current_user.id)
        
        return jsonify({
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "profile_picture": current_user.profile_picture,
            "gender": current_user.gender,
            "employment_status": current_user.employment_status,
            "is_verified": current_user.is_verified,
            "two_factor_enabled": current_user.two_factor_enabled,
            "account_number": current_user.account_number,
            "wallet_balance": float(wallet.balance) if wallet.balance is not None else 0.00
        }), 200
    except Exception as e:
        print(f"❌ Error in get_user_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Failed to load profile",
            "details": str(e)
        }), 500

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    data = request.get_json()

    # Update fields that are simple string assignments
    if 'name' in data:
        current_user.full_name = data['name']
    if 'phone' in data:
        current_user.phone = data['phone']
    if 'gender' in data:
        current_user.gender = data['gender']
    if 'employment_status' in data:
        current_user.employment_status = data['employment_status']

    # Specifically handle date_of_birth: parse string to datetime object
    if 'date_of_birth' in data and data['date_of_birth']:
        try:
            # The fromisoformat() method correctly parses 'YYYY-MM-DD'
            current_user.date_of_birth = datetime.fromisoformat(data['date_of_birth'])
        except (ValueError, TypeError):
            # Handle cases where the date format is wrong or data is null
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/user/security/password', methods=['PUT', 'OPTIONS'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_user or not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'})

@app.route('/api/user/security/2fa', methods=['POST', 'OPTIONS'])
@token_required
def toggle_two_factor(current_user):
    current_user.two_factor_enabled = not current_user.two_factor_enabled
    db.session.commit()
    return jsonify({
        "message": "Two-factor authentication updated",
        "two_factor_enabled": current_user.two_factor_enabled
    }), 200

@app.route('/api/user/communication', methods=['GET', 'OPTIONS'])
@token_required
def get_communication_preferences(current_user):
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
        db.session.commit()
    return jsonify({
        "email_announcements": settings.email_announcements,
        "email_stokvel_updates": settings.email_stokvel_updates,
        "push_announcements": settings.push_announcements
    })

@app.route('/api/user/communication', methods=['PUT', 'OPTIONS'])
@token_required
def update_communication_preferences(current_user):
    data = request.get_json()
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
    for field in ["email_announcements", "email_stokvel_updates", "push_announcements"]:
        if field in data:
            setattr(settings, field, data[field])
    db.session.commit()
    return jsonify({"message": "Communication preferences updated successfully"}), 200

@app.route('/api/user/privacy', methods=['GET', 'OPTIONS'])
@token_required
def get_privacy_settings(current_user):
    prefs = UserPreferences.query.filter_by(user_id=current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.session.add(prefs)
        db.session.commit()
    return jsonify({
        "data_for_personalization": prefs.data_for_personalization,
        "data_for_analytics": prefs.data_for_analytics,
        "data_for_third_parties": prefs.data_for_third_parties,
    })

@app.route('/api/user/account', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_account(current_user):
    data = request.get_json() or {}
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    db.session.delete(current_user)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'})

@app.route('/api/start', methods=['POST'])
@token_required
def start_chat(current_user):
    data = request.get_json() or {}
    title = data.get('title', 'New Chat')
    is_stokvel_related = data.get('is_stokvel_related', False)
    stokvel_id = data.get('stokvel_id')

    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=title,
        is_stokvel_related=is_stokvel_related,
        stokvel_id=stokvel_id
    )
    db.session.add(conversation)
    db.session.commit()

    # Add system message
    system_message = Message(
        conversation_id=conversation.id,
        role='system',
        content='You are a helpful assistant. Answer concisely in 1-3 sentences.'
    )
    db.session.add(system_message)
    db.session.commit()

    return jsonify({"conversation_id": conversation.id}), 201

@app.route('/api/message', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    conversation_id = data.get('conversation_id')
    user_message = data.get('message')

    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found."}), 404

    # Add user message
    user_msg = Message(
        conversation_id=conversation_id,
        role='user',
        content=user_message
    )
    db.session.add(user_msg)
    db.session.commit()

    # Fetch all messages for OpenAI context
    messages = [
        {"role": m.role, "content": m.content}
        for m in Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    ]

    # Call OpenRouter API
    try:
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": os.getenv('FRONTEND_URL', 'http://localhost:3000'),
                "X-Title": "Stokvel Assistant",
            },
            model="meta-llama/llama-3-8b-instruct",
            messages=messages,
            max_tokens=150
        )
        ai_response = completion.choices[0].message.content

        # Store AI response
        assistant_msg = Message(
            conversation_id=conversation_id,
            role='assistant',
            content=ai_response
        )
        db.session.add(assistant_msg)
        db.session.commit()

        return jsonify({
            "response": ai_response,
            "conversation_id": conversation_id
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key:
            return jsonify({'error': 'OpenRouter API key not set'}), 500

        payload = {
            "model": "meta-llama/llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": about_us_text},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 150
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )
        if response.status_code != 200:
            print("OpenRouter error:", response.text)
            return jsonify({'error': f'OpenRouter error: {response.text}'}), 500

        data = response.json()
        answer = data['choices'][0]['message']['content']
        return jsonify({'answer': answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    # Let Flask handle HTTP errors (like 404, 405, etc.) with its default pages
    if isinstance(error, HTTPException):
        return error

    logger.error(f"Unhandled error: {str(error)}")
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
    if isinstance(error, (ExpiredSignatureError, InvalidTokenError)):
        return jsonify({"error": "Token has expired"}), 401
    return jsonify({"error": "An unexpected error occurred"}), 500



@app.before_request
def handle_options_requests():
    if request.method == 'OPTIONS':
        return '', 200

@app.route('/api/user/security/2fa/start', methods=['POST'])
@token_required
def start_2fa_setup(current_user):
    data = request.get_json()
    method = data.get('method', 'email')  # 'email' or 'sms'

    # Generate OTP
    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=current_user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    # Send OTP
    if method == 'sms':
        send_verification_sms(current_user.phone, otp_code)
    else:
        send_verification_email(current_user.email, otp_code)

    current_user.two_factor_method = method
    db.session.commit()

    return jsonify({'message': f'OTP sent via {method}.', 'method': method}), 200

@app.route('/api/user/security/2fa/verify', methods=['POST'])
@token_required
def verify_2fa_setup(current_user):
    data = request.get_json()
    otp_code = data.get('otp_code')

    otp = OTP.query.filter_by(user_id=current_user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    current_user.two_factor_enabled = True
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication enabled!'}), 200

@app.route('/api/auth/verify-2fa-login', methods=['POST'])
def verify_2fa_login():
    data = request.get_json()
    user_id = data.get('user_id')
    otp_code = data.get('otp_code')
    user = User.query.get(user_id)
    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    otp.is_used = True
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'message': '2FA login successful', 'access_token': access_token}), 200

@app.route('/api/user/security/2fa/disable', methods=['POST'])
@token_required
def disable_2fa(current_user):
    data = request.get_json()
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    current_user.two_factor_enabled = False
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication disabled!'}), 200

@app.route('/api/user/session/<int:session_id>/logout', methods=['POST'])
@token_required
def logout_session(current_user, session_id):
    session = UserSession.query.filter_by(id=session_id, user_id=current_user.id, is_active=True).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Session logged out successfully'})

@app.route('/api/user/sessions', methods=['GET'])
@token_required
def get_user_sessions(current_user):
    sessions = UserSession.query.filter_by(user_id=current_user.id).order_by(UserSession.login_time.desc()).all()
    return jsonify([
        {
            'id': s.id,
            'user_agent': s.user_agent,
            'ip_address': s.ip_address,
            'login_time': s.login_time.isoformat(),
            'last_activity': s.last_activity.isoformat(),
            'is_active': s.is_active
        }
        for s in sessions
    ])

@app.route('/api/user/sessions/logout_all', methods=['POST'])
@token_required
def logout_all_sessions(current_user):
    current_user_agent = request.headers.get('User-Agent', '')
    current_ip = request.remote_addr or ''
    sessions = UserSession.query.filter_by(user_id=current_user.id, is_active=True).all()
    for session in sessions:
        # Keep the current session active, log out others
        if session.user_agent != current_user_agent or session.ip_address != current_ip:
            session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Logged out from all other sessions.'})

  

KYC_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'kyc_docs')
os.makedirs(KYC_UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/kyc/update', methods=['PATCH'])
@token_required
def update_kyc(current_user):
    # Find existing KYC record or create a new one in 'draft' state
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        kyc = KYCVerification(user_id=current_user.id, status='draft')
        db.session.add(kyc)

    # Handle file uploads
    if request.files:
        files = request.files
        
        def save_file(field_name):
            file = files.get(field_name)
            if file and file.filename:
                # Validate file type
                allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
                file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                
                if file_extension not in allowed_extensions:
                    raise ValueError(f'File type .{file_extension} is not allowed. Please upload PDF, JPG, PNG, or DOC files.')
                
                # Validate file size (10MB limit)
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                if file_size > 10 * 1024 * 1024:  # 10MB
                    raise ValueError('File size must be less than 10MB.')
                
                filename = secure_filename(f"{current_user.id}_{field_name}_{file.filename}")
                file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
                file.save(file_path)
                return file_path
            return None

        # Save uploaded files and update database paths
        if 'documents.idDocument' in files:
            kyc.id_document_path = save_file('documents.idDocument')
        if 'documents.proofOfAddress' in files:
            kyc.proof_of_address_path = save_file('documents.proofOfAddress')
        if 'documents.proofOfIncome' in files:
            kyc.proof_of_income_path = save_file('documents.proofOfIncome')
        if 'documents.bankStatement' in files:
            kyc.bank_statement_path = save_file('documents.bankStatement')

    # Handle JSON data for form fields
    if request.is_json:
        data = request.get_json()
        
        # Map frontend camelCase to backend snake_case
        key_map = {
            'fullName': 'full_name', 'dateOfBirth': 'date_of_birth', 'idNumber': 'id_number',
            'employmentStatus': 'employment_status', 'employerName': 'employer_name',
            'streetAddress': 'street_address', 'postalCode': 'postal_code', 'monthlyIncome': 'monthly_income',
            'incomeSource': 'income_source', 'employmentType': 'employment_type', 'bankName': 'bank_name',
            'accountNumber': 'account_number', 'accountType': 'account_type', 'branchCode': 'branch_code'
        }

        # data will be like {'personal': {'fullName': 'John'}}
        section_data = list(data.values())[0]

        for camel_key, value in section_data.items():
            snake_key = key_map.get(camel_key, camel_key)
            if hasattr(kyc, snake_key):
                # Safely handle empty strings for numeric fields
                if snake_key == 'monthly_income' and (value == '' or value is None):
                    setattr(kyc, snake_key, None)
                else:
                    setattr(kyc, snake_key, value)

    try:
        db.session.commit()
        return jsonify({'message': 'KYC details saved successfully!'}), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while saving KYC data.'}), 500

@app.route('/api/kyc/submit', methods=['POST'])
@token_required
def submit_kyc(current_user):
    # The final submission now assumes a draft KYC record exists
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        return jsonify({'error': 'Please save your details before submitting.'}), 400

    files = request.files

    def save_file(field):
        file = files.get(field)
        if file:
            filename = secure_file(f"{current_user.id}_{field}_{file.filename}")
            file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
            file.save(file_path)
            return file_path
        return None

    # Update document paths
    kyc.id_document_path = save_file('documents.idDocument') or kyc.id_document_path
    kyc.proof_of_address_path = save_file('documents.proofOfAddress') or kyc.proof_of_address_path
    kyc.proof_of_income_path = save_file('documents.proofOfIncome') or kyc.proof_of_income_path
    kyc.bank_statement_path = save_file('documents.bankStatement') or kyc.bank_statement_path
    
    # Change status to 'pending' for review
    kyc.status = 'pending'
    db.session.commit()

    return jsonify({'message': 'KYC submitted successfully for review', 'kyc_id': kyc.id}), 201

@app.route('/api/kyc/status', methods=['GET'])
@token_required
def get_kyc_status(current_user):
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).order_by(KYCVerification.created_at.desc()).first()
    if not kyc:
        return jsonify({'status': 'not_submitted', 'message': 'No KYC submission found.'}), 200

    return jsonify({
        'status': kyc.status,
        'full_name': kyc.full_name,
        'date_of_birth': str(kyc.date_of_birth) if kyc.date_of_birth else None,
        'id_number': kyc.id_number,
        'phone': kyc.phone,
        'email': kyc.email,
        'employment_status': kyc.employment_status,
        'employer_name': kyc.employer_name,
        'street_address': kyc.street_address,
        'city': kyc.city,
        'province': kyc.province,
        'postal_code': kyc.postal_code,
        'country': kyc.country,
        'monthly_income': kyc.monthly_income,
        'income_source': kyc.income_source,
        'employment_type': kyc.employment_type,
        'bank_name': kyc.bank_name,
        'account_number': kyc.account_number,
        'account_type': kyc.account_type,
        'branch_code': kyc.branch_code,
        'id_document_path': kyc.id_document_path,
        'proof_of_address_path': kyc.proof_of_address_path,
        'proof_of_income_path': kyc.proof_of_income_path,
        'bank_statement_path': kyc.bank_statement_path,
        'verification_date': str(kyc.verification_date) if kyc.verification_date else None,
        'rejection_reason': kyc.rejection_reason,
        'created_at': str(kyc.created_at),
        'updated_at': str(kyc.updated_at)
    }), 200

@app.route('/api/admin/kyc/submissions', methods=['GET'])
@role_required(['admin'])
def get_kyc_submissions():
    """Get all KYC submissions for admin review"""
    try:
        submissions = KYCVerification.query.all()
        submissions_data = []
        
        for submission in submissions:
            user = User.query.get(submission.user_id)
            submissions_data.append({
                'id': submission.id,
                'user_id': submission.user_id,
                'user_email': user.email if user else 'Unknown',
                'user_name': user.full_name if user else 'Unknown',
                'status': submission.status,
                'full_name': submission.full_name,
                'email': submission.email,
                'phone': submission.phone,
                'id_number': submission.id_number,
                'employment_status': submission.employment_status,
                'bank_name': submission.bank_name,
                'account_number': submission.account_number,
                'id_document_path': submission.id_document_path,
                'proof_of_address_path': submission.proof_of_address_path,
                'proof_of_income_path': submission.proof_of_income_path,
                'bank_statement_path': submission.bank_statement_path,
                'created_at': submission.created_at.isoformat(),
                'updated_at': submission.updated_at.isoformat(),
                'rejection_reason': submission.rejection_reason
            })
        
        return jsonify(submissions_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/approve', methods=['POST'])
@role_required(['admin'])
def approve_kyc(submission_id):
    """Approve a KYC submission"""
    try:
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'approved'
        kyc.verification_date = datetime.utcnow()
        
        # Update user verification status
        user = User.query.get(kyc.user_id)
        if user:
            user.is_verified = True
        
        db.session.commit()

        # On approval
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Approved",
            message="Your KYC verification has been approved! You can now join groups.",
            type="kyc_approved",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission approved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/reject', methods=['POST'])
@role_required(['admin'])
def reject_kyc(submission_id):
    """Reject a KYC submission"""
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'rejected'
        kyc.rejection_reason = rejection_reason
        
        db.session.commit()

        # On rejection
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Rejected",
            message=f"Your KYC verification was rejected. Reason: {kyc.rejection_reason}",
            type="kyc_rejected",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission rejected successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/kyc/document/<path:filename>', methods=['GET'])
@token_required
def download_kyc_document(current_user, filename):
    """Download a KYC document (only accessible by the document owner or admin)"""
    try:
        # Check if user is admin or the document belongs to them
        if current_user.role != 'admin':
            # Extract user_id from filename (format: user_id_fieldname_originalname)
            filename_parts = filename.split('_')
            if len(filename_parts) < 2 or filename_parts[0] != str(current_user.id):
                return jsonify({'error': 'Access denied'}), 403
        
        file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/stats', methods=['GET'])
@role_required(['admin'])
def get_kyc_stats():
    try:
        pending_count = KYCVerification.query.filter_by(status='pending').count()
        approved_count = KYCVerification.query.filter_by(status='approved').count()
        rejected_count = KYCVerification.query.filter_by(status='rejected').count()
        
        return jsonify({
            'pending': pending_count,
            'approved': approved_count,
            'rejected': rejected_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def check_email_config():
    """Check if email configuration is properly set up"""
    required_vars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"WARNING: Missing email configuration variables: {missing_vars}")
        print("Email functionality will not work properly!")
        return False
    
    print("Email configuration check passed!")
    return True

# Call this when the app starts
check_email_config()

bp = Blueprint('admin', __name__)

@bp.route('/stokvels', methods=['GET'])
def list_all_stokvels():
    # your code here
    pass

@app.route('/api/admin/groups/<int:group_id>', methods=['PUT'])
@token_required
def update_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    data = request.get_json()
    group.name = data.get('name', group.name)
    group.description = data.get('description', group.description)
    group.contribution_amount = float(data.get('contribution_amount', group.amount))
    group.frequency = data.get('frequency', group.frequency)
    group.max_members = int(data.get('max_members', group.max_members))
    group.tier = data.get('tier', group.tier)  # Add this if you have a tier field

    db.session.commit()
    return jsonify({'message': 'Group updated successfully'}), 200

@app.route('/api/admin/groups/<int:group_id>', methods=['DELETE'])
@token_required
def delete_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Group deleted successfully'}), 200

@app.route('/api/groups/join', methods=['POST'])
@jwt_required()
def join_group():
    data = request.get_json()
    user_id = get_jwt_identity()
    tier_id = data.get('tierId')

    # Check for existing pending request
    existing = GroupJoinRequest.query.filter_by(user_id=user_id, tier_id=tier_id, status='pending').first()
    if existing:
        return jsonify({'error': 'You already have a pending request for this tier.'}), 400

    join_request = GroupJoinRequest(user_id=user_id, tier_id=tier_id)
    db.session.add(join_request)
    db.session.commit()
    return jsonify({"message": "Join request submitted!"}), 200

class GroupJoinRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tier_id = db.Column(db.Integer, nullable=False)  # or group_id if you use groups
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    reason = db.Column(db.String(255))  # Reason for rejection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='join_requests')

@app.route('/api/admin/join-requests', methods=['GET'])
@jwt_required()
def list_join_requests():
    # Optionally check admin role here
    requests = GroupJoinRequest.query.order_by(GroupJoinRequest.created_at.desc()).all()
    result = []
    for req in requests:
        result.append({
            'id': req.id,
            'user_id': req.user_id,
            'tier_id': req.tier_id,
            'status': req.status,
            'reason': req.reason,
            'created_at': req.created_at.isoformat(),
            'user': {
                'id': req.user.id,
                'name': req.user.full_name,
                'email': req.user.email,
            }
        })
    return jsonify(result)

@app.route('/api/admin/join-requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_join_request(request_id):
    req = GroupJoinRequest.query.get_or_404(request_id)
    user = User.query.get(req.user_id)
    kyc = KYCVerification.query.filter_by(user_id=user.id).order_by(KYCVerification.created_at.desc()).first()
    
    if not kyc or kyc.status != 'approved':
        # Send notification to user to complete KYC
        notification = Notification(
            user_id=user.id,
            title="KYC Required for Group Approval",
            message="Your join request is pending. Please complete your KYC verification to be approved for the group.",
            type="kyc_required",
            data={
                "join_request_id": req.id,
                "group_id": req.tier_id,
                "action_required": "complete_kyc",
                "kyc_url": "/dashboard/kyc"  # <-- Add this line
            }
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'error': 'User must complete and have KYC approved before approval.',
            'message': 'Notification sent to user to complete KYC',
            'user_email': user.email
        }), 400
    
    req.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Request approved'})

@app.route('/api/admin/join-requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_join_request(request_id):
    data = request.get_json()
    reason = data.get('reason', '')
    req = GroupJoinRequest.query.get_or_404(request_id)
    req.status = 'rejected'
    req.reason = reason
    db.session.commit()
    return jsonify({'message': 'Request rejected'})

@app.route('/api/user/join-requests', methods=['GET'])
@jwt_required()
def get_user_join_requests():
    user_id = get_jwt_identity()
    requests = GroupJoinRequest.query.filter_by(user_id=user_id).all()
    result = []
    for req in requests:
        group = StokvelGroup.query.get(req.tier_id)
        result.append({
            'tier_id': req.tier_id,
            'status': req.status,
            'reason': req.reason,
            'group_name': group.name if group else None,
            'tier': group.tier if group else None,
            'amount': group.amount if group else None,
            'created_at': req.created_at.isoformat() if req.created_at else None
        })
    return jsonify(result)



@app.route('/api/user/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/user/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/admin/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get notifications for admin users
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/admin/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_admin_notification_read(notification_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/user/notifications/mark-as-read', methods=['POST'])
@token_required
def mark_notifications_as_read(current_user):
    return jsonify({'message': 'Not implemented'}), 501



@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    # You can use pass, or a real implementation, or a placeholder return
    return jsonify({'message': 'Not implemented'}), 501

@app.route('/api/auth/resend-sms', methods=['POST'])
def resend_sms():
    data = request.get_json()
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400

    normalized_phone = normalize_phone(phone)
    user = User.query.filter_by(phone=normalized_phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User with this phone does not exist'}), 404

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    success, message = send_verification_sms(normalized_phone, otp_code)
    if not success:
        return jsonify({'success': False, 'message': f'Failed to send SMS: {message}'}), 500

    return jsonify({'success': True, 'message': 'OTP sent successfully'})

@app.route('/api/user/profile-picture', methods=['POST'])
@token_required
def upload_profile_picture(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(f"{current_user.id}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        # Save the relative path or URL in the database
        current_user.profile_picture = f"/uploads/profile_pics/{filename}"
        db.session.commit()
        return jsonify({'profile_picture': current_user.profile_picture}), 200

@app.route('/uploads/profile_pics/<filename>')
def serve_profile_picture(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/uploads/kyc_docs/<filename>')
def serve_kyc_doc(filename):
    return send_from_directory(KYC_UPLOAD_FOLDER, filename)

@app.route('/api/wallet/cards', methods=['POST'])
@token_required
def add_card(current_user):
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['cardholder', 'cardNumber', 'expiry', 'cvv']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate card details
    card_number = data['cardNumber'].replace(' ', '')
    expiry = data['expiry']
    cvv = data['cvv']
    
    is_valid, result = validate_card(card_number, expiry, cvv)
    if not is_valid:
        error_messages = {
            'invalid_length': 'Card number must be 13-19 digits',
            'invalid_number': 'Invalid card number',
            'invalid_expiry': 'Invalid expiry date',
            'expired': 'Card has expired',
            'invalid_expiry_format': 'Invalid expiry format (MM/YY)',
            'invalid_cvv': 'Invalid CVV'
        }
        return jsonify({'error': error_messages.get(result, 'Invalid card details')}), 400
    
    card_type = Card.detect_card_type(card_number)
    
    # Extract last 4 digits from card number
    last4 = card_number[-4:]
    
    # Create new card
    new_card = Card(
        user_id=current_user.id,
        cardholder=data['cardholder'],
        card_number_last4=last4,
        expiry=expiry,
        card_type=card_type,
        is_primary=data.get('primary', False)
    )
    
    # If this is set as primary, unset other primary cards
    if new_card.is_primary:
        Card.query.filter_by(user_id=current_user.id, is_primary=True).update({'is_primary': False})
    
    db.session.add(new_card)
    db.session.commit()
    
    return jsonify({
        'message': 'Card added successfully',
        'card': new_card.to_dict()
    }), 201

@app.route('/api/wallet/cards', methods=['GET'])
@token_required
def get_cards(current_user):
    cards = Card.query.filter_by(user_id=current_user.id).all()
    return jsonify([card.to_dict() for card in cards]), 200

@app.route('/api/admin/join-requests/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_join_requests():
    GroupJoinRequest.query.delete()
    db.session.commit()
    return jsonify({'message': 'All join requests deleted'})

@app.route('/api/admin/join-requests/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_join_requests():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'error': 'No IDs provided'}), 400
    GroupJoinRequest.query.filter(GroupJoinRequest.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'message': 'Selected join requests deleted'})

@app.route('/api/user/referral-details', methods=['GET'])
@token_required
def get_user_referral_details(current_user):
    referral_code = current_user.referral_code
    base_frontend_url = "http://localhost:5173"  # Change to your real frontend
    referral_link = f"{base_frontend_url}/signup?ref={referral_code}"
    return jsonify({
        'referral_code': referral_code,
        'referral_link': referral_link
    }), 200

REWARD_CATALOG = {
    'airtime_10': {'points': 100, 'description': 'R10 Airtime or Mobile Data'},
    'voucher_50': {'points': 500, 'description': 'R50 Grocery Voucher'},
    'credit_100': {'points': 1000, 'description': 'R100 Wallet Credit'},
}

@app.route('/api/user/points/rewards', methods=['GET'])
@token_required
def get_rewards_catalog(current_user):
    return jsonify(REWARD_CATALOG)

@app.route('/api/user/points/redeem', methods=['POST'])
@token_required
def redeem_points(current_user):
    data = request.get_json()
    reward_key = data.get('reward_key')
    if not reward_key or reward_key not in REWARD_CATALOG:
        return jsonify({'error': 'Invalid or missing reward_key.'}), 400
    reward = REWARD_CATALOG[reward_key]
    required_points = reward['points']
    if current_user.points < required_points:
        return jsonify({
            'error': 'Insufficient points for this reward.',
            'current_points': current_user.points,
            'required_points': required_points
        }), 400
    current_user.points -= required_points
    db.session.commit()
    return jsonify({
        'message': 'Reward redeemed successfully!',
        'reward_received': reward['description'],
        'new_points_balance': current_user.points
    }), 200

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, verified, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('referrer_id', 'referee_id', name='uq_referral_pair'),
    )
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_sent')
    referee = db.relationship('User', foreign_keys=[referee_id], backref='referrals_received')

def get_user_by_referral_code(code):
    stmt = select(User).where(User.referral_code == code)
    return db.session.execute(stmt).scalar_one_or_none()

def check_and_process_referral_completion(referee_user):
    stmt = select(Referral).where(
        Referral.referee_id == referee_user.id,
        Referral.status == 'verified'
    )
    referral = db.session.execute(stmt).scalar_one_or_none()
    if not referral:
        return
    if not (referee_user.is_verified and getattr(referee_user, 'kyc_completed', True)):
        return
    if referral.status == 'completed':
        return
    referral.status = 'completed'
    referrer = db.session.get(User, referral.referrer_id)
    if not referrer:
        return
    referrer.valid_referrals += 1
    if referrer.valid_referrals == 1:
        referrer.points += 20
        unlock_notification = Notification(
            user_id=referrer.id,
            title="Referral Bonus Unlocked!",
            message="Congratulations! Your first successful referral earned you a 20 point unlock bonus. You now get points for every new referral."
        )
        db.session.add(unlock_notification)
    else:
        referrer.points += 30
        if referrer.valid_referrals > 0 and referrer.valid_referrals % 3 == 0:
            referrer.points += 100
            milestone_notification = Notification(
                user_id=referrer.id,
                title="🎉 Milestone Reached! 🎉",
                message=f"Amazing! You've reached {referrer.valid_referrals} successful referrals and earned a 100 point bonus!"
            )
            db.session.add(milestone_notification)


import os

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'profile_pics')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

about_us_text = "You are i-STOKVEL, a helpful assistant for stokvel group members and admins in South Africa."

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'deposit', 'transfer', 'withdrawal'
    amount = db.Column(db.Float, nullable=False)
    fee = db.Column(db.Float, default=0.00)  # Add fee field
    net_amount = db.Column(db.Float, nullable=False)  # Add net_amount field
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    reference = db.Column(db.String(50), unique=True)
    description = db.Column(db.String(200))
    recipient_email = db.Column(db.String(120))  # For transfers
    sender_email = db.Column(db.String(120))     # For transfers
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'))  # For deposits
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='transactions')
    card = db.relationship('Card', backref='transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),
            'fee': float(self.fee or 0.0),
            'net_amount': float(self.net_amount or self.amount),
            'transaction_type': self.transaction_type,
            'status': self.status,
            'reference': self.reference,
            'description': self.description,
            'recipient_email': self.recipient_email,
            'sender_email': self.sender_email,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

def get_or_create_wallet(user_id):
    """Get existing wallet or create new one for user"""
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.00)
        db.session.add(wallet)
        db.session.commit()
    return wallet

def generate_transaction_reference():
    """Generate unique transaction reference"""
    return f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"

def validate_test_card(card_number, expiry, cvv):
    """Validate test card details - for development only"""
    # Test card validation rules
    card_number = card_number.replace(' ', '').replace('-', '')
    
    # Test card numbers (these are common test numbers)
    test_cards = {
        'visa': '4242424242424242',
        'mastercard': '5555555555554444',
        'amex': '378282246310005'
    }
    
    # Check if it's a known test card
    for card_type, test_number in test_cards.items():
        if card_number == test_number:
            return True, card_type
    
    # For development, accept any card number that looks valid
    if len(card_number) >= 13 and len(card_number) <= 19:
        card_type = Card.detect_card_type(card_number)
        return True, card_type
    
    return False, 'unknown'

def process_deposit(user_id, amount, card_id, description=""):
    """Process a deposit transaction"""
    try:
        # Get or create wallet
        wallet = get_or_create_wallet(user_id)
        
        # Get card details
        card = Card.query.get(card_id)
        if not card:
            raise ValueError("Card not found")
        
        # For development, simulate payment processing
        # In production, you would integrate with a real payment processor
        payment_successful = simulate_payment_processing(amount, card)
        
        if not payment_successful:
            raise ValueError("Payment processing failed")
        
        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            transaction_type='deposit',
            amount=amount,
            fee=0.00,  # No fee for deposits
            net_amount=amount,  # Full amount for deposits
            status='completed',
            reference=generate_transaction_reference(),
            description=description or f"Deposit via {card.card_type.title()} ****{card.card_number_last4}",
            card_id=card_id,
            completed_at=datetime.utcnow()
        )
        
        # Update wallet balance
        wallet.balance += amount
        
        db.session.add(transaction)
        db.session.commit()
        
        return {
            'success': True,
            'transaction': transaction.to_dict(),
            'new_balance': float(wallet.balance)
        }
    except Exception as e:
        db.session.rollback()
        raise e

def simulate_payment_processing(amount, card):
    """Simulate payment processing - for development only"""
    # In development, always succeed
    # In production, integrate with Stripe, PayGate, or other payment processor
    return True

def process_transfer(sender_id, recipient_account_number, amount, description=""):
    recipient = User.query.filter_by(account_number=recipient_account_number).first()
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    if sender_id == recipient.id:
        raise ValueError("Cannot transfer to yourself")
    # ... rest of logic ...

@app.route('/api/wallet/balance', methods=['GET'])
@token_required
def get_wallet_balance(current_user):
    """Get user's wallet balance"""
    try:
        wallet = get_or_create_wallet(current_user.id)
        balance = float(wallet.balance) if wallet.balance is not None else 0.0
        return jsonify({
            'balance': balance,
            'currency': 'ZAR'
        }), 200
    except Exception as e:
        print(f"Error getting wallet balance: {str(e)}")
        return jsonify({
            'balance': 0.0,
            'currency': 'ZAR'
        }), 500

@app.route('/api/wallet/transactions', methods=['GET'])
@token_required
def get_wallet_transactions(current_user):
    """Get user's transaction history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        transactions = Transaction.query.filter_by(user_id=current_user.id)\
            .order_by(Transaction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [tx.to_dict() for tx in transactions.items],
            'pages': transactions.pages,
            'current_page': page,
            'total': transactions.total
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet/deposit', methods=['POST'])
@token_required
def make_deposit(current_user):
    """Process a deposit to wallet"""
    try:
        data = request.get_json()
        amount = data.get('amount')
        card_id = data.get('card_id')
        description = data.get('description', '')
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        if not card_id:
            return jsonify({'error': 'Card ID is required'}), 400
        
        # Verify card belongs to user
        card = Card.query.filter_by(id=card_id, user_id=current_user.id).first()
        if not card:
            return jsonify({'error': 'Invalid card'}), 400
        
        result = process_deposit(current_user.id, amount, card_id, description)
        
        return jsonify({
            'message': f'Deposit successful! R{amount:.2f} added to your wallet',
            'new_balance': result['new_balance'],
            'transaction': result['transaction'],
            'card_last4': card.card_number_last4
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet/transfer', methods=['POST'])
@token_required
def make_transfer(current_user):
    try:
        data = request.get_json()
        print(f"🔍 Transfer request data: {data}")
        
        amount = float(data.get('amount'))
        recipient_account_number = data.get('recipient_account_number')
        description = data.get('description', '')

        print(f"🔍 Amount: {amount}, Recipient: {recipient_account_number}")

        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        if not recipient_account_number:
            return jsonify({'error': 'Recipient account number is required'}), 400

        # Find recipient
        recipient = User.query.filter_by(account_number=recipient_account_number).first()
        print(f" Recipient found: {recipient.full_name if recipient else 'NOT FOUND'}")
        
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
        if recipient.id == current_user.id:
            return jsonify({'error': 'Cannot transfer to yourself'}), 400

        # Get wallets
        sender_wallet = get_or_create_wallet(current_user.id)
        recipient_wallet = get_or_create_wallet(recipient.id)
        
        if sender_wallet.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400

        # Update balances
        sender_wallet.balance -= amount
        recipient_wallet.balance += amount

        # Generate UNIQUE references for each transaction
        sender_reference = generate_transaction_reference()
        recipient_reference = generate_transaction_reference()
        
        # Create transactions with DIFFERENT references
        sender_transaction = Transaction(
            user_id=current_user.id,
            transaction_type='transfer',
            amount=-amount,
            fee=0.00,
            net_amount=-amount,
            status='completed',
            reference=sender_reference,  # Unique reference
            description=f"Transfer to {recipient.full_name} ({recipient_account_number[-4:]})",
            recipient_email=recipient.email,
            sender_email=current_user.email,
            completed_at=datetime.utcnow()
        )

        recipient_transaction = Transaction(
            user_id=recipient.id,
            transaction_type='transfer',
            amount=amount,
            fee=0.00,
            net_amount=amount,
            status='completed',
            reference=recipient_reference,  # Different unique reference
            description=f"Transfer from {current_user.full_name} ({current_user.account_number[-4:]})",
            recipient_email=recipient.email,
            sender_email=current_user.email,
            completed_at=datetime.utcnow()
        )

        # Create notification for recipient
        recipient_notification = Notification(
            user_id=recipient.id,
            title="Money Received",
            message=f"You received R{amount:.2f} from {current_user.full_name}",
            type="transfer_received",
            data={
                "amount": amount,
                "sender_name": current_user.full_name,
                "sender_account": current_user.account_number[-4:],
                "reference": sender_reference  # Use sender's reference for notification
            }
        )

        db.session.add(sender_transaction)
        db.session.add(recipient_transaction)
        db.session.add(recipient_notification)
        db.session.commit()
        
        print(f"✅ Transfer successful! New balance: {sender_wallet.balance}")

        return jsonify({
            'message': f'Transfer successful to {recipient.full_name}',
            'new_balance': float(sender_wallet.balance),
            'recipient_name': recipient.full_name,
            'reference': sender_reference  # Return sender's reference
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Transfer error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Transfer failed: {str(e)}'}), 500

@app.cli.command('add-test-card')
@with_appcontext
def add_test_card():
    """Add a test card for development"""
    email = click.prompt('Enter user email to add test card for', type=str)
    
    user = User.query.filter_by(email=email).first()
    if not user:
        click.echo(click.style(f"Error: User with email '{email}' not found.", fg='red'))
        return
    
    # Check if test card already exists
    existing_card = Card.query.filter_by(user_id=user.id, card_number_last4='1234').first()
    if existing_card:
        click.echo(click.style(f"Test card already exists for user '{email}'.", fg='yellow'))
        return
    
    test_card = Card(
        user_id=user.id,
        cardholder="Bongiwe M",  # Changed from "Test User"
        card_number_last4="1234",
        expiry="12/25",
        is_primary=True
    )
    
    db.session.add(test_card)
    db.session.commit()
    
    click.echo(click.style(f"Test card added successfully for user '{email}'.", fg='green'))
    click.echo(f"Card Details: Visa ****1234, Expires: 12/25")

@app.route('/api/test/add-test-card', methods=['POST'])
@token_required
def add_test_card_api(current_user):
    """Temporary endpoint to add test card - REMOVE IN PRODUCTION"""
    try:
        # Check if test card already exists
        existing_card = Card.query.filter_by(user_id=current_user.id, card_number_last4='1234').first()
        if existing_card:
            return jsonify({'message': 'Test card already exists', 'card': existing_card.to_dict()}), 200
        
        # Unset other primary cards
        Card.query.filter_by(user_id=current_user.id, is_primary=True).update({'is_primary': False})
        
        test_card = Card(
            user_id=current_user.id,
            cardholder="Bongiwe M",  # Changed from current_user.full_name
            card_number_last4="1234",
            expiry="12/25",
            is_primary=True
        )
        
        db.session.add(test_card)
        db.session.commit()
        
        return jsonify({
            'message': 'Test card added successfully',
            'card': test_card.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def check_transaction_limits(user_id, amount, transaction_type):
    """Check if transaction is within limits"""
    today = datetime.utcnow().date()
    
    if transaction_type == 'deposit':
        daily_total = db.session.query(func.sum(Transaction.amount))\
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'deposit',
                func.date(Transaction.created_at) == today,
                Transaction.status == 'completed'
            ).scalar() or 0.0
        
        if daily_total + amount > app.config['DAILY_DEPOSIT_LIMIT']:
            raise ValueError(f"Daily deposit limit exceeded. You can deposit R{app.config['DAILY_DEPOSIT_LIMIT'] - daily_total:.2f} more today.")
    
    elif transaction_type == 'transfer':
        daily_total = db.session.query(func.sum(Transaction.amount))\
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'transfer',
                func.date(Transaction.created_at) == today,
                Transaction.status == 'completed',
                Transaction.amount < 0  # Outgoing transfers
            ).scalar() or 0.0
        
        if abs(daily_total) + amount > app.config['DAILY_TRANSFER_LIMIT']:
            raise ValueError(f"Daily transfer limit exceeded. You can transfer R{app.config['DAILY_TRANSFER_LIMIT'] - abs(daily_total):.2f} more today.")
    
    # Check amount limits
    if amount < app.config['MIN_TRANSACTION_AMOUNT']:
        raise ValueError(f"Minimum transaction amount is R{app.config['MIN_TRANSACTION_AMOUNT']:.2f}")
    
    if amount > app.config['MAX_TRANSACTION_AMOUNT']:
        raise ValueError(f"Maximum transaction amount is R{app.config['MAX_TRANSACTION_AMOUNT']:.2f}")

@app.route('/api/wallet/analytics', methods=['GET'])
@token_required
def get_wallet_analytics(current_user):
    """Get wallet analytics and insights"""
    try:
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get transactions in date range
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        ).all()
        
        # Calculate analytics
        total_deposits = sum(tx.amount for tx in transactions if tx.transaction_type == 'deposit' and tx.status == 'completed')
        total_transfers_out = abs(sum(tx.amount for tx in transactions if tx.transaction_type == 'transfer' and tx.amount < 0 and tx.status == 'completed'))
        total_transfers_in = sum(tx.amount for tx in transactions if tx.transaction_type == 'transfer' and tx.amount > 0 and tx.status == 'completed')
        total_fees = sum(tx.fee for tx in transactions if tx.fee)
        
        # Monthly breakdown
        monthly_data = db.session.query(
            func.to_char(Transaction.created_at, 'YYYY-MM').label('month'),
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.status == 'completed'
        ).group_by('month').order_by('month').all()
        
        return jsonify({
            'period': f'Last {days} days',
            'summary': {
                'total_deposits': float(total_deposits),
                'total_transfers_out': float(total_transfers_out),
                'total_transfers_in': float(total_transfers_in),
                'total_fees': float(total_fees),
                'net_flow': float(total_deposits + total_transfers_in - total_transfers_out)
            },
            'monthly_breakdown': [
                {
                    'month': row.month,
                    'total': float(row.total),
                    'count': row.count
                } for row in monthly_data
            ],
            'transaction_count': len(transactions)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet/export', methods=['GET'])
@token_required
def export_transactions(current_user):
    """Export transactions as CSV"""
    try:
        from io import StringIO
        import csv
        
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get transactions
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        ).order_by(Transaction.created_at.desc()).all()
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Type', 'Amount', 'Fee', 'Net Amount', 'Status', 'Reference', 'Description'])
        
        for tx in transactions:
            writer.writerow([
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                tx.transaction_type,
                f"R{tx.amount:.2f}",
                f"R{tx.fee:.2f}",
                f"R{tx.net_amount:.2f}",
                tx.status,
                tx.reference,
                tx.description
            ])
        
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=transactions_{datetime.utcnow().strftime("%Y%m%d")}.csv'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.cli.command('update-test-card-name')
@with_appcontext
def update_test_card_name():
    """Update existing test card name to Bongiwe M"""
    email = click.prompt('Enter user email to update test card for', type=str)
    
    user = User.query.filter_by(email=email).first()
    if not user:
        click.echo(click.style(f"Error: User with email '{email}' not found.", fg='red'))
        return
    
    # Find the test card
    test_card = Card.query.filter_by(user_id=user.id, card_number_last4='1234').first()
    if not test_card:
        click.echo(click.style(f"No test card found for user '{email}'.", fg='yellow'))
        return
    
    # Update the cardholder name
    test_card.cardholder = "Bongiwe M"
    db.session.commit()
    
    click.echo(click.style(f"Test card updated successfully for user '{email}'.", fg='green'))
    click.echo(f"Card Details: {test_card.cardholder} - Visa ****{test_card.card_number_last4}, Expires: {test_card.expiry}")

def validate_card(card_number, expiry, cvv):
    """Validate card details - accepts both test and real cards"""
    # Clean card number
    card_number = card_number.replace(' ', '').replace('-', '')
    
    # Basic validation
    if len(card_number) < 13 or len(card_number) > 19:
        return False, 'invalid_length'
    
    # Luhn algorithm check for valid card number
    # if not luhn_check(card_number):
    #     return False, 'invalid_number'
    
    # Validate expiry date
    try:
        month, year = expiry.split('/')
        month, year = int(month), int(year)
        if month < 1 or month > 12:
            return False, 'invalid_expiry'
        
        # Check if card is expired
        current_year = datetime.utcnow().year % 100
        current_month = datetime.utcnow().month
        if year < current_year or (year == current_year and month < current_month):
            return False, 'expired'
    except:
        return False, 'invalid_expiry_format'
    
    # Validate CVV
    if len(cvv) < 3 or len(cvv) > 4:
        return False, 'invalid_cvv'
    
    # Detect card type
    card_type = Card.detect_card_type(card_number)
    
    return True, card_type

def luhn_check(card_number):
    """Luhn algorithm to validate card number"""
    digits = [int(d) for d in card_number]
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(divmod(d * 2, 10))
    return checksum % 10 == 0

@app.route('/api/wallet/withdraw', methods=['POST'])
@token_required
def withdraw(current_user):
    try:
        data = request.get_json()
        amount = data.get('amount')
        bank_account_number = data.get('bank_account_number')
        description = data.get('description', '')

        # Enhanced validation
        if not amount or amount < MIN_WITHDRAWAL_AMOUNT:
            return jsonify({'error': f'Minimum withdrawal amount is R{MIN_WITHDRAWAL_AMOUNT:.2f}'}), 400
        if amount > MAX_WITHDRAWAL_AMOUNT:
            return jsonify({'error': f'Maximum withdrawal amount is R{MAX_WITHDRAWAL_AMOUNT:.2f}'}), 400
        if not bank_account_number:
            return jsonify({'error': 'Bank account number is required'}), 400
        if len(bank_account_number) != 10:
            return jsonify({'error': 'Bank account number must be exactly 10 digits'}), 400
        
        # Get or create wallet
        wallet = get_or_create_wallet(current_user.id)
        if wallet.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400

        # Calculate fees
        fee = amount * WITHDRAWAL_FEE_PERCENTAGE
        total_deduction = amount + fee
        
        if wallet.balance < total_deduction:
            return jsonify({'error': f'Insufficient balance. Need R{total_deduction:.2f} (R{amount:.2f} + R{fee:.2f} fee)'}), 400

        # Create withdrawal transaction record
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='withdrawal',
            amount=amount,
            fee=fee,
            net_amount=-total_deduction,  # Negative for withdrawals
            status='completed',
            reference=generate_transaction_reference(),
            description=f"Withdrawal to bank account ending in {bank_account_number[-4:]} (Fee: R{fee:.2f})",
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        
        # Deduct from wallet
        wallet.balance -= total_deduction
        db.session.commit()

        return jsonify({
            'message': 'Withdrawal successful',
            'new_balance': float(wallet.balance),
            'amount_withdrawn': float(amount),
            'fee_charged': float(fee),
            'total_deduction': float(total_deduction),
            'reference': transaction.reference
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Withdrawal error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Withdrawal failed: {str(e)}'}), 500

@app.cli.command('generate-account-numbers')
@with_appcontext
def generate_account_numbers():
    """Generate account numbers for all users who don't have them"""
    try:
        users_without_account = User.query.filter_by(account_number=None).all()
        
        if not users_without_account:
            print("✅ All users already have account numbers!")
            return
        
        for user in users_without_account:
            user.account_number = generate_account_number()
            print(f"✅ Generated account number {user.account_number} for user {user.id} ({user.email})")
        
        db.session.commit()
        print(f"✅ Generated account numbers for {len(users_without_account)} users")
    except Exception as e:
        print(f"❌ Error generating account numbers: {str(e)}")
        db.session.rollback()

@app.route('/api/wallet/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    card = Card.query.get(card_id)
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card deleted successfully'}), 200


 # -------------------- MAIN --------------------
if __name__ == '__main__':
    app.run(port=5001, debug=True)

@event.listens_for(Engine, "connect")
def connect(dbapi_connection, connection_record):
    connection_record.info['pid'] = os.getpid()

@event.listens_for(Engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    pid = os.getpid()
    if connection_record.info['pid'] != pid:
        connection_record.info['pid'] = pid
        connection_record.info['checked_out'] = time.time()