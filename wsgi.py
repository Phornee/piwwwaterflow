from piwaterflow import PiWWWaterflowService
from pathlib import Path

if __name__ == "__main__":
    current_path = "{}/templates".format(Path().absolute())
    flask_app = PiWWWaterflowService(template_folder=current_path)
    flask_app.run()
