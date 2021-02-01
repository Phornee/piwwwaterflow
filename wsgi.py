from piwaterflow import PiWWWaterflowService
from pathlib import Path

def create_app():
    current_path = "{}/templates".format(Path().absolute())
    flask_app = PiWWWaterflowService(template_folder=current_path)
    return flask_app

if __name__ == '__main__':
    create_app = create_app()
    create_app.run()
else:
    gunicorn_app = create_app()
