from flask import Flask, request, jsonify, Response
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
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Mail, Message
import random
import requests
import logging
import string
from iStokvel.utils.email_utils import send_verification_email
from flask_migrate import Migrate
from twilio.rest import Client
import phonenumbers
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import event
from sqlalchemy.engine import Engine # Also need to import Engine for @event.listens_for(Engine, "connect")

# Load environment variables from .env file
load_dotenv()

# Config
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:property007@localhost:5432/authdb'
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

# -------------------- INITIALIZE EXTENSIONS --------------------
db = SQLAlchemy(app)
mail = Mail(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------- CORS SETUP --------------------
CORS(app, resources={
    r"/*": {  # Allow all routes
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# -------------------- UTILITY FUNCTIONS --------------------
def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_sms(phone_number, otp_code):
    """Send verification SMS with OTP"""
    # Implement SMS sending logic here
    pass

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
    otps = db.relationship('OTP', backref='user', lazy=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_code_expiry = db.Column(db.DateTime, nullable=True)
    _table_args_ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )

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
    description = db.Column(db.Text)
    contribution_amount = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.String(50), nullable=False)  # weekly, monthly, etc.
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    group_code = db.Column(db.String(10), unique=True)  # Add this for group joining
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Group admin
    members = db.relationship('StokvelMember', backref='group', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contribution_amount': float(self.contribution_amount),
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

    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

#------------------------------- Front End KYC --------------------------------
class KYCVerification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    full_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    id_number = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    employment_status = db.Column(db.String(100))
    employer_name = db.Column(db.String(100))
    street_address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    postal_code = db.Column(db.String(10))
    country = db.Column(db.String(100))
    monthly_income = db.Column(db.Float)
    income_source = db.Column(db.String(100))
    employment_type = db.Column(db.String(100))
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(20))
    account_type = db.Column(db.String(50))
    branch_code = db.Column(db.String(10))
    id_document_path = db.Column(db.String(200))
    proof_of_address_path = db.Column(db.String(200))
    proof_of_income_path = db.Column(db.String(200))
    bank_statement_path = db.Column(db.String(200))
    verification_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='kyc_verification', uselist=False)

class BankAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(20))
    account_type = db.Column(db.String(50))
    branch_code = db.Column(db.String(10))
    is_default = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='bank_accounts')

# -------------------- DECORATORS --------------------
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            try:
                token = token.split(' ')[1]  # Remove 'Bearer ' prefix
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user = User.query.get(payload['user_id'])
                
                if not user:
                    return jsonify({'error': 'User not found'}), 401
                
                if user.role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                    
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
                
        return decorated_function
    return decorator

# -------------------- ROUTES --------------------


@app.route('/api/test', methods=['GET'])
def test():
    logger.debug('Test route accessed')
    return jsonify({"message": "Server is working!"}), 200

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers'))
        response.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

    if request.method == 'POST':
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

            # Create new user
            user = User(
                email=email,
                full_name=full_name,
                phone=phone,
                role='member'
            )
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            # Generate and send verification code
            try:
                verification_code = user.generate_verification()
                success, message = send_verification_email(user.email, verification_code)
                if not success:
                    print(f"Warning: Failed to send verification email: {message}")
            except Exception as email_e:
                print(f"Warning: Exception during verification email sending: {str(email_e)}")
                import traceback
                traceback.print_exc()

            return jsonify({
                'message': 'Registration successful. Please check your email for verification code.',
                'email': user.email,
                'user_id': user.id
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

    if user.two_factor_enabled:
        # 2FA logic here
        pass

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
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'name': user.full_name,
        'email': user.email,
        'role': user.role,
        'profilePicture': user.profile_picture
    })

@app.route('/api/admin/groups', methods=['GET'])
@token_required
def get_admin_groups():
    # Your implementation here
    pass

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats():
    # Your implementation here
    pass

