<template>
  <div id="app">
    <div id="ad" :style="{display: hasAccess ? 'block': 'none'}">
      <div v-if="loading_config"><img src="./assets/loading.gif"/></div>
      <div v-else-if="config && config.ad_id" id="ad-container">
        <div id="ad-counter">Реклама уйдет через {{ config.ad_duration }} сек</div>
        <img id="ad-img" :src="config.ad_content" @click="adClicked"/>
      </div>
    </div>
    <template v-if="!hasAccess">
      <div v-if="showAgreement" id="agreement">
        <h1>{{ i18n[locale]['Agreement'] }}</h1>
        <article>
          <p>
            Настоящим даю согласие на сбор,
            обработку и хранение персональных данных обо мне
            (включая биометрические) и на SMS-рассылку рекламного
            характера на мой мобильный телефон.
          </p>
          <p>
            Настоящим подтверждаю, что не требуется какого-либо
            дополнительного моего согласия на сбор, обработку,
            хранение персональных данных обо мне и на SMS-рассылку,
            и в дальнейшем каких-либо претензий касательно сбора,
            обработки, хранения моих персональных данных и
            SMS-рассылки в мой адрес, иметь не буду.
          </p>
          <p>
            Подтверждаю, что настоящее согласие действует в течение
            неопределенного срока (бессрочно).
          </p>
          <p>
            Текст настоящего согласия мной прочитан, дополнений и возражений не имею.
          </p>
        </article>
        <footer><a class="bt1" v-on:click="closeAgreementClicked">{{ i18n[locale]['Close'] }}</a></footer>
      </div>
      <template v-else>
        <ul id="langbar">
          <li v-on:click="langClicked('en')" v-bind:class="{selected: locale=='en'}">English</li>
          <li v-on:click="langClicked('ru')" v-bind:class="{selected: locale=='ru'}">Русский</li>
          <li v-on:click="langClicked('kz')" v-bind:class="{selected: locale=='kz'}">Қазақша</li>
        </ul>
        <div v-if="config !== null" class="block"><img id="logo" v-bind:src="config.logo"/></div>
        <div v-if="loading" class="block"><img src="./assets/loading.gif"/></div>
        <template v-else-if="!hasAccess && !hideBody">
          <div class="block" id="header" v-html="i18n[locale]['header_text']"></div>
          <div class="agreement_note">
            {{ i18n[locale]['agreement_note'] }}
            <span class="agreement_note_button" v-on:click="openAgreementClicked">
            {{ i18n[locale]['agreement_note_button'] }}
          </span>
          </div>
          <template v-if="formStep === 1">
            <div class="block form">
              <span>+&nbsp;</span>
              <input type="tel" placeholder="77010000000" maxLength="15" v-model="phone"/>
            </div>
            <div class="block action">
              <a class="bt1" v-on:click="step1OKClicked">{{ i18n[locale]['step1_bt1'] }}</a>
              <a class="bt2" v-on:click="step1HasCodeClicked">{{ i18n[locale]['step1_bt2'] }}</a>
            </div>
          </template>
          <template v-else-if="formStep === 2">
            <div class="block form">
              <span>{{i18n[locale]['step2_input_label']}}:&nbsp;</span>
              <input type="text" placeholder="6385" maxLength="10" v-model="code"/>
            </div>
            <div class="block action">
              <a class="bt1" v-on:click="step2OKClicked">{{ i18n[locale]['step2_bt1'] }}</a>
              <a class="bt2" v-on:click="step2HasntCodeClicked">{{ i18n[locale]['step2_bt2'] }}</a>
            </div>
          </template>
        </template>
        <div v-if="!loading && (msg !== '')" class="block" id="msg" v-html="i18n[locale][msg]"></div>
      </template>
    </template>
  </div>
</template>

