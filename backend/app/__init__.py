from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .config import Config
from .extensions import db, jwt
from .utils import ApiError


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    app.json.sort_keys = False

    db.init_app(app)
    jwt.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
    )

    from .api.applications import bp as applications_bp
    from .api.auth import bp as auth_bp
    from .api.interviews import bp as interviews_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(interviews_bp)

    register_error_handlers(app)
    register_jwt_handlers()
    register_commands(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        payload = {"message": error.message}
        if error.errors:
            payload["errors"] = error.errors
        return jsonify(payload), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        if request.path.startswith("/api"):
            return jsonify({"message": error.description}), error.code
        return error


def register_jwt_handlers():
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Authentication required."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": "Invalid access token."}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"message": "Your session has expired. Please sign in again."}), 401


def register_commands(app):
    import click

    @app.cli.command("init-db")
    def init_db():
        """Create all database tables."""
        db.create_all()
        click.echo("Database tables created.")

    @app.cli.command("seed-db")
    def seed_db():
        """Load the demo account and sample applications."""
        from .seed import seed

        db.create_all()
        seed()
        click.echo("Demo data loaded.")
