from piwaterflow import PiWWWaterflowService
from pathlib import Path

def create_app():
    current_path = "{}/templates".format(Path().absolute())
    wtf_service = PiWWWaterflowService(template_folder=current_path)
    return wtf_service.getApp()

# if __name__ == '__main__':
#     create_app = create_app()
#     create_app.run()
# else:
#     gunicorn_app = create_app()
