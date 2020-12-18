import os
from flask import Flask, request, make_response, render_template, redirect, url_for
from pathlib import Path
import yaml
import datetime

app = Flask(__name__)

def findWaterflowProcess():
    import psutil
    found = False
    for i in psutil.process_iter():
        try:
            cmdline = i.cmdline()
            if cmdline[0].find('python') != -1:
                for cmd in cmdline:
                    if cmd.find('rele.py') != -1:
                        found = True
                        break
                if found:
                    break
        except Exception as e:
            pass
    return found

@app.route('/service', methods=['GET', 'POST'])  # allow both GET and POST requests
def service():
    process_running = findWaterflowProcess()
    if request.method == 'GET':
        return process_running
    elif request.method == 'POST':
        activate = request.form.get('activate') == 'true'
        if activate:
            if not process_running:
                from subprocess import Popen, PIPE, DETACHED_PROCESS, CREATE_NEW_PROCESS_GROUP
                p = Popen(['python', '../PiWaterflow/rele.py'], stdin=PIPE, stdout=PIPE, stderr=PIPE, creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP)
        else:
            if process_running:
                with open("../PiWaterflow/stop", "w"):  # create marker file so that loop ends smootly
                    pass

        return redirect(url_for('form_example'))  # Redirect so that we dont RE-POST same data again when refreshing

# mainpage
@app.route('/')
def index():
    return 'This is the Pi server.'


# log
@app.route('/log', methods=['GET'])
def log():
    log_string = ''

    file_folder = Path(__file__).parent
    waterflow_log = os.path.join(file_folder, '../PiWaterflow/waterflow.log')

    with open(waterflow_log, 'r') as file:
        log_string = file.read()
    response = make_response(log_string)
    response.headers["content-type"] = "text/plain"
    response.boy = log_string
    return response


@app.route('/config', methods=['GET'])
def config():
    if request.method == 'GET':
        file_folder = Path(__file__).parent
        config_log = os.path.join(file_folder, '../PiWaterflow/config.yml')

        with open(config_log, 'r') as file:
            log_string = file.read()
        response = make_response(log_string)
        response.headers["content-type"] = "text/plain"
        response.boy = log_string
        return response


@app.route('/form-example', methods=['GET', 'POST'])  # allow both GET and POST requests
def form_example():
    if request.method == 'POST':  # this block is only entered when the form is submitted
        file_folder = Path(__file__).parent
        config_yml_path = os.path.join(file_folder, '../PiWaterflow/config.yml')

        with open(config_yml_path, 'r') as config_file:
            config = yaml.load(config_file, Loader=yaml.FullLoader)

        config['programs'][0]['start_time'] = datetime.datetime.strptime(config['programs'][0]['start_time'],
                                                                         '%H:%M:%S')
        time1 = datetime.datetime.strptime(request.form.get('time1'), '%H:%M')
        new_datetime = config['programs'][0]['start_time'].replace(hour=time1.hour, minute=time1.minute)
        config['programs'][0]['start_time'] = new_datetime.strftime('%H:%M:%S')
        config['programs'][0]['valves_times'][0] = int(request.form.get('valve11'))
        config['programs'][0]['valves_times'][1] = int(request.form.get('valve12'))

        config['programs'][1]['start_time'] = datetime.datetime.strptime(config['programs'][1]['start_time'],
                                                                         '%H:%M:%S')
        time2 = datetime.datetime.strptime(request.form.get('time2'), '%H:%M')
        new_datetime = config['programs'][1]['start_time'].replace(hour=time2.hour, minute=time2.minute)
        config['programs'][1]['start_time'] = new_datetime.strftime('%H:%M:%S')
        config['programs'][1]['valves_times'][0] = int(request.form.get('valve21'))
        config['programs'][1]['valves_times'][1] = int(request.form.get('valve22'))

        with open(config_yml_path, 'w') as config_file:
            yaml.dump(config, config_file)

        return redirect(url_for('form_example'))  # Redirect so that we dont RE-POST same data again when refreshing

    file_folder = Path(__file__).parent
    config_yml_path = os.path.join(file_folder, '../PiWaterflow/config.yml')

    with open(config_yml_path) as config_file:
        config = yaml.load(config_file, Loader=yaml.FullLoader)

        for program in config['programs']:
            program['start_time'] = datetime.datetime.strptime(program['start_time'], '%H:%M:%S')

        # Sort the programs by time
        config['programs'].sort(key=lambda prog: prog['start_time'])

    found = findWaterflowProcess()

    return render_template('form.html'
                           , time1=("{:02}:{:02}".format(config['programs'][0]['start_time'].hour,
                                                         config['programs'][0]['start_time'].minute))
                           , valve11=config['programs'][0]['valves_times'][0]
                           , valve12=config['programs'][0]['valves_times'][1]
                           , time2=("{:02}:{:02}".format(config['programs'][1]['start_time'].hour,
                                                         config['programs'][1]['start_time'].minute))
                           , valve21=config['programs'][1]['valves_times'][0]
                           , valve22=config['programs'][1]['valves_times'][1]
                           , looprunning=found
                           )


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
