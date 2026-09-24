from app.socketio_events import create_socket_server, register_socket_events


def test_socket_server_registers_events():
    sio = create_socket_server()
    register_socket_events(sio)
    assert sio is not None
