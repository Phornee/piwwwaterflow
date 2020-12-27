const inputs = document.querySelectorAll("input");

function saveCurrent() {
  for (const el of inputs) el.oldValue = el.value;
}

function setEnabled() {
  var e = false;
  for (const el of inputs) {
    if (el.oldValue !== el.value) {
      e = true;
      break;
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
        if (requestservice.response=='false')
        {
            document.getElementById('status').innerHTML = "Status: Waterflow loop NOT running!!!"
            document.getElementById('status').style.color = '#FF0000'
        }
        else
        {
            document.getElementById('status').innerHTML = "Status: Waterflow loop running OK."
            document.getElementById('status').style.color = '#000000'
        }
    }
    requestservice.send();
}

update();

setInterval("update();",10000);