import os
import sqlite3
import secrets
import string
from datetime import datetime, date

from flask import Flask, g, render_template, request, redirect, url_for, flash, session

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "replace-this-secret")
DATABASE = os.environ.get(
    "DATABASE_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db"),
)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "campbell.hatchard@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "change-me-before-use")


def get_db() -> sqlite3.Connection:
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception: Exception | None):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def init_db() -> None:
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()


def generate_ref_code(length: int = 5) -> str:
    chars = string.ascii_uppercase + string.digits
    conn = get_db()
    while True:
        code = "".join(secrets.choice(chars) for _ in range(length))
        if conn.execute("SELECT id FROM bookings WHERE ref_code = ?", (code,)).fetchone() is None:
            return code


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def overlap_exists(start: date, end: date, exclude_id: int | None = None) -> bool:
    conn = get_db()
    params: list = [end.isoformat(), start.isoformat()]
    sql = (
        "SELECT id FROM bookings "
        "WHERE status IN ('approved', 'pending') "
        "AND start_date <= ? AND end_date >= ?"
    )
    if exclude_id is not None:
        sql += " AND id != ?"
        params.append(exclude_id)
    return conn.execute(sql, params).fetchone() is not None


def get_booking_by_code(code: str) -> sqlite3.Row | None:
    return get_db().execute(
        "SELECT * FROM bookings WHERE upper(ref_code) = upper(?)", (code,)
    ).fetchone()


with app.app_context():
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    init_db()


@app.route("/")
def index():
    rows = get_db().execute(
        "SELECT start_date, end_date FROM bookings WHERE status = 'approved' ORDER BY start_date"
    ).fetchall()
    busy_ranges = [(r["start_date"], r["end_date"]) for r in rows]
    return render_template("index.html", busy_ranges=busy_ranges)


@app.route("/request", methods=["GET", "POST"])
def request_booking():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        start_str = request.form.get("start_date", "").strip()
        end_str = request.form.get("end_date", "").strip()

        if not name:
            flash("Please provide your name.", "error")
            return render_template("request.html", name=name, email=email, phone=phone)
        if not start_str or not end_str:
            flash("Please provide both start and end dates.", "error")
            return render_template("request.html", name=name, email=email, phone=phone)

        try:
            start_date_obj = parse_date(start_str)
            end_date_obj = parse_date(end_str)
        except ValueError:
            flash("Invalid date format.", "error")
            return render_template("request.html", name=name, email=email, phone=phone)

        if start_date_obj < date.today():
            flash("The start date cannot be in the past.", "error")
            return render_template("request.html", name=name, email=email, phone=phone)
        if end_date_obj < start_date_obj:
            flash("End date must be on or after the start date.", "error")
            return render_template("request.html", name=name, email=email, phone=phone)

        conn = get_db()
        pending_count = conn.execute(
            "SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"
        ).fetchone()["count"]
        if pending_count > 0:
            return render_template("pending_limit.html")

        if overlap_exists(start_date_obj, end_date_obj):
            return render_template("request_unavailable.html", start=start_str, end=end_str)

        ref_code = generate_ref_code()
        conn.execute(
            "INSERT INTO bookings (ref_code, name, email, phone, start_date, end_date, status) "
            "VALUES (?, ?, ?, ?, ?, ?, 'pending')",
            (ref_code, name, email, phone, start_str, end_str),
        )
        conn.commit()
        return render_template("request_success.html", ref_code=ref_code)

    return render_template("request.html")


@app.route("/search", methods=["GET", "POST"])
def search_booking():
    if request.method == "POST":
        code = request.form.get("ref_code", "").strip().upper()
        if not code:
            flash("Please enter your booking reference.", "error")
            return render_template("search.html")
        return redirect(url_for("view_booking", ref_code=code))
    return render_template("search.html")


@app.route("/booking/<ref_code>", methods=["GET", "POST"])
def view_booking(ref_code: str):
    booking = get_booking_by_code(ref_code)
    if booking is None:
        return render_template("booking_not_found.html", ref_code=ref_code)

    if request.method == "POST":
        action = request.form.get("action")
        if action == "cancel":
            if booking["status"] in ("cancelled", "declined"):
                flash("This booking is already inactive.", "info")
            else:
                get_db().execute(
                    "UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (booking["id"],),
                )
                get_db().commit()
                flash("Your booking has been cancelled.", "success")
            booking = get_booking_by_code(ref_code)

        elif action == "update":
            new_start = request.form.get("new_start_date", "").strip()
            new_end = request.form.get("new_end_date", "").strip()
            try:
                new_start_obj = parse_date(new_start)
                new_end_obj = parse_date(new_end)
            except ValueError:
                flash("Invalid date format.", "error")
                return render_template("booking_detail.html", booking=booking)

            if new_start_obj < date.today():
                flash("The start date cannot be in the past.", "error")
                return render_template("booking_detail.html", booking=booking)
            if new_end_obj < new_start_obj:
                flash("End date must be on or after the start date.", "error")
                return render_template("booking_detail.html", booking=booking)
            if overlap_exists(new_start_obj, new_end_obj, exclude_id=booking["id"]):
                flash("Those dates are not available.", "error")
                return render_template("booking_detail.html", booking=booking)

            get_db().execute(
                "UPDATE bookings SET start_date = ?, end_date = ?, status = 'pending', "
                "updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (new_start, new_end, booking["id"]),
            )
            get_db().commit()
            flash("Your booking dates have been updated and are awaiting approval.", "success")
            booking = get_booking_by_code(ref_code)

    return render_template("booking_detail.html", booking=booking)


def admin_required() -> bool:
    return bool(session.get("admin"))


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if username == ADMIN_USERNAME and secrets.compare_digest(password, ADMIN_PASSWORD):
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        flash("Incorrect username or password.", "error")
    return render_template("admin_login.html", default_username=ADMIN_USERNAME)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("index"))


@app.route("/admin")
def admin_dashboard():
    if not admin_required():
        return redirect(url_for("admin_login"))
    bookings = get_db().execute("SELECT * FROM bookings ORDER BY start_date").fetchall()
    return render_template(
        "admin_dashboard.html", bookings=bookings, ADMIN_USERNAME=ADMIN_USERNAME
    )


@app.route("/admin/approve/<int:booking_id>", methods=["POST"])
def admin_approve(booking_id: int):
    if not admin_required():
        return redirect(url_for("admin_login"))
    get_db().execute(
        "UPDATE bookings SET status = 'approved', updated_at = CURRENT_TIMESTAMP "
        "WHERE id = ? AND status = 'pending'",
        (booking_id,),
    )
    get_db().commit()
    flash("Booking approved.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/decline/<int:booking_id>", methods=["POST"])
def admin_decline(booking_id: int):
    if not admin_required():
        return redirect(url_for("admin_login"))
    get_db().execute(
        "UPDATE bookings SET status = 'declined', updated_at = CURRENT_TIMESTAMP "
        "WHERE id = ? AND status = 'pending'",
        (booking_id,),
    )
    get_db().commit()
    flash("Booking declined.", "info")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/cancel/<int:booking_id>", methods=["POST"])
def admin_cancel(booking_id: int):
    if not admin_required():
        return redirect(url_for("admin_login"))
    get_db().execute(
        "UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (booking_id,),
    )
    get_db().commit()
    flash("Booking cancelled.", "info")
    return redirect(url_for("admin_dashboard"))


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
