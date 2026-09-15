from pydantic import SecretStr

from optimus_thy.config.settings import Settings


def test_object_storage_settings_are_vendor_neutral() -> None:
    settings = Settings(
        s3_endpoint="http://localhost:9000",
        s3_bucket="optimus-thy",
        s3_access_key="LOCALACCESS",
        s3_secret_key=SecretStr("local-secret"),
    )

    assert settings.s3_endpoint == "http://localhost:9000"
    assert settings.s3_bucket == "optimus-thy"
    assert settings.s3_access_key == "LOCALACCESS"
    assert settings.s3_secret_key is not None
    assert settings.s3_secret_key.get_secret_value() == "local-secret"
