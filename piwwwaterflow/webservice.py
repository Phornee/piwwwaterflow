""" Webservice to control and manage the piwaterflow loop """
from datetime import datetime

from flask import Flask, render_template
from flask_compress import Compress
from flask_socketio import SocketIO
from importlib_metadata import version, PackageNotFoundError

from piwaterflow import Waterflow


class PiWWWaterflowService:
    """Class for the web service... its an interface to the real functionality in piwaterflow package.
    """
    def __init__(self,  template_folder, static_folder):
        self.waterflow = Waterflow()

        self.app = Flask(__name__,  template_folder=template_folder, static_folder=static_folder)
        self.app.add_url_rule('/', 'index', self.waterflow_endpoint, methods=['GET'])
        Compress(self.app)
        self.socketio = SocketIO(self.app)
        self.socketio.on_event('service_request', self.on_service_request)
        self.socketio.on_event('force', self.on_force)
        self.socketio.on_event('stop', self.on_stop)
        self.socketio.on_event('save', self.on_save)

    def get_app(self):
        return self.app

    def get_socket_app(self):
        return self.socketio

    def run(self):
        # self.app.run()
        self.socketio.run(self.app)

    def waterflow_endpoint(self):
        """ Main endpoint that returns the main page for piwaterflow
        Returns:
            response: The main html content
        """
        return render_template('form.html')


    def _get_public_config(self):
        config = self.waterflow.config.get_dict_copy()
        del config['influxdbconn']
        return config

    def on_service_request(self) -> dict:
        """ Gets all the information from the waterflow service
        Args:
            data (dict):'first_time': This value is only bypassed to the caller
        Returns:
            dict:Dictionary with all the information about the status of the waterflow system
        """
        print('Service requested...')
        try:
            ver = version('piwaterflow')
        except PackageNotFoundError:
            ver = '?.?.?'

        responsedict = {'log': self.waterflow.get_log(),
                        'forced': self.waterflow.get_forced_info(),
                        'stop': self.waterflow.stop_requested(),
                        'config': self._get_public_config(),
                        'lastlooptime': self.waterflow.last_loop_time().strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'version': ver
                        }
        # Change to string so that javascript can manage with it
        for program in responsedict['config']['programs'].values():
            program['start_time'] = program['start_time'].strftime('%H:%M')
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
        self.waterflow.force(type_force, int(value_force))

    def on_stop(self, data):
        print('Stop requested...')
        self.waterflow.stop()

    def _changeProgram(self, program, new_program):
        inputbox_text = new_program['time']
        time1 = datetime.strptime(inputbox_text, '%H:%M')
        new_datetime = program['start_time'].replace(hour=time1.hour, minute=time1.minute)
        program['start_time'] = new_datetime
        program['valves_times']['valve1'] = new_program['valve1']
        program['valves_times']['valve2'] = new_program['valve2']
        program['enabled'] = new_program['enabled'] is not None

    def on_save(self, data):
        """ Event to save the changes in the watering system schedulling
        Args:
            data (dict): Information about the required schedulling
        Returns:
            _type_: _description_
        """
        parsed_config = self.waterflow.config.get_dict_copy()
        self._changeProgram(parsed_config['programs']['first'], data['prog1'])
        self._changeProgram(parsed_config['programs']['second'], data['prog2'])

        self.waterflow.update_config(programs=parsed_config['programs'])
        return True
