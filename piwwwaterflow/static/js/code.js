var forceTriggersEnabled = true

var socket = io();

function _setEnableForceTriggers(enable){
    forceTriggersEnabled = enable
}

function _resetForceTriggers(){
    document.getElementById('program1trigger').style.color = 'inherit';
    document.getElementById('program2trigger').style.color = 'inherit';
    document.getElementById('valve1trigger').style.color = 'inherit';
    document.getElementById('valve2trigger').style.color = 'inherit';
}

function _activateForceTrigger(controlname){
    control = document.getElementById(controlname);
    control.style.color = '#22FF22'
}

const inputs = document.querySelectorAll("input");

function saveCurrentValues() {
  for (const el of inputs)
   {
        if (el.type == 'checkbox')
            el.oldValue = el.checked;
        else
            el.oldValue = el.value;
   }
}

function refreshSaveButton(e) {
  var anychanged = false;
  for (const el of inputs) {
    if (el.type == 'checkbox')
    {
        if (el.oldValue !== el.checked) {
            el.changed = true
            anychanged = true;
        }
        else{
            el.changed = false  
        }
    }
    else
    {
        if (el.oldValue !== el.value) {
            el.changed= true
            anychanged = true;
        }
        else{
            el.changed = false  
        }
    }
  }
  document.getElementById("saveForm").disabled = !anychanged;
}

document.addEventListener("change", refreshSaveButton);

function _datestringFromDate(dateobject){
    date = ("0" + dateobject.getDate()).slice(-2);
    month = ("0" + (dateobject.getMonth() + 1)).slice(-2);
    hours = ("0" + (dateobject.getHours())).slice(-2);
    minutes = ("0" + (dateobject.getMinutes())).slice(-2);
    seconds = ("0" + (dateobject.getSeconds())).slice(-2);
    formattedDate =  dateobject.getFullYear()+ "-" + month + "-" + date + " " + hours + ":"+ minutes + ":" + seconds;
    return formattedDate
}
String.prototype.replaceAt = function(index, sourcelength, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + sourcelength);
}

function _readableDay(original, start, end, formattedNow, formattedTomorrow){
    if (original.slice(start, end) == formattedNow){
        return original.replaceAt(start, 10, 'Today')
    }
    else{
        if (original.slice(start, end) == formattedTomorrow){
            return original.replaceAt(start, 10, 'Tomorrow')
        }else{
            return original
        }
    }
}

socket.on('connect', function() {
    update(true);
});
setInterval("update(false);",30000);