<script>
  import i18n from "./i18n";
  import ajax from "./ajax";
  import qpars from "./qpars";

  let API_URL_PREFIX = '/api/hotspot';

  if (process.env.NODE_ENV === 'production') {
    API_URL_PREFIX = window.location.origin + API_URL_PREFIX;
  } else {
//    API_URL_PREFIX = 'http://localhost' + API_URL_PREFIX;
    API_URL_PREFIX = 'https://pwi.kz' + API_URL_PREFIX;
  }

  export default {

    name: 'app',

    data () {
      return {
        i18n: i18n,
        locale: 'ru',
        loading_config: true,
        config: null,
        ad_timer_id: null,
        redirect_url: '',
        showAgreement: false,
        loading: false,
        hasAccess: false,
        accessPhone: 'undefined',
        hideBody: false,
        formStep: 1,
        phone: '',
        code: '',
        msg: '',
      };
    },

    methods: {
      langClicked(locale) {
        this.locale = locale;
      },
      step1OKClicked() {
        let pn = this.phone;
        if (!(/^[1-9]\d{10,14}$/i).test(pn)) {
          this.msg = 'bad_phone_number_error';
          return;
        }
        this.msg = '';
        this.loading = true;
        let pnNum = Number(pn);
        let self = this;
        ajax.sendJSONRequest({
          method: 'POST',
          url: API_URL_PREFIX + '/client/send_sms_code',
          data: {phone: pnNum, ip: qpars.ip, mac: qpars.mac},
          onSuccess() {
            self.loading = false;
            self.formStep = 2;
          },
          onError: this.onAPIError.bind(this),
        });
      },
      step1HasCodeClicked() {
        this.formStep = 2;
        this.msg = '';
      },
      step2OKClicked() {
        let code = this.code;
        if (!(/^[1-9]\d{2,9}$/i).test(code)) {
          this.msg = 'bad_code_error';
          return;
        }
        this.msg = '';
        this.loading = true;
        let codeNum = Number(code);
        let self = this;
        ajax.sendJSONRequest({
          method: 'POST',
          url: API_URL_PREFIX + '/client/register',
          data: {code: codeNum, ip: qpars.ip, mac: qpars.mac},
          onSuccess(st, data) {
            self.loading = false;
            self.msg = 'success';
            self.accessPhone = data.phone;
            self.gotAccess();
          },
          onError: this.onAPIError.bind(this),
        });
      },
      step2HasntCodeClicked() {
        this.formStep = 1;
        this.msg = '';
      },
      onAPIError(st, data, raw_data) {
        if (data === null) {
          this.loading = false;
          this.hideBody = true;
          this.msg = 'system_error_ocurred';
          return;
        }
        this.loading = false;
        switch (data.error) {
          case "already_registered":
            this.msg = 'already_have_access';
            this.accessPhone = data.phone;
            this.gotAccess();
            break;
          case "in_black_list":
            this.hideBody = true;
            this.msg = 'api_error_in_black_list';
            break;
          case "too_frequent":
            this.msg = 'api_error_too_frequent';
            break;
          case "limit_reached":
            this.msg = 'api_error_limit_reached';
            break;
          case "sms_send_fail":
            this.msg = 'api_error_sms_send_fail';
            break;
          case "bad_sms_code":
            this.msg = 'api_error_bad_sms_code';
            break;
          default:
            this.hideBody = true;
            this.msg = 'system_error_ocurred';
            break;
        }
      },
      closeAgreementClicked() {
        this.showAgreement = false;
      },
      openAgreementClicked() {
        this.showAgreement = true;
      },
      configLoaded(config) {
        this.config = config;
        this.loading_config = false;
        this.hasAccess && this.start_ad_timing();
      },
      gotAccess() {
        this.hasAccess = true;
        this.loading_config || this.start_ad_timing();
      },
      start_ad_timing() {
        if(!this.config) {
          this.redirect_url = '';
          this.redirect();
          return;
        }
        if (!this.config.ad_id) {
          this.redirect_url = this.config.redirect_url || '';
          this.redirect();
          return;
        }
        this.redirect_url = this.config.redirect_url;
        ajax.sendJSONRequest({
          method: "PUT",
          url: API_URL_PREFIX + '/client/event/ad/show',
          data: {ad_id: this.config.ad_id},
          onSuccess() {},
          onError() {},
        });
        this.ad_timer_id = setInterval(()=> {
          this.config.ad_duration--;
          if(this.config.ad_duration <= 0) {
            clearInterval(this.ad_timer_id);
            this.redirect();
          }
        }, 1000);
      },
      adClicked() {
        if(this.config && this.config.ad_link_url && this.config.ad_link_url !== '#') {
          this.ad_timer_id && clearInterval(this.ad_timer_id);
          this.redirect_url = this.config.ad_link_url;
          let self = this;
          ajax.sendJSONRequest({
            method: "PUT",
            url: API_URL_PREFIX + '/client/event/ad/click',
            data: {ad_id: this.config.ad_id},
            onSuccess() {self.redirect();},
            onError() {self.redirect();},
          });
        }
      },
      redirect() {
        let f, i;
        f = document.createElement("form");
        f.action = qpars.llink;
        f.method = "post";
        i = document.createElement("input");
        i.name = "dst";
        i.value = this.redirect_url;
        if (!i.value || i.value === '#') {
          i.value = 'http://google.com';
        }
        f.appendChild(i);
        i = document.createElement("input");
        i.name = "username";
        i.value = this.accessPhone + "_" + Math.floor(Math.random() * 99999);
        f.appendChild(i);
        i = document.createElement("input");
        i.name = "password";
        i.value = "password";
        f.appendChild(i);
        f.style.display = 'none';
        document.body.appendChild(f);
        f.submit();
      },
    },

    created() {
      let self = this;
      ajax.sendRequest({
        url: API_URL_PREFIX + '/captive/config',
        onSuccess(st, data) {
          self.configLoaded(data);
        },
        onError() {
          console.error(arguments);
          self.configLoaded(null);
        },
      });
      ajax.sendJSONRequest({
        method: 'POST',
        url: API_URL_PREFIX + '/client/check',
        data: {ip: qpars.ip, mac: qpars.mac},
        onSuccess(st, data) {
          self.loading = false;
          if (data.has_access === true) {
            self.msg = 'already_have_access';
            self.accessPhone = data.phone;
            self.gotAccess();
          } else {
            self.hasAccess = false;
            self.formStep = 1;
          }
        },
        onError: this.onAPIError.bind(this),
      });
    }

  }
