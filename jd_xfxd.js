/*
京东-幸福小店
cron 18 0 * * * jd_xfxd.js
活动入口：京东APP->我的->会员店->天天领京豆->幸福小店
TG频道：https://t.me/tom_210120
*/
if (process.env.XFXD != "true") {
  console.log(
    "默认不运行,设置XFXD为true来运行\n需要手动过新手任务后运行\n入口:APP-我的-左上角plus专属-会员店->天天领京豆->幸福小店\n可能黑号，建议只跑一次"
  );
  return;
}
const $ = new Env("京东幸福小店");
const jsname = "京东幸福小店";
const logDebug = 0;

const notifyFlag = 1; //0为关闭通知，1为打开通知,默认为1
const notify = $.isNode() ? require("./sendNotify") : "";
let notifyStr = "";

let httpResult; //global buffer

let userCookie = process.env.JD_COOKIE;
let userCookieArr = [];
let userList = [];

let userIdx = 0;
let userCount = 0;

let beanNum = [0, 10, 20, 50, 100, 500, 1000, 5000];

///////////////////////////////////////////////////////////////////
class UserInfo {
  constructor(str) {
    this.index = ++userIdx;
    this.cookie = str;
    this.lkToken = "";
    this.save = "";
    this.nickname = str.match(/pt_pin=(.+?);/)[1];
  }

  async getToken() {
    let url = `https://jdjoy.jd.com/saas/framework/encrypt/pin?appId=ef6d90c162ef87d2c0d069ba3543d8ca`;
    let body = ``;
    let urlObject = populateUrlObject(url, "https://prodev.m.jd.com", body);
    urlObject.headers.Cookie = this.cookie;
    await httpRequest("post", urlObject);
    let result = httpResult;
    if (!result) return;
    //console.log(result)
    if (result.success == true) {
      this.lkToken = result.data.lkToken;
      console.log(`账号[${this.index}]获取到token`);
    } else {
      console.log(`账号[${this.index}]获取token失败: ${result.errorMessage}`);
    }
  }

  async getSaveByToken() {
    let url = `https://jd-plusshop-7goyzspef1de45ca-1307535713.ap-shanghai.app.tcloudbase.com/main`;
    let body = `{"method":"save/getSaveByToken","data":{"lkToken":"${this.lkToken}"},"isPre":false}`;
    let urlObject = populateUrlObject(
      url,
      "https://jdhy.gamecatstudio.com",
      body
    );
    await httpRequest("post", urlObject);
    let result = httpResult;
    if (!result) return;
    //console.log(result)
    if (result.success == true) {
      this.save = JSON.parse(result.data.save);
      if (!this.save) {
        console.log(
          `账号[${this.index}]未获取到数据，此活动只对plus会员开放，请先手动进入游戏过新手引导`
        );
        return;
      }
      this.pin = result.data.pin;
      this.uid = result.data.uid;
      console.log(`账号[${this.index}]获取到数据`);
    } else {
      console.log(`账号[${this.index}]获取数据失败: ${result.errorMessage}`);
    }
  }

  async updateSave() {
    let url = `https://jd-plusshop-7goyzspef1de45ca-1307535713.ap-shanghai.app.tcloudbase.com/main`;
    this.save.items.data["101001003"] =
      700000 + Math.floor(Math.random() * 100000);
    this.save.level = 30; //等级
    this.save.items.data["101002002"] = 20 + Math.floor(Math.random() * 100000); //道具快速收益
    this.save.items.data["101002001"] = 9999;
    this.save.beanRecord = {};
    this.save.updateVersion += 1;
    let body = {
      data: JSON.stringify(this.save),
      isPre: false,
      method: "save/updateSave",
      uid: this.uid,
    };
    body = JSON.stringify(body);
    let urlObject = populateUrlObject(
      url,
      "https://jdhy.gamecatstudio.com",
      body
    );
    await httpRequest("post", urlObject);
    let result = httpResult;
    if (!result) return;
    //console.log(result)
  }

  async sendBean(id) {
    let url = `https://jd-plusshop-7goyzspef1de45ca-1307535713.ap-shanghai.app.tcloudbase.com/main`;
    let body = `{"uid":"${this.uid}","method":"lk/sendBean","data":{"lkToken":"${this.lkToken}","beanId":"${id}"},"isPre":false}`;
    let urlObject = populateUrlObject(
      url,
      "https://jdhy.gamecatstudio.com",
      body
    );
    await httpRequest("post", urlObject);
    let result = httpResult;
    if (!result) return;
    //console.log(result)
    if (result.success == true) {
      console.log(`账号[${this.index}]兑换${beanNum[id]}京豆成功`);
    } else {
      console.log(
        `账号[${this.index}]兑换${beanNum[id]}京豆失败: ${result.errorMessage}`
      );
    }
  }
}

