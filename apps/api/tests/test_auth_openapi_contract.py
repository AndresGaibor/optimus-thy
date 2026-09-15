from typing import Any

from optimus_thy.main import create_app


def _schema() -> dict[str, Any]:
    return create_app().openapi()


def test_auth_paths_document_success_and_unauthorized_responses() -> None:
    schema = _schema()
    paths = schema["paths"]

    assert {"200", "401"} <= set(paths["/auth/login"]["post"]["responses"])
    assert {"200", "401"} <= set(paths["/auth/me"]["get"]["responses"])
    assert {"204", "401"} <= set(paths["/auth/logout"]["post"]["responses"])


def test_session_cookie_is_an_openapi_security_scheme() -> None:
    schema = _schema()
    session_cookie = schema["components"]["securitySchemes"]["SessionCookie"]

    assert session_cookie["type"] == "apiKey"
    assert session_cookie["in"] == "cookie"
    assert session_cookie["name"] == "optimus_thy_session"
    assert {"SessionCookie": []} in schema["paths"]["/auth/me"]["get"]["security"]
    assert {"SessionCookie": []} in schema["paths"]["/auth/logout"]["post"]["security"]


def test_public_auth_schema_excludes_session_and_password_hash() -> None:
    schema = _schema()
    auth_user = schema["components"]["schemas"]["AuthUserResponse"]
    properties = set(auth_user["properties"])

    assert properties == {"id", "email", "display_name", "role"}
    assert "session_token" not in properties
    assert "password_hash" not in properties

    login_request = schema["components"]["schemas"]["LoginRequest"]
    assert set(login_request["properties"]) == {"email", "password"}
