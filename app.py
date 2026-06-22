import os
import secrets
import string
from datetime import date, datetime
from functools import wraps

from flask import Flask, abort, flash, redirect, render_template, request, session, url_for
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import CheckConstraint, Index, and_, func
from werkzeug.security import check_password_hash, generate_password_hash


db = SQLAlchemy()


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(5), unique=True, nullable=False, index=True)
    guest_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(40))
    arrival_date = db.Column(db.Date, nullable=False)
    departure_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    guest_token_version = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    __table_args__ = (
        CheckConstraint("departure_date >= arrival_date", name="valid_booking_dates"),
        CheckConstraint(
            "status IN ('pending','approved','declined','cancelled')",
            name="valid_booking_status",
        ),
        Index("ix_booking_active_dates", "status", "arrival_date", "departure_date"),
    )


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class AuditEvent(db.Model):
    __tablename__ = "audit_events"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=True)
    event_type = db.Column(db.String(60), nullable=False)
    actor = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
        SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///summitct.db").replace(
            "postgres://", "postgresql://", 1
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("FLASK_ENV") == "production",
        PERMANENT_SESSION_LIFETIME=3600,
        ADMIN_USERNAME=os.environ.get("ADMIN_USERNAME", "campbell.hatchard@gmail.com"),
        ADMIN_PASSWORD=os.environ.get("ADMIN_PASSWORD", "change-me-before-use"),
        TOKEN_MAX_AGE=int(os.environ.get("TOKEN_MAX_AGE", "31536000")),
    )

    db.init_app(app)

    with app.app_context():
        db.create_all()
        ensure_admin(app)

    register_routes(app)
    return app


def ensure_admin(app: Flask) -> None:
    username = app.config["ADMIN_USERNAME"].strip().lower()
    password = app.config["ADMIN_PASSWORD"]
    admin = AdminUser.query.filter(func.lower(AdminUser.username) == username).first()
    if admin is None:
        db.session.add(
            AdminUser(username=username, password_hash=generate_password_hash(password))
        )
        db.session.commit()


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin_user_id"):
            return redirect(url_for("admin_login", next=request.path))
        return view(*args, **kwargs)

    return wrapped


def serializer(app: Flask) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(app.config["SECRET_KEY"], salt="summitct-booking")


def guest_token(app: Flask, booking: Booking) -> str:
    return serializer(app).dumps(
        {"booking_id": booking.id, "version": booking.guest_token_version}
    )


def resolve_guest_token(app: Flask, token: str) -> Booking:
    try:
        payload = serializer(app).loads(
            token, max_age=app.config["TOKEN_MAX_AGE"]
        )
    except SignatureExpired:
        abort(410)
    except BadSignature:
        abort(404)

    booking = db.session.get(Booking, payload.get("booking_id"))
    if booking is None or booking.guest_token_version != payload.get("version"):
        abort(404)
    return booking


def create_reference() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        reference = "".join(secrets.choice(alphabet) for _ in range(5))
        if not Booking.query.filter_by(reference=reference).first():
            return reference


def has_overlap(arrival: date, departure: date, exclude_id: int | None = None) -> bool:
    query = Booking.query.filter(
        Booking.status.in_(["pending", "approved"]),
        Booking.arrival_date <= departure,
        Booking.departure_date >= arrival,
    )
    if exclude_id is not None:
        query = query.filter(Booking.id != exclude_id)
    return db.session.query(query.exists()).scalar()


def pending_exists(exclude_id: int | None = None) -> bool:
    query = Booking.query.filter_by(status="pending")
    if exclude_id is not None:
        query = query.filter(Booking.id != exclude_id)
    return db.session.query(query.exists()).scalar()


def audit(event_type: str, actor: str, booking: Booking | None = None, details: str = ""):
    db.session.add(
        AuditEvent(
            booking_id=booking.id if booking else None,
            event_type=event_type,
            actor=actor,
            details=details,
        )
    )


