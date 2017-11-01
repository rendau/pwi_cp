function getParams() {
  let result;
  if (process.env.NODE_ENV === 'production') {
    result = {
      token: window.token || '',
      mac: window.mac || '',
      ip: window.ip || '',
      llink: window.llink || '',
    };
  } else {
    result = {
      token: '1ab5c470c35a2958ecb87c99caa3111dd5cf02a1c7c34fd7c5d600b82de6acf7a0bf94e1552e63cc86fafebb2b2e5fdc50bc53cd917ec21d1f3450b72b55d9db',
      mac: '80:56:F2:E5:CD:5D',
      ip: '10.250.100.100',
      llink: 'http://google.kz',
    };
  }
  return result;
}

module.exports = getParams();
