function setEnableForceFieldset(enable){
    document.getElementById("forceFieldset").disabled = !enable
}

function resetForceTriggers(){
    var x = document.getElementsByName('forcetrigger');
    for (var i = 0; i < x.length; i++) {
        x[i].checked = false;
        x[i].labels.item(0).style.color = 'inherit'
        }
}

function activateForceTrigger(controlname){
    control = document.getElementById(controlname);
    control.checked = true;
    control.labels.item(0).style.color = '#22FF22'
}

const inputs = document.querySelectorAll("input");

function saveCurrent() {
  for (const el of inputs)
   {
        if (el.type == 'checkbox')
            el.oldValue = el.checked;
        else
            el.oldValue = el.value;
   }
}

function setEnabled(e) {
  var changed = false;
  for (const el of inputs) {
    if (el.type == 'checkbox')
    {
        if (el.oldValue !== el.checked) {
            changed = true;
            break;
        }
    }
    else
    {
        if (el.oldValue !== el.value) {
            changed = true;
            break;
        }
    }
  }
  document.getElementById("saveForm").disabled = !changed;
}

document.addEventListener("change", setEnabled);

function update(first_time){
    let requestservice = new XMLHttpRequest();
    // Add timestamp to avoid caching
    requestservice.open('GET', '/service?' + (new Date()).getTime());
    requestservice.responseType = 'json';
    requestservice.onload = function() {
        // Version label update
        var versionlabel = document.getElementById('version');
        frontend = '1.1.0'
        backend = requestservice.response.version
        versionlabel.textContent = `PiWaterflow ${frontend} (Backend ${backend})`

        // Status line update
        now = new Date()
        nowUTCtimestamp = now.getTime();
        lastlooptime = new Date(requestservice.response.lastlooptime)
        lastlooptimeUTCtimestamp = lastlooptime.getTime()
        var statuscontrol = document.getElementById('status');
        lapse = nowUTCtimestamp - lastlooptimeUTCtimestamp

        date = ("0" + lastlooptime.getDate()).slice(-2);
        month = ("0" + (lastlooptime.getMonth() + 1)).slice(-2);
        formattedDate =  lastlooptime.getFullYear()+ "-" + month + "-" + date + " " +
                         lastlooptime.getHours()+ ":"+ lastlooptime.getMinutes() +":"+lastlooptime.getSeconds();

        lapseseconds = Math.trunc(lapse/1000)
        if ( lapseseconds > 10*60){
            statuscontrol.innerHTML = "Status: Waterflow loop NOT running! (since " + formattedDate + " ... " + lapseseconds + " seconds ago)"
            statuscontrol.style.color = '#FF2222'
        }
        else {
            statuscontrol.innerHTML = "Status: Waterflow loop running OK. (" + formattedDate + " ... " + lapseseconds + " seconds ago)"
            statuscontrol.style.color = 'inherited'
        }

        // Log textarea update
        logtextarea = document.getElementById("log");
        atbottom = ((logtextarea.scrollHeight - logtextarea.scrollTop) <= logtextarea.clientHeight);
        logtextarea.value = requestservice.response.log;
        if (atbottom)
            logtextarea.scrollTop = logtextarea.scrollHeight;

        // Stop button update
        if (requestservice.response.stop==false)
            document.getElementById('stop').disabled = false
        else
            document.getElementById('stop').disabled = true

        // Force triggers update
        resetForceTriggers();
        var forcedObj = requestservice.response.forced;
        if (forcedObj!=null){
            setEnableForceFieldset(false);

            if (forcedObj.type=='program'){
                if (forcedObj.value == 0)
                    activateForceTrigger("program1trigger");
                else
                    activateForceTrigger("program2trigger");
            }
            else{
                if (forcedObj.value == 0)
                    activateForceTrigger("valve1trigger");
                else
                    activateForceTrigger("valve2trigger");
            }
        }
        else{
            setEnableForceFieldset(true)
        }

        // Controls update
        var configObj = requestservice.response.config;
        if (configObj!=null){
            time1 = document.getElementById("time1");
            time1.value = configObj.programs[0].start_time;
            valve11 = document.getElementById("valve11");
            valve11.value = configObj.programs[0].valves_times[0]
            valve12 = document.getElementById("valve12");
            valve12.value = configObj.programs[0].valves_times[1]
            prog1enabled = document.getElementById("prog1enabled");
            prog1enabled.checked = configObj.programs[0].enabled;

            time1 = document.getElementById("time2");
            time1.value = configObj.programs[1].start_time;
            valve11 = document.getElementById("valve21");
            valve11.value = configObj.programs[1].valves_times[0]
            valve12 = document.getElementById("valve22");
            valve12.value = configObj.programs[1].valves_times[1]
            prog2enabled = document.getElementById("prog2enabled");
            prog2enabled.checked = configObj.programs[1].enabled;

            if (first_time) {
                saveCurrent();
                setEnabled();
            }

        }
    }
    requestservice.send();

}

update(true);
setInterval("update(false);",30000);

function forceProgram(control, program_forced){
    if (confirm("Are you sure you want to force program?.")) {
        let requestservice = new XMLHttpRequest();
        requestservice.open('POST', '/force');
        requestservice.responseType = 'text';
        requestservice.onload = function() {
            if (requestservice.response=='false'){

            }
        }
        var data = new FormData();
        data.append('type', 'program');
        data.append('value', program_forced);

        requestservice.send(data);

        control.labels.item(0).style.color = '#22FF22'
        setEnableForceFieldset(false)
    }
    else {
        control.checked = false
    }
}

function forceValve(control, valve_forced){
    if (confirm("Are you sure you want to force valve?.")) {
        let requestservice = new XMLHttpRequest();
        requestservice.open('POST', '/force');
        requestservice.responseType = 'text';
        requestservice.onload = function() {
            if (requestservice.response=='false'){

            }
        }
        var data = new FormData();
        data.append('type', 'valve');
        data.append('value', valve_forced);

        requestservice.send(data);

        control.labels.item(0).style.color = '#22FF22'
        setEnableForceFieldset(false)
    }
    else {
        control.checked = false
    }
}

function stopWaterflow(button){
    let requestservice = new XMLHttpRequest();
    requestservice.open('POST', '/stop');
    requestservice.send();
    button.disabled = true;
}

