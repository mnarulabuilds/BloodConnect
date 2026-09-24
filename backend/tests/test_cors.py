from app.cors import is_dev_origin


def test_dev_origin_regex():
    assert is_dev_origin("http://localhost:8081")
    assert is_dev_origin("http://127.0.0.1:8081")
    assert is_dev_origin("http://192.168.1.42:8081")
    assert not is_dev_origin("https://evil.example.com")
