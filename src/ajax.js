import qpars from "./qpars";

function getXHR() {
  if (typeof XMLHttpRequest !== 'undefined') {
    return new XMLHttpRequest();
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
    try {
      return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (ee) {
    }
  }
  return null;
}

function sendRequest(method, url, data, success_cb, error_cb) {
  let xhr = getXHR();
  xhr.open(method, url, true);
  xhr.onreadystatechange = (() => {
    if (xhr.readyState !== 4) return;
    try {
      let reply_obj = JSON.parse(xhr.responseText);
      if (199 < xhr.status && xhr.status < 300) { // success
        success_cb(xhr.status, reply_obj);
      } else {
        error_cb(xhr.status, reply_obj, xhr.responseText);
      }
    } catch (e) {
      error_cb(xhr.status, null, xhr.responseText);
    }
  });
  if (!data) {
    data = {};
  }
  data.mac = qpars.mac;
  data.ip = qpars.ip;
  xhr.setRequestHeader("Authorization", qpars.token);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(data));
}

export default ({ sendRequest: sendRequest })