!(async () => {
  if (typeof $request !== "undefined") {
    //console.log('没有重写')
  } else {
    if (!(await checkEnv())) return;

    console.log(
      "\n请先手动进游戏过了新手引导再跑脚本\n活动入口：京东APP->我的->会员店->天天领京豆->幸福小店\n目前应该每天只能换20豆和10豆两档了，如果兑换失败的，尝试换IP或者手动兑换吧"
    );
    // 只运行账号1
    userList = userList.slice(0, 1);
    for (let user of userList) {
      console.log(`\n=========== 开始账号 ${user.nickname} ===========`);

      await user.getToken();
      await $.wait(1000);

      await user.getSaveByToken();
      await $.wait(1000);

      if (!user.save) continue;

      await user.updateSave();
      await $.wait(1000);

      for (let id = 6; id > 0; id--) {
        await user.sendBean(id);
        await $.wait(1000);
      }
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

///////////////////////////////////////////////////////////////////
async function checkEnv() {
  if (userCookie) {
    let splitChar = "#";
    if (userCookie.indexOf("\n") > -1) splitChar = "\n";
    if (userCookie.indexOf("@") > -1) splitChar = "@";
    if (userCookie.indexOf("&") > -1) splitChar = "&";
    for (let userCookies of userCookie.split(splitChar)) {
      if (userCookies) userList.push(new UserInfo(userCookies));
    }
    userCount = userList.length;
  } else {
    console.log("未找到京东ck");
    return;
  }

  console.log(`共找到${userCount}个账号`);
  return true;
}

////////////////////////////////////////////////////////////////////
function populateUrlObject(url, origin, body = "") {
  let host = url.split("//")[1].split("/")[0];
  let urlObject = {
    url: url,
    headers: {
      Host: host,
      Origin: origin,
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      Accept: "*/*",
      "User-Agent":
        "jdapp;iPhone;10.3.4;;;M/5.0;appBuild/167945;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22DWPsCWTuYzVvENOyENvvZwYzDzc2YJDtZNS5EWZwDzrwCJZrDNS5CK%3D%3D%22%2C%22sv%22%3A%22CJUkCK%3D%3D%22%2C%22iad%22%3A%22ENY1EUU2DJYjHOPQGI00GzDOBJrQG0SjGJu3CtHMDUU0CJY0%22%7D%2C%22ts%22%3A1643203257%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;",
      Referer: origin,
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    },
  };
  if (body) urlObject.body = body;
  return urlObject;
}

async function httpRequest(method, url) {
  httpResult = null;
  if (method == "post") {
    url.headers["Content-Type"] = "application/x-www-form-urlencoded";
    url.headers["Content-Length"] = url.body ? url.body.length : 0;
  }
  return new Promise((resolve) => {
    $[method](url, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${method}请求失败`);
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            httpResult = JSON.parse(data);
            if (logDebug) console.log(httpResult);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    } else {
      console.log(data);
    }
  } catch (e) {
    console.log(e);
    console.log(`服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

var Base64 = {
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  encode: function (e) {
    var t = "";
    var n, r, i, s, o, u, a;
    var f = 0;
    e = Base64._utf8_encode(e);
    while (f < e.length) {
      n = e.charCodeAt(f++);
      r = e.charCodeAt(f++);
      i = e.charCodeAt(f++);
      s = n >> 2;
      o = ((n & 3) << 4) | (r >> 4);
      u = ((r & 15) << 2) | (i >> 6);
      a = i & 63;
      if (isNaN(r)) {
        u = a = 64;
      } else if (isNaN(i)) {
        a = 64;
      }
      t =
        t +
        this._keyStr.charAt(s) +
        this._keyStr.charAt(o) +
        this._keyStr.charAt(u) +
        this._keyStr.charAt(a);
    }
    return t;
  },
  decode: function (e) {
    var t = "";
    var n, r, i;
    var s, o, u, a;
    var f = 0;
    e = e.replace(/[^A-Za-z0-9+/=]/g, "");
    while (f < e.length) {
      s = this._keyStr.indexOf(e.charAt(f++));
      o = this._keyStr.indexOf(e.charAt(f++));
      u = this._keyStr.indexOf(e.charAt(f++));
      a = this._keyStr.indexOf(e.charAt(f++));
      n = (s << 2) | (o >> 4);
      r = ((o & 15) << 4) | (u >> 2);
      i = ((u & 3) << 6) | a;
      t = t + String.fromCharCode(n);
      if (u != 64) {
        t = t + String.fromCharCode(r);
      }
      if (a != 64) {
        t = t + String.fromCharCode(i);
      }
    }
    t = Base64._utf8_decode(t);
    return t;
  },
  _utf8_encode: function (e) {
    e = e.replace(/rn/g, "n");
    var t = "";
    for (var n = 0; n < e.length; n++) {
      var r = e.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
      } else if (r > 127 && r < 2048) {
        t += String.fromCharCode((r >> 6) | 192);
        t += String.fromCharCode((r & 63) | 128);
      } else {
        t += String.fromCharCode((r >> 12) | 224);
        t += String.fromCharCode(((r >> 6) & 63) | 128);
        t += String.fromCharCode((r & 63) | 128);
      }
    }
    return t;
  },
  _utf8_decode: function (e) {
    var t = "";
    var n = 0;
    var r = (c1 = c2 = 0);
    while (n < e.length) {
      r = e.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
        n++;
      } else if (r > 191 && r < 224) {
        c2 = e.charCodeAt(n + 1);
        t += String.fromCharCode(((r & 31) << 6) | (c2 & 63));
        n += 2;
      } else {
        c2 = e.charCodeAt(n + 1);
        c3 = e.charCodeAt(n + 2);
        t += String.fromCharCode(
          ((r & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        n += 3;
      }
    }
    return t;
  },
};

function Env(t, e) {
  "undefined" != typeof process &&
    JSON.stringify(process.env).indexOf("GITHUB") > -1 &&
    process.exit(0);
  class s {
    constructor(t) {
      this.env = t;
    }
    send(t, e = "GET") {
      t = "string" == typeof t ? { url: t } : t;
      let s = this.get;
      return (
        "POST" === e && (s = this.post),
        "PUT" === e && (s = this.put),
        new Promise((e, i) => {
          s.call(this, t, (t, s, r) => {
            t ? i(t) : e(s);
          });
        })
      );
    }
    get(t) {
      return this.send.call(this.env, t);
    }
    post(t) {
      return this.send.call(this.env, t, "POST");
    }
    put(t) {
      return this.send.call(this.env, t, "PUT");
    }
  }
  return new (class {
    constructor(t, e) {
      (this.name = t),
        (this.http = new s(this)),
        (this.data = null),
        (this.dataFile = "box.dat"),
        (this.logs = []),
        (this.isMute = !1),
        (this.isNeedRewrite = !1),
        (this.logSeparator = "\n"),
        (this.startTime = new Date().getTime()),
        Object.assign(this, e),
        this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`);
    }
    isNode() {
      return "undefined" != typeof module && !!module.exports;
    }
    isQuanX() {
      return "undefined" != typeof $task;
    }
    isSurge() {
      return "undefined" != typeof $httpClient && "undefined" == typeof $loon;
    }
    isLoon() {
      return "undefined" != typeof $loon;
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t);
      } catch {
        return e;
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t);
      } catch {
        return e;
      }
    }
    getjson(t, e) {
      let s = e;
      const i = this.getdata(t);
      if (i)
        try {
          s = JSON.parse(this.getdata(t));
        } catch {}
      return s;
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e);
      } catch {
        return !1;
      }
    }
    getScript(t) {
      return new Promise((e) => {
        this.get({ url: t }, (t, s, i) => e(i));
      });
    }
    runScript(t, e) {
      return new Promise((s) => {
        let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        i = i ? i.replace(/\n/g, "").trim() : i;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        (r = r ? 1 * r : 20), (r = e && e.timeout ? e.timeout : r);
        const [o, h] = i.split("@"),
          a = {
            url: `http://${h}/v1/scripting/evaluate`,
            body: { script_text: t, mock_type: "cron", timeout: r },
            headers: { "X-Key": o, Accept: "*/*" },
          };
        this.post(a, (t, e, i) => s(i));
      }).catch((t) => this.logErr(t));
    }
    loaddata() {
      if (!this.isNode()) return {};
      {
        (this.fs = this.fs ? this.fs : require("fs")),
          (this.path = this.path ? this.path : require("path"));
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e);
        if (!s && !i) return {};
        {
          const i = s ? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(i));
          } catch (t) {
            return {};
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        (this.fs = this.fs ? this.fs : require("fs")),
          (this.path = this.path ? this.path : require("path"));
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e),
          r = JSON.stringify(this.data);
        s
          ? this.fs.writeFileSync(t, r)
          : i
          ? this.fs.writeFileSync(e, r)
          : this.fs.writeFileSync(t, r);
      }
    }
    lodash_get(t, e, s) {
      const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of i) if (((r = Object(r)[t]), void 0 === r)) return s;
      return r;
    }
    lodash_set(t, e, s) {
      return Object(t) !== t
        ? t
        : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []),
          (e
            .slice(0, -1)
            .reduce(
              (t, s, i) =>
                Object(t[s]) === t[s]
                  ? t[s]
                  : (t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}),
              t
            )[e[e.length - 1]] = s),
          t);
    }
    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
          r = s ? this.getval(s) : "";
        if (r)
          try {
            const t = JSON.parse(r);
            e = t ? this.lodash_get(t, i, "") : e;
          } catch (t) {
            e = "";
          }
      }
      return e;
    }
    setdata(t, e) {
      let s = !1;
      if (/^@/.test(e)) {
        const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
          o = this.getval(i),
          h = i ? ("null" === o ? null : o || "{}") : "{}";
        try {
          const e = JSON.parse(h);
          this.lodash_set(e, r, t), (s = this.setval(JSON.stringify(e), i));
        } catch (e) {
          const o = {};
          this.lodash_set(o, r, t), (s = this.setval(JSON.stringify(o), i));
        }
      } else s = this.setval(t, e);
      return s;
    }
    getval(t) {
      return this.isSurge() || this.isLoon()
        ? $persistentStore.read(t)
        : this.isQuanX()
        ? $prefs.valueForKey(t)
        : this.isNode()
        ? ((this.data = this.loaddata()), this.data[t])
        : (this.data && this.data[t]) || null;
    }
    setval(t, e) {
      return this.isSurge() || this.isLoon()
        ? $persistentStore.write(t, e)
        : this.isQuanX()
        ? $prefs.setValueForKey(t, e)
        : this.isNode()
        ? ((this.data = this.loaddata()),
          (this.data[e] = t),
          this.writedata(),
          !0)
        : (this.data && this.data[e]) || null;
    }
    initGotEnv(t) {
      (this.got = this.got ? this.got : require("got")),
        (this.cktough = this.cktough ? this.cktough : require("tough-cookie")),
        (this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()),
        t &&
          ((t.headers = t.headers ? t.headers : {}),
          void 0 === t.headers.Cookie &&
            void 0 === t.cookieJar &&
            (t.cookieJar = this.ckjar));
    }
    get(t, e = () => {}) {
      t.headers &&
        (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
        this.isSurge() || this.isLoon()
          ? (this.isSurge() &&
              this.isNeedRewrite &&
              ((t.headers = t.headers || {}),
              Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
            $httpClient.get(t, (t, s, i) => {
              !t && s && ((s.body = i), (s.statusCode = s.status)), e(t, s, i);
            }))
          : this.isQuanX()
          ? (this.isNeedRewrite &&
              ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
            $task.fetch(t).then(
              (t) => {
                const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o);
              },
              (t) => e(t)
            ))
          : this.isNode() &&
            (this.initGotEnv(t),
            this.got(t)
              .on("redirect", (t, e) => {
                try {
                  if (t.headers["set-cookie"]) {
                    const s = t.headers["set-cookie"]
                      .map(this.cktough.Cookie.parse)
                      .toString();
                    this.ckjar.setCookieSync(s, null),
                      (e.cookieJar = this.ckjar);
                  }
                } catch (t) {
                  this.logErr(t);
                }
              })
              .then(
                (t) => {
                  const {
                    statusCode: s,
                    statusCode: i,
                    headers: r,
                    body: o,
                  } = t;
                  e(null, { status: s, statusCode: i, headers: r, body: o }, o);
                },
                (t) => {
                  const { message: s, response: i } = t;
                  e(s, i, i && i.body);
                }
              ));
    }
    post(t, e = () => {}) {
      if (
        (t.body &&
          t.headers &&
          !t.headers["Content-Type"] &&
          (t.headers["Content-Type"] = "application/x-www-form-urlencoded"),
        t.headers && delete t.headers["Content-Length"],
        this.isSurge() || this.isLoon())
      )
        this.isSurge() &&
          this.isNeedRewrite &&
          ((t.headers = t.headers || {}),
          Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
          $httpClient.post(t, (t, s, i) => {
            !t && s && ((s.body = i), (s.statusCode = s.status)), e(t, s, i);
          });
      else if (this.isQuanX())
        (t.method = "POST"),
          this.isNeedRewrite &&
            ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
          $task.fetch(t).then(
            (t) => {
              const { statusCode: s, statusCode: i, headers: r, body: o } = t;
              e(null, { status: s, statusCode: i, headers: r, body: o }, o);
            },
            (t) => e(t)
          );
      else if (this.isNode()) {
        this.initGotEnv(t);
        const { url: s, ...i } = t;
        this.got.post(s, i).then(
          (t) => {
            const { statusCode: s, statusCode: i, headers: r, body: o } = t;
            e(null, { status: s, statusCode: i, headers: r, body: o }, o);
          },
          (t) => {
            const { message: s, response: i } = t;
            e(s, i, i && i.body);
          }
        );
      }
    }
    put(t, e = () => {}) {
      if (
        (t.body &&
          t.headers &&
          !t.headers["Content-Type"] &&
          (t.headers["Content-Type"] = "application/x-www-form-urlencoded"),
        t.headers && delete t.headers["Content-Length"],
        this.isSurge() || this.isLoon())
      )
        this.isSurge() &&
          this.isNeedRewrite &&
          ((t.headers = t.headers || {}),
          Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
          $httpClient.put(t, (t, s, i) => {
            !t && s && ((s.body = i), (s.statusCode = s.status)), e(t, s, i);
          });
      else if (this.isQuanX())
        (t.method = "PUT"),
          this.isNeedRewrite &&
            ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
          $task.fetch(t).then(
            (t) => {
              const { statusCode: s, statusCode: i, headers: r, body: o } = t;
              e(null, { status: s, statusCode: i, headers: r, body: o }, o);
            },
            (t) => e(t)
          );
      else if (this.isNode()) {
        this.initGotEnv(t);
        const { url: s, ...i } = t;
        this.got.put(s, i).then(
          (t) => {
            const { statusCode: s, statusCode: i, headers: r, body: o } = t;
            e(null, { status: s, statusCode: i, headers: r, body: o }, o);
          },
          (t) => {
            const { message: s, response: i } = t;
            e(s, i, i && i.body);
          }
        );
      }
    }
    time(t) {
      let e = {
        "M+": new Date().getMonth() + 1,
        "d+": new Date().getDate(),
        "H+": new Date().getHours(),
        "m+": new Date().getMinutes(),
        "s+": new Date().getSeconds(),
        "q+": Math.floor((new Date().getMonth() + 3) / 3),
        S: new Date().getMilliseconds(),
      };
      /(y+)/.test(t) &&
        (t = t.replace(
          RegExp.$1,
          (new Date().getFullYear() + "").substr(4 - RegExp.$1.length)
        ));
      for (let s in e)
        new RegExp("(" + s + ")").test(t) &&
          (t = t.replace(
            RegExp.$1,
            1 == RegExp.$1.length
              ? e[s]
              : ("00" + e[s]).substr(("" + e[s]).length)
          ));
      return t;
    }
    msg(e = t, s = "", i = "", r) {
      const o = (t) => {
        if (!t) return t;
        if ("string" == typeof t)
          return this.isLoon()
            ? t
            : this.isQuanX()
            ? { "open-url": t }
            : this.isSurge()
            ? { url: t }
            : void 0;
        if ("object" == typeof t) {
          if (this.isLoon()) {
            let e = t.openUrl || t.url || t["open-url"],
              s = t.mediaUrl || t["media-url"];
            return { openUrl: e, mediaUrl: s };
          }
          if (this.isQuanX()) {
            let e = t["open-url"] || t.url || t.openUrl,
              s = t["media-url"] || t.mediaUrl;
            return { "open-url": e, "media-url": s };
          }
          if (this.isSurge()) {
            let e = t.url || t.openUrl || t["open-url"];
            return { url: e };
          }
        }
      };
      this.isMute ||
        (this.isSurge() || this.isLoon()
          ? $notification.post(e, s, i, o(r))
          : this.isQuanX() && $notify(e, s, i, o(r)));
      let h = [
        "",
        "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3==============",
      ];
      h.push(e),
        s && h.push(s),
        i && h.push(i),
        console.log(h.join("\n")),
        (this.logs = this.logs.concat(h));
    }
    log(...t) {
      t.length > 0 && (this.logs = [...this.logs, ...t]),
        console.log(t.join(this.logSeparator));
    }
    logErr(t, e) {
      const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      s
        ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack)
        : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t);
    }
    wait(t) {
      return new Promise((e) => setTimeout(e, t));
    }
    done(t = {}) {
      const e = new Date().getTime(),
        s = (e - this.startTime) / 1e3;
      this.log(
        "",
        `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`
      ),
        this.log(),
        (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t);
    }
  })(t, e);
}
