from piwaterflow import app
from pathlib import Path

if __name__ == "__main__":
    wsgi_path = Path(__file__).parent
    app.template_folder = "{}/templates".format(wsgi_path)
    app.static_folder = "{}/static".format(wsgi_path)
    app.run()
