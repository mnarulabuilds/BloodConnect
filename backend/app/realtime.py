import socketio

_sio: socketio.AsyncServer | None = None


def set_socket_server(server: socketio.AsyncServer) -> None:
    global _sio
    _sio = server


def get_socket_server() -> socketio.AsyncServer | None:
    return _sio
