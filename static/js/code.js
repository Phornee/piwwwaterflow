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
            document.getElementById('status').style.color = '#FF0000'
        }
        else
        {
            document.getElementById('status').innerHTML = "Status: Waterflow loop running OK. (" + timestring + ")"
            document.getElementById('status').style.color = '#000000'
        }
    }
    requestservice.send();
}

update();

setInterval("update();",30000);

function forceProgram(program_forced){
    let requestservice = new XMLHttpRequest();
    requestservice.open('POST', '/force_program');
    requestservice.responseType = 'text';
    requestservice.onload = function() {
        if (requestservice.response=='false'){

        }
    }
    requestservice.send(program=program_forced);
}

document.getElementById("play1").addEventListener("click", function(){forceProgram(0);})
document.getElementById("play2").addEventListener("click", function(){forceProgram(1);})