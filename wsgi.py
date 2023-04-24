from piwaterflow import PiWWWaterflowService
from pathlib import Path
import os


def create_app():

    templates_path = os.path.join(Path(__file__).parent.resolve(), 'templates')
    static_path = os.path.join(Path(__file__).parent.resolve(), 'static')
    wtf_service = PiWWWaterflowService(template_folder=templates_path, static_folder=static_path)
    return wtf_service.getApp()


if __name__ == '__main__':
    templates_path = os.path.join(Path(__file__).parent.resolve(), 'templates')
    static_path = os.path.join(Path(__file__).parent.resolve(), 'static')
    wtf_service = PiWWWaterflowService(template_folder=templates_path, static_folder=static_path)
    wtf_service.socketio.run(wtf_service.app, host='0.0.0.0', port=5000, debug=True)
    # create_app = create_app()
    # create_app.run()
