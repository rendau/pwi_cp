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

function sendRequest({method, url, headers, data, onSuccess, onError}) {
  let xhr = getXHR();
  method = method || 'GET';
  xhr.open(method, url, true);
  xhr.onreadystatechange = (() => {
    if (xhr.readyState !== 4) return;
    try {
      let reply_obj = JSON.parse(xhr.responseText);
      if (199 < xhr.status && xhr.status < 300) { // success
        onSuccess(xhr.status, reply_obj);
      } else {
        onError(xhr.status, reply_obj, xhr.responseText);
      }
    } catch (e) {
      onError(xhr.status, null, xhr.responseText);
    }
  });
  xhr.setRequestHeader("Authorization", qpars.token);
  if(headers) {
    for(let k in headers) {
      xhr.setRequestHeader(k, headers[k]);
    }
  }
  xhr.send(data);
}

function sendJSONRequest(pars) {
  pars.headers = pars.headers || {};
  pars.headers['Content-Type'] = 'application/json';
  pars.data = JSON.stringify(pars.data || {});
  sendRequest(pars)
}

function sendFormDataRequest(pars) {
  pars.headers = pars.headers || {};
  pars.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  let data = [];
  for(let k in pars.data) {
    data.push(encodeURIComponent(k) + '=' + encodeURIComponent(pars.data[k]));
  }
  pars.data = data.join('&');
  sendRequest(pars)
}

export default ({sendRequest, sendJSONRequest, sendFormDataRequest })