@app.route('/api/admin/groups', methods=['POST'])
@token_required
def create_stokvel_group(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        try:
            db.session.commit()
            return jsonify({
                'id': new_group.id,
                'name': new_group.name,
                'description': new_group.description,
                'contribution_amount': new_group.contribution_amount,
                'frequency': new_group.frequency,
                'max_members': new_group.max_members,
                'member_count': 0,
                'created_at': new_group.created_at.isoformat()
            }), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'Database error occurred'}), 500
        
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
    admin = User(
        full_name='Admin User',
        email='admin@example.com',
        phone='1234567890',
        role='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    click.echo('Created admin user.')

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    db.drop_all()
    db.create_all()
    click.echo('Database reset complete.')

@app.cli.command('reset-users')
@with_appcontext
def reset_users():
    """Delete all users and their OTPs from the database"""
    try:
        # Delete all OTPs first
        OTP.query.delete()
        # Then delete all users
        User.query.delete()
        db.session.commit()
        print('All users and OTPs deleted successfully')
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
@token_required
def get_available_groups(current_user):
    try:
        # Get all groups that the user is not a member of
        available_groups = StokvelGroup.query.filter(
            ~StokvelGroup.members.any(user_id=current_user.id)
        ).all()
        
        return jsonify({
            'groups': [{
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'contributionAmount': float(group.contribution_amount),
                'contributionFrequency': group.frequency,
                'memberCount': len(group.members),
                'maxMembers': group.max_members,
                'status': 'active'
            } for group in available_groups]
        })
    except Exception as e:
        print(f"Error fetching available groups: {str(e)}")
        return jsonify({'error': 'Failed to fetch available groups'}), 500

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
            group_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not StokvelGroup.query.filter_by(group_code=group_code).first():
                break

        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            admin_id=current_user.id,
            group_code=group_code
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
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        otp_code = data.get('otp_code')

        if not user_id or not otp_code:
            return jsonify({'error': 'User ID and OTP code are required'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        otp = OTP.query.filter_by(
            user_id=user_id,
            code=otp_code,
            is_used=False
        ).order_by(OTP.created_at.desc()).first()

        if not otp or not otp.is_valid():
            return jsonify({'error': 'Invalid or expired OTP'}), 400

        # Mark OTP as used and verify user
        otp.is_used = True
        user.is_verified = True
        db.session.commit()

        return jsonify({
            'message': 'Account verified successfully',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

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

@app.route('/test-email')
def test_email():
    try:
        msg = Message(
            'Test Email from iStokvel',
            sender=app.config['MAIL_USERNAME'],
            recipients=[app.config['MAIL_USERNAME']]  # Sends to your own email
        )
        msg.body = 'This is a test email from your Flask app. If you receive this, your email configuration is working!'
        mail.send(msg)
        return jsonify({'message': 'Test email sent successfully!'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

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
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'error': 'Email already verified'}), 400
        
        # Generate and send new verification code
        verification_code = user.generate_verification()
        success, message = send_verification_email(user.email, verification_code)
        
        if not success:
            db.session.rollback()
            return jsonify({'error': 'Failed to send verification email: ' + message}), 500
        
        db.session.commit()

        return jsonify({'message': 'New verification code sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    allowed_fields = [
        'full_name', 'phone', 'profile_picture',
        'date_of_birth', 'gender', 'employment_status'
    ]
    for field in allowed_fields:
        if field in data:
            if field == 'date_of_birth' and data[field]:
                setattr(user, field, datetime.strptime(data[field], "%Y-%m-%d").date())
            else:
                setattr(user, field, data[field])
    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500

@app.route('/api/account/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user or not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'})

@app.route('/api/account/enable-2fa', methods=['POST'])
@jwt_required()
def enable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()
    send_verification_email(user.email, otp_code)
    return jsonify({'message': 'OTP sent to your email for 2FA activation'})

@app.route('/api/account/verify-2fa', methods=['POST'])
@jwt_required()
def verify_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    otp_code = data.get('otp_code')

    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    user.two_factor_enabled = True
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication enabled'})

@app.route('/api/account/disable-2fa', methods=['POST'])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    user.two_factor_enabled = False
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication disabled'})

@app.route('/api/account/verify-2fa-login', methods=['POST'])
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

@app.route('/api/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'})

@app.route('/api/account/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    user_id = get_jwt_identity()
    sessions = UserSession.query.filter_by(user_id=user_id, is_active=True).all()
    return jsonify([
        {
            "id": s.id,
            "user_agent": s.user_agent,
            "ip_address": s.ip_address,
            "login_time": s.login_time.isoformat()
        } for s in sessions
    ])

@app.route('/api/account/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    user_id = get_jwt_identity()
    session = UserSession.query.filter_by(id=session_id, user_id=user_id, is_active=True).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    session.is_active = False
    db.session.commit()
    return jsonify({"message": "Session revoked"})

@app.route('/api/notification-settings', methods=['GET'])
@jwt_required()
def get_notification_settings():
    user_id = get_jwt_identity()
    settings = NotificationSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = NotificationSettings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()
        return jsonify({
        "email_announcements": settings.email_announcements,
        "email_stokvel_updates": settings.email_stokvel_updates,
        "email_marketplace_offers": settings.email_marketplace_offers,
        "push_announcements": settings.push_announcements,
        "push_stokvel_updates": settings.push_stokvel_updates,
        "push_marketplace_offers": settings.push_marketplace_offers,
    })

@app.route('/api/notification-settings', methods=['PUT'])
@jwt_required()
def update_notification_settings():
    user_id = get_jwt_identity()
    data = request.get_json()
    settings = NotificationSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = NotificationSettings(user_id=user_id)
        db.session.add(settings)
    for field in [
        "email_announcements", "email_stokvel_updates", "email_marketplace_offers",
        "push_announcements", "push_stokvel_updates", "push_marketplace_offers"
    ]:
        if field in data:
            setattr(settings, field, data[field])
    db.session.commit()
    return jsonify({"message": "Notification settings updated."})

@app.route('/api/privacy-settings', methods=['GET'])
@jwt_required()
def get_privacy_settings():
    user_id = get_jwt_identity()
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.session.add(prefs)
        db.session.commit()
        return jsonify({
        "data_for_personalization": prefs.data_for_personalization,
        "data_for_analytics": prefs.data_for_analytics,
        "data_for_third_parties": prefs.data_for_third_parties,
    })

@app.route('/api/privacy-settings', methods=['PUT'])
@jwt_required()
def update_privacy_settings():
    user_id = get_jwt_identity()
    data = request.get_json()
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.session.add(prefs)
    for field in [
        "data_for_personalization", "data_for_analytics", "data_for_third_parties"
    ]:
        if field in data:
            setattr(prefs, field, data[field])
        db.session.commit()
    return jsonify({"message": "Privacy settings updated."})

@app.route('/api/download-data', methods=['GET'])
@jwt_required()
def download_data():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    # Add more data as needed
    data = {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "created_at": user.created_at.isoformat(),
        },
        "preferences": {
            "language": prefs.language if prefs else None,
            "currency": prefs.currency if prefs else None,
            "theme": prefs.theme if prefs else None,
            "data_for_personalization": prefs.data_for_personalization if prefs else None,
            "data_for_analytics": prefs.data_for_analytics if prefs else None,
            "data_for_third_parties": prefs.data_for_third_parties if prefs else None,
        }
    }
    return jsonify(data)

@app.errorhandler(Exception)
def handle_error(error):
    # Let Flask handle HTTP errors (like 404, 405, etc.) with its default pages
    if isinstance(error, HTTPException):
        return error

    logger.error(f"Unhandled error: {str(error)}")
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
    if isinstance(error, (ExpiredSignatureError, JWTExtendedException)):
        return jsonify({"error": "Token has expired"}), 401
    if isinstance(error, InvalidTokenError):
        return jsonify({"error": "Invalid token"}), 401
    return jsonify({"error": "An unexpected error occurred"}), 500

#------------------------------- Front End KYC --------------------------------
# To store uploaded KYC docs
KYC_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'kyc_docs')
os.makedirs(KYC_UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/kyc/submit', methods=['POST'])
@jwt_required()
def submit_kyc():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get form fields
    data = request.form
    files = request.files

    # Save uploaded files and get their paths
    def save_file(field):
        file = files.get(field)
        if file:
            filename = secure_filename(f"{user_id}_{field}_{file.filename}")
            file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
            file.save(file_path)
            return file_path
        return None

    kyc = KYCVerification(
        user_id=user_id,
        status='pending',
        full_name=data.get('personal.fullName'),
        date_of_birth=data.get('personal.dateOfBirth'),
        id_number=data.get('personal.idNumber'),
        phone=data.get('personal.phone'),
        email=data.get('personal.email'),
        employment_status=data.get('personal.employmentStatus'),
        employer_name=data.get('personal.employerName'),
        street_address=data.get('address.streetAddress'),
        city=data.get('address.city'),
        province=data.get('address.province'),
        postal_code=data.get('address.postalCode'),
        country=data.get('address.country'),
        monthly_income=data.get('income.monthlyIncome'),
        income_source=data.get('income.incomeSource'),
        employment_type=data.get('income.employmentType'),
        bank_name=data.get('bank.bankName'),
        account_number=data.get('bank.accountNumber'),
        account_type=data.get('bank.accountType'),
        branch_code=data.get('bank.branchCode'),
        id_document_path=save_file('documents.idDocument'),
        proof_of_address_path=save_file('documents.proofOfAddress'),
        proof_of_income_path=save_file('documents.proofOfIncome'),
        bank_statement_path=save_file('documents.bankStatement'),
    )

    db.session.add(kyc)
    db.session.commit()

    return jsonify({'message': 'KYC submitted successfully', 'kyc_id': kyc.id}), 201

@app.route('/api/kyc/status', methods=['GET'])
@jwt_required()
def get_kyc_status():
    user_id = get_jwt_identity()
    kyc = KYCVerification.query.filter_by(user_id=user_id).order_by(KYCVerification.created_at.desc()).first()
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