</script>

<style>
  * {
    box-sizing: border-box;
    -moz-box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  html {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    font-size: 16px;
    background-color: white;
  }

  body {
    text-align: center;
  }

  #app {
    width: 100%;
    height: 100%;
    padding: 5px;
  }

  #langbar {
    list-style: none;
    margin: 0;
    padding: 0;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    cursor: default;
  }

  #langbar > li {
    display: inline-block;
    margin-top: 5px;
    padding: 2px 14px;
    font-size: .9rem;
    color: #4228c7;
    border-radius: 8px;
    cursor: pointer;
  }

  #langbar > li.selected {
    color: white;
    background-color: #728bc7;
  }

  .block {
    margin-top: 15px;
  }

  .spec {
    color: #5931ff
  }

  #logo {
    display: inline-block;
    vertical-align: middle;
    max-width: 100%;
    max-height: 256px;
  }

  #header {
    text-align: center;
    line-height: 22px;
  }

  #form {
    text-align: center;
    white-space: nowrap;
  }

  .form > * {
    display: inline-block;
    vertical-align: middle;
  }

  .form > input {
    font-size: 1rem;
    padding: 8px 8px 6px;
    border-radius: 8px;
    border: 1px solid #bbb;
  }

  .action {
    text-align: center;
    white-space: nowrap;
  }

  .action > * {
    display: inline-block;
    vertical-align: middle;
  }

  .bt1 {
    display: inline-block;
    vertical-align: middle;
    margin-right: 10px;
    padding: 10px 20px;
    border-radius: 3px;
    background-color: #427fed;
    font-size: .8rem;
    font-weight: bold;
    color: white;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    cursor: pointer;
    transition: background-color .3s;
  }

  .bt2 {
    display: inline-block;
    vertical-align: middle;
    font-size: .8rem;
    font-weight: bold;
    color: green;
    text-decoration: underline;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    cursor: pointer;
  }

  #msg {
    margin-top: 15px;
    text-align: center;
    font-size: 14px;
    color: #ff4b69;
  }

  .agreement_note {
    margin-top: 5px;
    font-size: .9rem;
    line-height: 20px;
  }

  .agreement_note_button {
    display: inline-block;
    color: green;
    text-decoration: underline;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    cursor: pointer;
  }

  #agreement {
    display: inline-block;
    max-width: 450px;
    margin: 4px;
    padding: 10px;
    font-size: .9rem;
    border-radius: 3px;
    -webkit-box-shadow: 0 1px 7px -2px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 0 1px 7px -2px rgba(0, 0, 0, 0.75);
    box-shadow: 0 1px 7px -2px rgba(0, 0, 0, 0.75);
  }

  #agreement > h1 {
    font-size: 1rem;
    font-weight: bold;
    margin-top: 15px;
  }

  #agreement > article {
    text-align: left
  }

  #agreement > footer {
    margin-top: 15px;
  }

  #ad {
    width: 100%;
    height: 100%;
  }

  #ad-container {
    width: 100%;
    height: 100%;
  }

  #ad-counter {
    height: 30px;
    line-height: 30px;
    text-align: center;
    vertical-align: middle;
  }

  #ad-img {
    object-fit: contain;
    width: 100%;
    height: calc(100% - 30px);
    vertical-align: middle;
    cursor: pointer;
  }

  @media screen and (max-device-width: 480px) {
    #langbar > li {
      padding: 2px 8px;
    }

    #logo {
      max-height: 140px;
    }

    #header {
      font-size: .9rem;
    }

    #header > br {
      display: none;
    }

    #msg {
      font-size: .9rem;
    }
  }

</style>
