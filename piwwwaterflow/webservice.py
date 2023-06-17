""" Webservice to control and manage the piwaterflow loop """
from datetime import datetime

from flask import Flask, render_template, request
from flask_compress import Compress
from flask_socketio import SocketIO
from importlib_metadata import version, PackageNotFoundError

from piwaterflow import Waterflow
from log_mgr import Logger, LoggerMode
from revproxy_auth import RevProxyAuth


class PiWWWaterflowService:
    """Class for the web service... its an interface to the real functionality in piwaterflow package.
    """
    def __init__(self,  template_folder, static_folder):

        self.logger = Logger(self.class_name(), log_file_name='piwwwaterflow', mode=LoggerMode.BOTH, dry_run=False)
        self.logger.info("Launching piwwwaterflow...")
        self.waterflow = Waterflow()

        self.app = Flask(__name__,  template_folder=template_folder, static_folder=static_folder)

        self.revproxy_auth = RevProxyAuth(self.app, root_class='piwwwaterflow')

        self.app.add_url_rule('/', 'index', self.waterflow_endpoint, methods=['GET', 'POST'])
        Compress(self.app)
        self.socketio = SocketIO(self.app, cors_allowed_origins='*')
        self.socketio.on_event('service_request', self.on_service_request)
        self.socketio.on_event('force', self.on_force)
        self.socketio.on_event('stop', self.on_stop)
        self.socketio.on_event('save', self.on_save)

    @classmethod
    def class_name(cls):
        """ class name """
        return "piwwwaterflow"

    def get_app(self):
        """ Returns WSGI app
        Returns:
            WSGI app:
        """
        return self.app

    def run(self):
        """ Run function """
        # self.app.run()
        self.socketio.run(self.app)

    def waterflow_endpoint(self):
        """ Main endpoint that returns the main page for piwaterflow
        Returns:
            response: The main html content
        """
        return self.revproxy_auth.get_auth_response(request, lambda : render_template('form.html'))

    def on_service_request(self) -> dict:
        """ Gets all the information from the waterflow service
        Args:
            data (dict):'first_time': This value is only bypassed to the caller
        Returns:
            dict:Dictionary with all the information about the status of the waterflow system
        """
        self.logger.info('Service requested...')
        try:
            ver_backend = version('piwaterflow')
            ver_frontend = version('piwwwwaterflow')
        except PackageNotFoundError:
            ver_backend = '?.?.?'
            ver_frontend = '?.?.?'

        responsedict = None

        try:
            responsedict = {'log': self.waterflow.get_log(),
                            'forced': self.waterflow.get_forced_info(),
                            'stop': self.waterflow.stop_requested(),
                            'config': self._get_public_config(),
                            'lastlooptime': self.waterflow.last_loop_time().strftime('%Y-%m-%dT%H:%M:%S'),
                            'version_backend': ver_backend,
                            'version_frontend': ver_frontend
                            }
            # Change to string so that javascript can manage with it
            for program in responsedict['config']['programs']:
                program['start_time'] = program['start_time'].strftime('%H:%M')
        except Exception as ex:
            self.logger.error('Error calculating service request: %s', ex)
            raise RuntimeError(f'Exception on service request: {ex}') from ex

        return responsedict

    def on_force(self, data: dict):
        """ On force action request
        Args:
            data (dict): 'type': Must be 'valve' or 'program'
                         'value': Must be the index of the program or value to be forced
        """
        print(f'Force requested... {data}')
        type_force = data['type']
        value_force = data['value']
        self.waterflow.force(type_force, value_force)

    def on_stop(self):
        """ Event to stop current operation """
        print('Stop requested...')
        self.waterflow.stop()

    def on_save(self, data):
        """ Event to save the changes in the watering system schedulling
        Args:
            data (dict): Information about the required schedulling
        Returns:
            bool: If everything went ok
        """
        parsed_config = self.waterflow.config.get_dict_copy()
        for program, update in zip(parsed_config['programs'], data):
            self._change_program(program, update)

        self.waterflow.update_config(programs=parsed_config['programs'])
        return True

    def _get_public_config(self):
        config = self.waterflow.config.get_dict_copy()
        del config['influxdbconn']
        return config

    def _change_program(self, program, new_program):
        inputbox_text = new_program['time']
        time1 = datetime.strptime(inputbox_text, '%H:%M')
        new_datetime = program['start_time'].replace(hour=time1.hour, minute=time1.minute)
        program['start_time'] = new_datetime
        program['valves'][0] = new_program['valves'][0]
        program['valves'][1] = new_program['valves'][1]
        program['enabled'] = new_program['enabled']
