from __future__ import annotations

from .gui import DeployGui


def main() -> None:
    app = DeployGui()
    app.mainloop()


if __name__ == "__main__":
    main()

