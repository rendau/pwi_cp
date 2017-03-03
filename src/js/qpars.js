function getParams() {
  let result = {
    token: '',
    mac: '',
    llink: '',
  };
  let pars = window.location.search.substr(1).split('&')
  if(pars) {
    for(let i = 0; i < pars.length; i++) {
      let p = pars[i].split('=', 2);
      if(p.length == 1)
        result[p[0]] = "";
      else
        result[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
  }
  return result;
}

module.exports = getParams();
