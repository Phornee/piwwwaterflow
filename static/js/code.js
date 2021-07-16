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

function datestringFromDate(dateobject){
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

function readableDay(original, start, end, formattedNow, formattedTomorrow){
    if (original.slice(start, end) == formattedNow){
        return original.replaceAt(start, 10, 'Today')
    }
    else{
        if (original.slice(start, end) == formattedTomorrow){
            return original.replaceAt(start, 10, 'Tomorrow')
        }
        else{
            return original
        }
    }
}

function update(first_time){
    let requestservice = new XMLHttpRequest();
    // Add timestamp to avoid caching
    requestservice.open('GET', '/service?' + (new Date()).getTime());
    requestservice.responseType = 'json';
    requestservice.onload = function() {
        // Version label update
        var versionlabel = document.getElementById('version');
        frontend = '1.1.2'
        backend = requestservice.response.version
        versionlabel.textContent = `PiWaterflow ${frontend} (Backend ${backend})`

        // Status line update
        now = new Date()
        formattedNow = datestringFromDate(now).slice(0,10)
        tomorrow = new Date(now.getTime())
        tomorrow.setDate(now.getDate() + 1)
        formattedTomorrow = datestringFromDate(tomorrow).slice(0,10)

        lastlooptime = new Date(requestservice.response.lastlooptime)

        formattedLastLoopDate =  datestringFromDate(lastlooptime)

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
        var lines = requestservice.response.log.split('\n');

        for(var i = 0;i < lines.length;i++){
            if (lines[i].slice(20,24) == 'Next'){
                newstring = readableDay(lines[i], 34, 44, formattedNow, formattedTomorrow)
            }
            newstring = readableDay(newstring, 0, 10, formattedNow, formattedTomorrow)
            newlines += newstring + '\n'
        }

        logtextarea.value = newlines;
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

