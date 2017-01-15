import '../css/index.sass'
import PreloaderFile from '../img/loading.gif'
import React from 'react';
import ReactDOM from 'react-dom';
import Polyglot from 'node-polyglot'
import translations from './i18n'

var API_URL_PREFIX = 'http://192.168.1.33:8888/api/user';
var pgt = new Polyglot()

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      hasAccess: false,
      formStep: 1,
      step1PhoneValue: '',
      step2CodeValue: '',
      msg: '',
      locale: 'ru',
    }
    pgt.extend(translations[this.state.locale]);
  }
  refreshState() {
    this.setState(this.state);
  }
  setStateAttr(name, value) {
    this.state[name] = value
    this.refreshState()
  }
  render() {
    return <div id="container">
      <div id="logo"></div>
      { this.renderBody() }
      { this.renderMsg() }
    </div>;
  }
  renderBody() {
    if(this.state.loading) {
      return <img src={PreloaderFile} />
    }
    if(this.state.loading || this.state.hasAccess) return;
    return <div>
      <div className="header" dangerouslySetInnerHTML={{__html: pgt.t('header_text')}}></div>
      { this.renderForm() }
    </div>;
  }
  renderForm() {
    if(this.state.formStep == 1) {
      return <div className="step">
        <div className="form">
          <div className="label">+&nbsp;</div><input type="tel" placeholder="77010000000" maxLength="15"
            value={this.state.step1PhoneValue} onChange={this.updateStep1PhoneValue.bind(this)}
            ref={input => input && input.focus()} />
        </div>
        <div className="action">
          <a className="bt1" onClick={this.onSendCodeClick.bind(this)}>Получить код</a>
          <a className="bt2" onClick={this.onHasCodeClick.bind(this)}>уже есть код</a>
        </div>
      </div>;
    } else if(this.state.formStep == 2) {
      return <div className="step">
        <div className="form">
          <div className="label">Код:&nbsp;</div><input type="text" placeholder="6385" maxLength="10"
            value={this.state.step2CodeValue} onChange={this.updateStep2CodeValue.bind(this)}
            ref={input => input && input.focus()} />
        </div>
        <div className="action">
          <a className="bt1" onClick={this.onRegisterClick.bind(this)}>Подтвердить</a>
          <a className="bt2" onClick={this.onHasntCodeClick.bind(this)}>получить код</a>
        </div>
      </div>;
    }
  }
  renderMsg() {
    if(!this.state.loading && this.state.msg) {
      return <div id="msg">{this.state.msg}</div>;
    }
    return;
  }
  componentDidMount() {
    fetch(API_URL_PREFIX+'/check', {
      mode: 'cors',
      method: 'GET',
    }).then(this.onFetchResponse.bind(this)).then((data) => {
      if(data === undefined) return;
      this.state.loading = false;
      if(data.has_access === true) {
        this.state.hasAccess = true;
        this.state.msg = 'у Вас уже есть доступ в интернет';
        this.refreshState();
        this.redirect(data.redirect_url);
      } else {
        this.state.hasAccess = false;
        this.state.formStep = 1;
        this.refreshState();
      }
    }).catch(this.onFetchError.bind(this));
  }
  updateStep1PhoneValue(e) {
    this.setStateAttr('step1PhoneValue', e.target.value);
  }
  updateStep2CodeValue(e) {
    this.setStateAttr('step2CodeValue', e.target.value);
  }
  onSendCodeClick(e) {
    let pn = this.state.step1PhoneValue;
  	if(!(/^[1-9]\d{10,14}$/i).test(pn)) {
	    this.setStateAttr('msg', pgt.t('bad_phone_number_error')+', '+pgt.t('phone_format_hint'));
	    return;
  	}
  	this.state.msg = '';
    this.state.loading = true;
    this.refreshState();
  	let pnNum = Number(pn);
    fetch(API_URL_PREFIX+'/send_sms_code', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({phone: pnNum}),
    }).then(this.onFetchResponse.bind(this)).then((data) => {
      if(data === undefined) return;
      this.state.loading = false;
      this.state.formStep = 2;
      this.refreshState();
    }).catch(this.onFetchError.bind(this));
  }
  onHasCodeClick(e) {
    this.setStateAttr('formStep', 2);
  }
  onRegisterClick(e) {
    let code = this.state.step2CodeValue;
  	if(!(/^[1-9]\d{2,9}$/i).test(code)) {
	    this.setStateAttr('msg', 'Неправильный код.');
	    return;
  	}
    this.state.msg = '';
    this.state.loading = true;
    this.refreshState();
  	let codeNum = Number(code);
    fetch(API_URL_PREFIX+'/register', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({code: codeNum}),
    }).then(this.onFetchResponse.bind(this)).then((data) => {
      if(data === undefined) return;
      this.state.loading = false;
      this.state.msg = 'успешно';
      this.state.hasAccess = true;
      this.refreshState();
      this.redirect(data.redirect_url);
    }).catch(this.onFetchError.bind(this));
  }
  onHasntCodeClick(e) {
    this.setStateAttr('formStep', 1);
  }
  onFetchResponse(response) {
    if(response.ok) {
      return response.json();
    } else {
      response.json().then((data) => {
        this.handleAPIError(data);
      }).catch(this.onFetchError.bind(this));
    }
  }
  onFetchError(error) {
    this.setStateAttr('loading', false);
    console.log('fetch error:', error);
  }
  handleAPIError(data) {
    this.setStateAttr('loading', false);
    console.log('api error:', data);
  }
  redirect(url) {
  	if(url) {
  	  if(url.indexOf('http://') && url.indexOf('https://'))
  		  url = 'http://' + url;
  	  document.location.href = url;
  	}
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
