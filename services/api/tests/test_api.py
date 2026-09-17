from fastapi.testclient import TestClient

from agrirakshak_api.main import app, runtime


def test_liveness_does_not_require_model() -> None:
    with TestClient(app) as client:
        response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_explains_missing_model() -> None:
    with TestClient(app) as client:
        runtime.bundle = None
        response = client.get("/health/ready")
    assert response.status_code == 503
    assert response.json()["detail"] == "The evaluated model bundle has not been installed."


def test_prediction_refuses_to_fake_result_without_model() -> None:
    with TestClient(app) as client:
        runtime.bundle = None
        response = client.post(
            "/v1/predict",
            files={"image": ("leaf.jpg", b"not-an-image", "image/jpeg")},
        )
    assert response.status_code == 503