def register_routes(app: Flask) -> None:
    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    @app.get("/")
    def home():
        approved = Booking.query.filter(
            Booking.status == "approved", Booking.departure_date >= date.today()
        ).order_by(Booking.arrival_date).all()
        return render_template("home.html", approved=approved)

    @app.route("/request", methods=["GET", "POST"])
    def request_booking():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip()
            phone = request.form.get("phone", "").strip()
            arrival_raw = request.form.get("arrival_date", "")
            departure_raw = request.form.get("departure_date", "")

            try:
                arrival = date.fromisoformat(arrival_raw)
                departure = date.fromisoformat(departure_raw)
            except ValueError:
                flash("Please enter valid dates.", "danger")
                return render_template("request_booking.html")

            if not name:
                flash("Name is required.", "danger")
            elif arrival < date.today():
                flash("Arrival cannot be in the past.", "danger")
            elif departure < arrival:
                flash("Departure must be on or after arrival.", "danger")
            elif pending_exists():
                flash(
                    "Another request is currently awaiting review. Please try again later.",
                    "warning",
                )
            elif has_overlap(arrival, departure):
                flash("Those dates are unavailable.", "warning")
            else:
                booking = Booking(
                    reference=create_reference(),
                    guest_name=name,
                    email=email or None,
                    phone=phone or None,
                    arrival_date=arrival,
                    departure_date=departure,
                    status="pending",
                )
                db.session.add(booking)
                db.session.flush()
                audit("booking_requested", name, booking)
                db.session.commit()
                token = guest_token(app, booking)
                return render_template(
                    "request_success.html", booking=booking, token=token
                )

        return render_template("request_booking.html")

    @app.route("/find", methods=["GET", "POST"])
    def find_booking():
        if request.method == "POST":
            reference = request.form.get("reference", "").strip().upper()
            booking = Booking.query.filter_by(reference=reference).first()
            if booking is None:
                flash("Booking not found.", "danger")
            else:
                return redirect(
                    url_for("manage_booking", token=guest_token(app, booking))
                )
        return render_template("find_booking.html")

    @app.route("/booking/<token>", methods=["GET", "POST"])
    def manage_booking(token: str):
        booking = resolve_guest_token(app, token)

        if request.method == "POST":
            action = request.form.get("action")
            if action == "cancel" and booking.status in {"pending", "approved"}:
                booking.status = "cancelled"
                booking.guest_token_version += 1
                audit("booking_cancelled", booking.guest_name, booking)
                db.session.commit()
                flash("Your booking has been cancelled.", "success")
                return redirect(url_for("home"))

            if action == "change" and booking.status in {"pending", "approved"}:
                try:
                    arrival = date.fromisoformat(request.form.get("arrival_date", ""))
                    departure = date.fromisoformat(request.form.get("departure_date", ""))
                except ValueError:
                    flash("Please enter valid dates.", "danger")
                    return render_template("manage_booking.html", booking=booking, token=token)

                if arrival < date.today() or departure < arrival:
                    flash("The requested date range is invalid.", "danger")
                elif pending_exists(exclude_id=booking.id):
                    flash("Another request is currently awaiting review.", "warning")
                elif has_overlap(arrival, departure, exclude_id=booking.id):
                    flash("Those dates are unavailable.", "warning")
                else:
                    booking.arrival_date = arrival
                    booking.departure_date = departure
                    booking.status = "pending"
                    audit("booking_changed", booking.guest_name, booking)
                    db.session.commit()
                    flash("Your change request is awaiting approval.", "success")
                    return redirect(url_for("manage_booking", token=token))

        return render_template("manage_booking.html", booking=booking, token=token)

    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        if request.method == "POST":
            username = request.form.get("username", "").strip().lower()
            password = request.form.get("password", "")
            admin = AdminUser.query.filter(func.lower(AdminUser.username) == username).first()
            if admin and check_password_hash(admin.password_hash, password):
                session.clear()
                session["admin_user_id"] = admin.id
                session.permanent = True
                audit("admin_login", admin.username)
                db.session.commit()
                return redirect(request.args.get("next") or url_for("admin_dashboard"))
            flash("Incorrect username or password.", "danger")
        return render_template(
            "admin_login.html", default_username=app.config["ADMIN_USERNAME"]
        )

    @app.post("/admin/logout")
    @admin_required
    def admin_logout():
        session.clear()
        return redirect(url_for("home"))

    @app.get("/admin")
    @admin_required
    def admin_dashboard():
        bookings = Booking.query.order_by(Booking.arrival_date.desc()).all()
        return render_template("admin_dashboard.html", bookings=bookings)

    @app.post("/admin/booking/<int:booking_id>/<action>")
    @admin_required
    def admin_booking_action(booking_id: int, action: str):
        booking = db.session.get(Booking, booking_id)
        if booking is None:
            abort(404)

        if action == "approve" and booking.status == "pending":
            if has_overlap(booking.arrival_date, booking.departure_date, booking.id):
                flash("The dates now conflict with another active booking.", "danger")
            else:
                booking.status = "approved"
                audit("booking_approved", "admin", booking)
                db.session.commit()
                flash("Booking approved.", "success")
        elif action == "decline" and booking.status == "pending":
            booking.status = "declined"
            booking.guest_token_version += 1
            audit("booking_declined", "admin", booking)
            db.session.commit()
            flash("Booking declined.", "info")
        elif action == "cancel" and booking.status in {"pending", "approved"}:
            booking.status = "cancelled"
            booking.guest_token_version += 1
            audit("booking_cancelled_by_admin", "admin", booking)
            db.session.commit()
            flash("Booking cancelled.", "info")
        else:
            flash("That action is not available.", "warning")

        return redirect(url_for("admin_dashboard"))


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