function update(first_time){
    socket.emit('service_request', function service(response){
        // Version label update
        var versionlabel = document.getElementById('version');
        frontend = '1.4.0'
        backend = response.version
        versionlabel.textContent = `PiWaterflow ${frontend} (Backend ${backend})`

        // Status line update
        now = new Date()
        formattedNow = _datestringFromDate(now).slice(0,10)
        tomorrow = new Date(now.getTime())
        tomorrow.setDate(now.getDate() + 1)
        formattedTomorrow = _datestringFromDate(tomorrow).slice(0,10)

        lastlooptime = new Date(response.lastlooptime)

        formattedLastLoopDate =  _datestringFromDate(lastlooptime)

        // Remove date info, if its today... and keep only time info
        if (formattedLastLoopDate.slice(0,10) == formattedNow)
            formattedLastLoopDate = formattedLastLoopDate.slice(11,)

        lapseseconds =  Math.trunc((now - lastlooptime)/1000)

        var statuscontrol = document.getElementById('status');
        if ( lapseseconds > 10*60){
            statuscontrol.innerHTML = "Status: Waterflow loop NOT running! (since " + formattedLastLoopDate + " ... " + lapseseconds + " seconds ago)"
            statuscontrol.style.color = '#FF2222'
        }
        else {
            statuscontrol.innerHTML = "Status: Waterflow loop running OK. (" + formattedLastLoopDate + " ... " + lapseseconds + " seconds ago)"
            statuscontrol.style.color = 'inherited'
        }

        // Log textarea update
        logtextarea = document.getElementById("log");
        atbottom = ((logtextarea.scrollHeight - logtextarea.scrollTop) <= logtextarea.clientHeight);

        var newlines = "";
        var lines = response.log.split('\n');

        for(var i = 0;i < lines.length;i++){
            if (lines[i].slice(20,24) == 'Next'){
                newstring = _readableDay(lines[i], 34, 44, formattedNow, formattedTomorrow)
                newstring = _readableDay(newstring, 0, 10, formattedNow, formattedTomorrow)
            }
            else{
                newstring = _readableDay(lines[i], 0, 10, formattedNow, formattedTomorrow)
            }
            newlines += newstring + '\n'
        }

        logtextarea.value = newlines;
        if (atbottom)
            logtextarea.scrollTop = logtextarea.scrollHeight;

        // Stop button update
        if (response.stop==false)
            document.getElementById('stop').disabled = false
        else
            document.getElementById('stop').disabled = true

        // Force triggers update
        _resetForceTriggers();
        var forcedObj = response.forced;
        if (forcedObj!=null){
            _setEnableForceTriggers(false);

            if (forcedObj.type=='program'){
                if (forcedObj.value == 0)
                    _activateForceTrigger("program1trigger");
                else
                    _activateForceTrigger("program2trigger");
            }
            else{
                if (forcedObj.value == 0)
                    _activateForceTrigger("valve1trigger");
                else
                    _activateForceTrigger("valve2trigger");
            }
        }
        else{
            _setEnableForceTriggers(true)
        }

        // Controls update
        var configObj = response.config;
        if (configObj!=null){
            time1 = document.getElementById("time1");
            if (!time1.changed)
                time1.value = configObj.programs["first"].start_time;
            valve11 = document.getElementById("valve11");
            if (!valve11.changed)
                valve11.value = configObj.programs["first"].valves_times['valve1']
            valve12 = document.getElementById("valve12");
            if (!valve12.changed)
                valve12.value = configObj.programs["first"].valves_times['valve2']
            prog1enabled = document.getElementById("prog1enabled");
            if (!prog1enabled.changed)
                prog1enabled.checked = configObj.programs["first"].enabled;

            time1 = document.getElementById("time2");
            if (!time1.changed)
                time1.value = configObj.programs["second"].start_time;
            valve21 = document.getElementById("valve21");
            if (!valve21.changed)
                valve21.value = configObj.programs["second"].valves_times['valve1']
            valve22 = document.getElementById("valve22");
            if (!valve22.changed)
                valve22.value = configObj.programs["second"].valves_times['valve2']
            prog2enabled = document.getElementById("prog2enabled");
            if (!prog2enabled.changed)
                prog2enabled.checked = configObj.programs["second"].enabled;

            if (first_time) { // Get this value from the closure (parameter in update function)
                saveCurrentValues();
                refreshSaveButton();
            }
        }
    });
}

function forceProgram(control, program_forced){
    if (forceTriggersEnabled && confirm("Are you sure you want to force program?.")) {
        socket.emit('force', {'type': 'program', 'value': program_forced});
        control.style.color = '#22FF22'
        _setEnableForceTriggers(false)
    }
    else {
        control.checked = false
    }
}

function forceValve(control, valve_forced){
    if (forceTriggersEnabled && confirm("Are you sure you want to force valve?.")) {
        socket.emit('force', {'type': 'valve', 'value': valve_forced});
        control.style.color = '#22FF22'
        _setEnableForceTriggers(false)
    }
    else {
        control.checked = false
    }
}

function stopWaterflow(button){
    socket.emit('stop', {});
    button.disabled = true;
}

function save(button){
    socket.emit('save', {'prog1': {'time': document.getElementById("time1").value, 
                                   'valve1': parseInt(document.getElementById("valve11").value), 
                                   'valve2': parseInt(document.getElementById("valve12").value), 
                                   'enabled': document.getElementById("prog1enabled").value}, 
                         'prog2': {'time': document.getElementById("time2").value, 
                                   'valve1': parseInt(document.getElementById("valve21").value), 
                                   'valve2': parseInt(document.getElementById("valve12").value), 
                                   'enabled': document.getElementById("prog2enabled").value}
                        }, function ack(result){
                            if (result){
                                saveCurrentValues();
                                refreshSaveButton();
                                button.disabled = true;
                            }
                        });
}

