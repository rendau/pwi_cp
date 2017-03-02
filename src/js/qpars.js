function getParams() {
  let params = new URLSearchParams(location.search.slice(1));
  return {
    token: params.get('token'),
    mac: params.get('mac'),
    llink: params.get('llink'),
  };
  // return {
  //   token: 'asdasd',
  //   mac: 'aaaaa',
  //   llink: 'aaaaaa',
  // };
}

module.exports = getParams();
