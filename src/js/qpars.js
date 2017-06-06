function getParams() {
  let result = {
    token: window.token || '',
    mac: window.mac || '',
    ip: window.ip || '',
    llink: window.llink || '',
  };
  return result;
}

module.exports = getParams();
