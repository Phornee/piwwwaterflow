""" WSGI entry point """
from pathlib import Path
import os

from piwwwaterflow import PiWWWaterflowService

def _create_service():
    """ Instantiation of the webservice
    Returns:
       Webservice class instantiated
    """
    templates_path = os.path.join(Path(__file__).parent.resolve(), 'templates')
    static_path = os.path.join(Path(__file__).parent.resolve(), 'static')
    return PiWWWaterflowService(template_folder=templates_path, static_folder=static_path)

def create_app():
    """ Creates a WSGI standard callable function
    Returns:
        WSGI app provided by the PiWWWaterflowService/Flask
    """
    wtf_service = _create_service()
    return wtf_service.get_app()

# __main__ used for standalone execution (debugging). For WSGI call, the "wsgi:create_app()" function should be called
if __name__ == '__main__':
    service = create_app()
    service.run()
