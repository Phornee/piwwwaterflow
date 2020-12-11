import os
from flask import Flask, request, make_response, render_template
from pathlib import Path

app = Flask(__name__)
 
# mainpage
@app.route('/')
def index():
    return 'This is the Pi server.'

# log
@app.route('/log')
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

@app.route('/config',methods=['GET', 'POST'])
def config():
    if request.method == 'GET':
        #nombreUser = request.args.get('nombreUser')

        file_folder = Path(__file__).parent
        config_log = os.path.join(file_folder, '../PiWaterflow/config.yml')

        with open(config_log, 'r') as file:
            log_string = file.read()
        response = make_response(log_string)
        response.headers["content-type"] = "text/plain"
        response.boy = log_string
        return response

        #return "<h1>GET " + nombreUser + "</h1>"
    elif  request.method == 'POST':
        language = request.form.get('language')
        framework = request.form['framework']

        return '''<h1>The language value is: {}</h1>
                  <h1>The framework value is: {}</h1>'''.format(language, framework)

    return '''<form method="POST">
                  Language: <input type="text" name="language"><br>
                  Framework: <input type="text" name="framework"><br>
                  <input type="submit" value="Submit"><br>
              </form>'''

@app.route('/form-example', methods=['GET', 'POST']) #allow both GET and POST requests
def form_example():
    if request.method == 'POST':  #this block is only entered when the form is submitted
        language = request.form.get('language')
        framework = request.form['framework']

        return '''<h1>The language value is: {}</h1>
                  <h1>The framework value is: {}</h1>'''.format(language, framework)

    return render_template('form.html')

    # return '''<form method="POST">
    #               Language: <input type="text" name="language"><br>
    #               Framework: <input type="text" name="framework"><br>
    #               <input type="submit" value="Submit"><br>
    #           </form>'''

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
