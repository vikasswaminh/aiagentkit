"""Control plane server entrypoint."""

import sys

from agent_platform.control_plane.server import serve


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 50051
    serve(port=port)


if __name__ == "__main__":
    main()
