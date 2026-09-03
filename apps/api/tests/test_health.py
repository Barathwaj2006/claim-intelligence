def test_health_check_endpoint(client):
    """Test that /api/v1/health responds with 200 OK and database connected."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "version" in data
    assert "timestamp" in data


def test_root_endpoint(client):
    """Test that / responds with project info and docs links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "docs" in data
