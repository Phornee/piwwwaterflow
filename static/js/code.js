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

function setEnabled() {
  var e = false;
  for (const el of inputs) {
    if (el.type == 'checkbox')
    {
        if (el.oldValue !== el.checked) {
            e = true;
            break;
        }
    }
    else
    {
        if (el.oldValue !== el.value) {
            e = true;
            break;
        }
    }
  }
  document.getElementById("saveForm").disabled = !e;
}

document.addEventListener("input", setEnabled);

saveCurrent();
setEnabled();

function setEnableInstantActions(enable){
    document.getElementById("force1").disabled = !enable
    document.getElementById("force1").hidden = !enable
    document.getElementById("force2").disabled = !enable
    document.getElementById("force2").hidden = !enable
}

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


function update(){
    let requestlog = new XMLHttpRequest();
    requestlog.open('GET', '/log');
    requestlog.responseType = 'text';
    requestlog.onload = function() {
        logtextarea = document.getElementById("log");
        atbottom = ((logtextarea.scrollHeight - logtextarea.scrollTop) <= logtextarea.clientHeight);
        logtextarea.value = requestlog.response;
        if (atbottom) {
            logtextarea.scrollTop = logtextarea.scrollHeight;
        }
    };
    requestlog.send();

    let requestservice = new XMLHttpRequest();
    requestservice.open('GET', '/service');
    requestservice.responseType = 'text';
    requestservice.onload = function() {
        var d = new Date();
        var timestring = d.toLocaleTimeString();
        if (requestservice.response=='false')
        {
            document.getElementById('status').innerHTML = "Status: Waterflow loop NOT running!!! (" + timestring + ")"
            document.getElementById('status').style.color = '#FF2222'
        }
        else
        {
            document.getElementById('status').innerHTML = "Status: Waterflow loop running OK. (" + timestring + ")"
            document.getElementById('status').style.color = 'inherited'
        }
    }
    requestservice.send();

    let requeststop = new XMLHttpRequest();
    requeststop.open('GET', '/stop');
    requeststop.responseType = 'text';
    requeststop.onload = function() {
        if (requeststop.response=='false'){
            document.getElementById('stop').disabled = false
        }
        else{
            document.getElementById('stop').disabled = true
        }
    }
    requeststop.send();


    resetForceTriggers();

    let requestforced = new XMLHttpRequest();
    requestforced.open('GET', '/force');
    requestforced.responseType = 'text';
    requestforced.onload = function() {
        if (requestforced.response!="null"){
            var forcedObj = JSON.parse(requestforced.response);
            setEnableForceFieldset(false);

            if (forcedObj.type=='program'){
                if (forcedObj.value == 0){
                    program1t = document.getElementById("program1trigger");
                    program1t.checked = true;
                    program1t.labels.item(0).style.color = '#22FF22'
                }
                else{
                    program2t = document.getElementById("program2trigger");
                    program2t.checked = true;
                    program2t.labels.item(0).style.color = '#22FF22'
                }
            }
            else{
                if (forcedObj.value == 0){
                    valve1t = document.getElementById("valve1trigger");
                    valve1t.checked = true;
                    valve1t.labels.item(0).style.color = '#22FF22'
                }
                else{
                    valve2t = document.getElementById("valve2trigger");
                    valve2t.checked = true;
                    valve2t.labels.item(0).style.color = '#22FF22'
                }
            }
        }
        else{
            setEnableForceFieldset(true)
            var x = document.getElementsByName('forcetrigger');
            for (var i = 0; i < x.length; i++) {
                x[i].checked = false;
            }
        }
    }
    requestforced.send();


    let requestconfig = new XMLHttpRequest();
    requestconfig.open('GET', '/config');
    requestconfig.responseType = 'text';
    requestconfig.onload = function() {
        if (requestconfig.response!='null'){
            var forcedObj = JSON.parse(requestconfig.response);
            time1 = document.getElementById("time1");
            time1.value = forcedObj.programs[0].start_time;
            valve11 = document.getElementById("valve11");
            valve11.value = forcedObj.programs[0].valves_times[0]
            valve12 = document.getElementById("valve12");
            valve12.value = forcedObj.programs[0].valves_times[1]

            time1 = document.getElementById("time2");
            time1.value = forcedObj.programs[1].start_time;
            valve11 = document.getElementById("valve21");
            valve11.value = forcedObj.programs[1].valves_times[0]
            valve12 = document.getElementById("valve22");
            valve12.value = forcedObj.programs[1].valves_times[1]

        }
    }
    requestconfig.send();

}

update();

setInterval("update();",30000);

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

        control.style.color = '#00FF00'
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

        control.style.color = '#00FF00'
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

function handleTriggerValve(trigger_radio, valve){
    alert('New value: ' + trigger_radio.value);
    if (valve!=0)
    {
        forceProgram(-valve)
    }
    else
    {
        setEnableInstantActions(true)
        setEnableForceValve(true)
    }
}
