""" Webservice to control and manage the piwaterflow loop """
from datetime import datetime
import os
import re
import json
from pathlib import Path
from flask import Flask, render_template, request, make_response
from flask_compress import Compress

from piwaterflow import Waterflow
from log_mgr import Logger, LoggerMode
from revproxy_auth import RevProxyAuth


class PiWWWaterflowService:
    """Class for the web service... its an interface to the real functionality in piwaterflow package.
    """
    def __init__(self,  template_folder, static_folder):

        self.logger = Logger(self.class_name(), log_file_name='piwwwaterflow', mode=LoggerMode.BOTH, dry_run=False)
        self.logger.info("Launching piwwwaterflow...")

        self.app = Flask(__name__,  template_folder=template_folder, static_folder=static_folder)

        self.revproxy_auth = RevProxyAuth(self.app, root_class='piwwwaterflow')

        self.app.add_url_rule('/', 'waterflow', self.waterflow_endpoint, methods=['GET', 'POST'])

        self.app.add_url_rule('/service', 'service', self.on_service_request, methods=['GET'])
        self.app.add_url_rule('/force', 'force', self.on_force, methods=['GET', 'POST'])
        self.app.add_url_rule('/stop', 'stop', self.on_stop, methods=['GET', 'POST'])
        self.app.add_url_rule('/save', 'save', self.on_save, methods=['POST'])

        Compress(self.app)

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
        self.app.run()

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

        if not self.revproxy_auth.session_token_valid(request):
            self.logger.info('Credentials not valid. Expired?.')
            return make_response("Credentials not valid. Expired?.", 401)

        waterflow = Waterflow()

        try:
            ver_backend = waterflow.get_version()
            ver_frontend = self.get_version()
        except Exception as ex:
            self.logger.info('Versions could not be found: %s', ex)

            ver_backend = '?.?.?'
            ver_frontend = '?.?.?'

        responsedict = None

        try:
            responsedict = {'log': waterflow.get_log(),
                            'forced': waterflow.get_forced_info(),
                            'stop': waterflow.stop_requested(),
                            'config': self._filter_public_config(waterflow.config.get_dict_copy()),
                            'lastlooptime': waterflow.last_loop_time().strftime('%Y-%m-%dT%H:%M:%S'),
                            'version_backend': ver_backend,
                            'version_frontend': ver_frontend
                            }
            # Change to string so that javascript can manage with it
            for program in responsedict['config']['programs']:
                program['start_time'] = program['start_time'].strftime('%H:%M')
        except Exception as ex:
            self.logger.error('Error calculating service request: %s', ex)
            raise RuntimeError(f'Exception on service request: {ex}') from ex

        return make_response(json.dumps(responsedict), 200)

    def on_force(self):
        """ On force action request
        Args:
            data (dict): 'type': Must be 'valve' or 'program'
                         'value': Must be the index of the program or value to be forced
        """
        waterflow = Waterflow()

        if request.method == 'POST':
            type_force = request.form.get('type')
            value_force = request.form.get('value')
            self.logger.info('Force requested: %s = %s', type_force, value_force)

            waterflow.force(type_force, value_force)
            return make_response('Force scheduled: %s = %s', type_force, value_force, 200)
        else:
            forced_data = waterflow.get_forced_info()
            return make_response(json.dumps(forced_data), 200)

    def on_stop(self):
        """ Event to stop current operation """
        waterflow = Waterflow()

        if request.method == 'POST':
            self.logger.info('Stop requested...')
            waterflow.stop()
            return "true"
        else:
            stop_requested = waterflow.stop_requested()
            return make_response(json.dumps(stop_requested), 200)

    def on_save(self):
        """ Event to save the changes in the watering system schedulling
        Args:
            data (dict): Information about the required schedulling
        Returns:
            bool: If everything went ok
        """
        waterflow = Waterflow()

        self.logger.info("Saving programs...")
        data = json.loads(request.form.get('save'))
        parsed_config = waterflow.config.get_dict_copy()
        for program, update in zip(parsed_config['programs'], data):
            self._change_program(program, update)

        waterflow.update_config(programs=parsed_config['programs'])
        return "true"

    def _filter_public_config(self, config):
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

    @classmethod
    def get_version(cls) -> str:
        """ Gets version string from the init file
        Returns:
            str: Version string
        """
        version_file = os.path.join(Path(__file__).parent.resolve(), '__init__.py')
        with open(version_file, 'r',  encoding="utf-8") as initfile_lines:
            content = initfile_lines.read()
            version = re.search(r'__version__ = ["|\'](.*?)["|\']', content).group(1)
            return version
        raise RuntimeError(f'Unable to find version string in {version_file}.')
