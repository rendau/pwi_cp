import React from "react";
import ReactDOM from "react-dom";
import Polyglot from "node-polyglot";

import ajax from "./ajax";
import translations from "./i18n";
import qpars from "./qpars";
import "../css/index.sass";
import PreloaderFile from "../img/loading.gif";

let API_URL_PREFIX = '/api/v1/hotspot/client';
let pgt = new Polyglot()

if (process.env.NODE_ENV === 'production') {
  API_URL_PREFIX = window.location.origin + API_URL_PREFIX;
} else {
  API_URL_PREFIX = 'http://localhost' + API_URL_PREFIX;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      hasAccess: false,
      hideBody: false,
      formStep: 1,
      step1PhoneValue: '',
      step2CodeValue: '',
      msg: '',
      locale: 'ru',
    };
    pgt.extend(translations[this.state.locale]);
  }

  refreshState() {
    this.setState(this.state);
  }

  setStateAttr(name, value) {
    this.state[name] = value;
    this.refreshState()
  }

  render() {
    return <div id="container">
      { this.renderLangBar() }
      <div id="logo"/>
      { this.renderBody() }
      { this.renderMsg() }
    </div>;
  }

  renderLangBar() {
    return <ul className="langbar">
      <li className={ (this.state.locale === 'en') ? 'selected' : '' } onClick={this.onLangClick.bind(this, 'en')}>
        English
      </li>
      <li className={ (this.state.locale === 'ru') ? 'selected' : '' } onClick={this.onLangClick.bind(this, 'ru')}>
        Русский
      </li>
      <li className={ (this.state.locale === 'kz') ? 'selected' : '' } onClick={this.onLangClick.bind(this, 'kz')}>
        Қазақша
      </li>
    </ul>
  }

  renderBody() {
    if (this.state.loading) {
      return <img src={PreloaderFile}/>
    }
    if (this.state.hideBody || this.state.loading || this.state.hasAccess) return;
    return <div>
      <div className="header" dangerouslySetInnerHTML={{__html: pgt.t('header_text')}}/>
      { this.renderForm() }
    </div>;
  }

  renderForm() {
    if (this.state.formStep === 1) {
      return <div className="step">
        <div className="form">
          <div className="label">+&nbsp;</div>
          <input type="tel" placeholder="77010000000" maxLength="15"
                 value={this.state.step1PhoneValue} onChange={this.updateStep1PhoneValue.bind(this)}/>
        </div>
        <div className="action">
          <a className="bt1" onClick={this.onSendCodeClick.bind(this)}>{pgt.t('step1_bt1')}</a>
          <a className="bt2" onClick={this.onHasCodeClick.bind(this)}>{pgt.t('step1_bt2')}</a>
        </div>
      </div>;
    } else if (this.state.formStep === 2) {
      return <div className="step">
        <div className="form">
          <div className="label">{pgt.t('step2_input_label')}:&nbsp;</div>
          <input type="text" placeholder="6385" maxLength="10"
                 value={this.state.step2CodeValue} onChange={this.updateStep2CodeValue.bind(this)}/>
        </div>
        <div className="action">
          <a className="bt1" onClick={this.onRegisterClick.bind(this)}>{pgt.t('step2_bt1')}</a>
          <a className="bt2" onClick={this.onHasntCodeClick.bind(this)}>{pgt.t('step2_bt2')}</a>
        </div>
      </div>;
    }
  }

  renderMsg() {
    if (!this.state.loading && this.state.msg) {
      // return <div id="msg">{this.state.msg}</div>;
      return <div id="msg" dangerouslySetInnerHTML={{__html: pgt.t(this.state.msg)}}/>;
    }
  }

  componentDidMount() {
    ajax.sendRequest('POST', API_URL_PREFIX + '/check', null, (st, data) => {
      this.state.loading = false;
      if (data.has_access === true) {
        this.state.hasAccess = true;
        this.state.msg = 'already_have_access';
        this.refreshState();
        this.redirect(data.redirect_url, data.phone);
      } else {
        this.state.hasAccess = false;
        this.state.formStep = 1;
        this.refreshState();
      }
    }, this.onAPIError.bind(this));
  }

  updateStep1PhoneValue(e) {
    this.setStateAttr('step1PhoneValue', e.target.value);
  }

  updateStep2CodeValue(e) {
    this.setStateAttr('step2CodeValue', e.target.value);
  }

  onLangClick(code, e) {
    pgt.replace(translations[code]);
    this.setStateAttr('locale', code);
  }

  onSendCodeClick(e) {
    let pn = this.state.step1PhoneValue;
    if (!(/^[1-9]\d{10,14}$/i).test(pn)) {
      this.setStateAttr('msg', 'bad_phone_number_error');
      return;
    }
    this.state.msg = '';
    this.state.loading = true;
    this.refreshState();
    let pnNum = Number(pn);
    ajax.sendRequest('POST', API_URL_PREFIX + '/send_sms_code', {phone: pnNum}, (st, data) => {
      this.state.loading = false;
      this.state.formStep = 2;
      this.refreshState();
    }, this.onAPIError.bind(this))
  }

  onHasCodeClick(e) {
    this.state.formStep = 2;
    this.state.msg = '';
    this.refreshState();
  }

  onRegisterClick(e) {
    let code = this.state.step2CodeValue;
    if (!(/^[1-9]\d{2,9}$/i).test(code)) {
      this.setStateAttr('msg', 'bad_code_error');
      return;
    }
    this.state.msg = '';
    this.state.loading = true;
    this.refreshState();
    let codeNum = Number(code);
    ajax.sendRequest('POST', API_URL_PREFIX + '/register', {code: codeNum}, (st, data) => {
      this.state.loading = false;
      this.state.msg = 'success';
      this.state.hasAccess = true;
      this.refreshState();
      this.redirect(data.redirect_url, data.phone);
    }, this.onAPIError.bind(this))
  }

  onHasntCodeClick(e) {
    this.state.formStep = 1;
    this.state.msg = '';
    this.refreshState();
  }

  onAPIError(st, data, raw_data) {
    if (data === null) {
      this.state.loading = false;
      this.state.hideBody = true;
      this.state.msg = 'system_error_ocurred';
      this.refreshState();
      return;
    }
    this.state.loading = false;
    switch (data.error) { // every case must refresh state
      case "already_registered":
        this.state.hasAccess = true;
        this.state.msg = 'already_have_access';
        this.refreshState();
        this.redirect(data.redirect_url, data.phone);
        break;
      case "in_black_list":
        this.state.hideBody = true;
        this.state.msg = 'api_error_in_black_list';
        this.refreshState();
        break;
      case "too_frequent":
        this.setStateAttr('msg', 'api_error_too_frequent');
        break;
      case "limit_reached":
        this.setStateAttr('msg', 'api_error_limit_reached');
        break;
      case "sms_send_fail":
        this.setStateAttr('msg', 'api_error_sms_send_fail');
        break;
      case "bad_sms_code":
        this.setStateAttr('msg', 'api_error_bad_sms_code');
        break;
      default:
        this.state.hideBody = true;
        this.state.msg = 'system_error_ocurred';
        this.refreshState();
        break;
    }
  }

  redirect(url, phone) {
    if (url) {
      if (url.indexOf('http://') && url.indexOf('https://')) {
        url = 'http://' + url;
      }
    } else {
      url = 'http://google.com';
    }
    let f, i;
    f = document.createElement("form");
    f.action = qpars.llink;
    f.method = "post";
    i = document.createElement("input");
    i.name = "dst";
    i.value = url;
    f.appendChild(i);
    i = document.createElement("input");
    i.name = "username";
    i.value = phone + "_" + Math.floor(Math.random() * 99999);
    f.appendChild(i);
    i = document.createElement("input");
    i.name = "password";
    i.value = "password";
    f.appendChild(i);
    f.style.display = 'none';
    document.body.appendChild(f);
    f.submit();
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
