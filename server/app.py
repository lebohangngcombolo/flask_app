from flask import Flask, request, jsonify
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
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import SQLAlchemyError

# Load environment variables
load_dotenv()

# Config
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    role = db.Column(db.String(50), nullable=False, default='member')
    profile_picture = db.Column(db.String(255))
    __table_args__ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )

class StokvelGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    contribution_amount = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.String(50), nullable=False)  # weekly, monthly, etc.
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    members = db.relationship('StokvelMember', backref='group', lazy=True)

class StokvelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
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
    email_notifications = db.Column(db.Boolean, default=True)
    sms_notifications = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='notification_settings')

class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    language = db.Column(db.String(10), default='en')
    currency = db.Column(db.String(3), default='ZAR')
    theme = db.Column(db.String(10), default='light')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='preferences')

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

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
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

        # Create new user
    hashed_pw = generate_password_hash(password)
        new_user = User(
            full_name=full_name,
            phone=phone,
            email=email,
            password=hashed_pw,
            role='member'
        )
        db.session.add(new_user)
        db.session.commit()

        # Initialize user's default data
        try:
            # Create default wallet balance
            wallet = Wallet(
                user_id=new_user.id,
                balance=0.00
            )
            db.session.add(wallet)

            # Create default notification settings
            notification_settings = NotificationSettings(
                user_id=new_user.id,
                email_notifications=True,
                sms_notifications=True
            )
            db.session.add(notification_settings)

            # Create default user preferences
            user_preferences = UserPreferences(
                user_id=new_user.id,
                language='en',
                currency='ZAR',
                theme='light'
            )
            db.session.add(user_preferences)

    db.session.commit()

            return jsonify({
                'message': 'User registered successfully',
                'user': {
                    'id': new_user.id,
                    'email': new_user.email,
                    'name': new_user.full_name,
                    'role': new_user.role
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error initializing user data: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 401

        if not check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid password'}), 401

        # Generate token
    token = jwt.encode({
        'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

        # Get user's data
        user_data = {
            'id': user.id,
            'email': user.email,
            'name': user.full_name,
            'role': user.role,
            'profilePicture': user.profile_picture,
            'created_at': user.created_at.isoformat()
        }

        return jsonify({
            'token': token,
            'user': user_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    try:
    return jsonify({
        'id': current_user.id,
            'name': current_user.full_name,
        'email': current_user.email,
            'role': current_user.role,
            'profilePicture': current_user.profile_picture
        })
    except Exception as e:
        print(f"Error fetching user data: {str(e)}")
        return jsonify({'error': 'Failed to fetch user data'}), 500

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
            created_by=current_user.id
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
        password=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()
    click.echo('Created admin user.')

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    db.drop_all()
    db.create_all()
    click.echo('Database reset complete.')

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
        # Get user's active groups count
        active_groups_count = StokvelMember.query.filter_by(
            user_id=current_user.id,
            status='active'
        ).count()

        # Get total contributions by the user
        total_contributions = db.session.query(func.sum(Contribution.amount)) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .scalar() or 0.0

        # Get recent contributions (transactions)
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

        # Format monthly contributions for frontend
        monthly_summary = [{'month': row.month, 'total': float(row.total)} for row in monthly_contributions]

        # Get wallet balance (with error handling)
        try:
            wallet_balance = current_user.wallet[0].balance if current_user.wallet else 0.0
        except (AttributeError, IndexError):
            wallet_balance = 0.0
            print(f"Warning: User {current_user.id} has no wallet or wallet relationship is misconfigured.")

        return jsonify({
            'walletBalance': float(wallet_balance),
            'activeGroupsCount': active_groups_count,
            'totalContributions': float(total_contributions),
            'recentTransactions': [{
                'id': t.id,
                'amount': float(t.amount),
                'date': t.date.isoformat(),
                'type': 'deposit',
                'description': f'Contribution to {t.member.group.name}' if t.member and t.member.group else 'Contribution'
            } for t in recent_transactions],
            'monthlySummary': monthly_summary
        })

    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

def validate_email(email):
    # Add email validation
    pass

def validate_phone(phone):
    # Add phone validation
    pass

# Run
if __name__ == '__main__':
    app.run(debug=True, port=5000)
