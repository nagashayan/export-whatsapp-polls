/*
* moduleRaid v6
 * https://github.com/wwebjs/moduleRaid
 *
 * Copyright pixeldesu, pedroslopez, purpshell and other contributors
 * Licensed under the MIT License
 * https://github.com/wwebjs/moduleRaid/blob/master/LICENSE
 */

const moduleRaid = function () {
  moduleRaid.mID = Math.random().toString(36).substring(7);
  moduleRaid.mObj = {};

  moduleRaid.isComet = parseInt(window.Debug?.VERSION?.split(".")?.[1]) >= 3000;

  fillModuleArray = function () {
    if (parseFloat(window.Debug?.VERSION) < 2.3) {
      (window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client).push([
        [moduleRaid.mID], {}, function (e) {
          Object.keys(e.m).forEach(function (mod) {
            moduleRaid.mObj[mod] = e(mod);
          })
        }
      ]);
    } else {
      let modules = self.require('__debug').modulesMap;
      Object.keys(modules).filter(e => e.includes("WA")).forEach(function (mod) {
        let modulos = modules[mod];
        if (modulos) {
          moduleRaid.mObj[mod] = {
            default: modulos.defaultExport,
            factory: modulos.factory,
            ...modulos
          };
          if (Object.keys(moduleRaid.mObj[mod].default).length == 0) {
            try {
              self.ErrorGuard.skipGuardGlobal(true);
              Object.assign(moduleRaid.mObj[mod], self.importNamespace(mod));
            } catch (e) {
            }
          }
        }
      })
    }
  }

  fillModuleArray();


  get = function get(id) {
    return moduleRaid.mObj[id]
  }

  findModule = function findModule(query) {
    results = [];
    modules = Object.keys(moduleRaid.mObj);

    modules.forEach(function (mKey) {
      mod = moduleRaid.mObj[mKey];

      if (typeof mod !== 'undefined') {
        if (typeof query === 'string') {
          if (typeof mod.default === 'object') {
            for (key in mod.default) {
              if (key == query) results.push(mod);
            }
          }

          for (key in mod) {
            if (key == query) results.push(mod);
          }
        } else if (typeof query === 'function') {
          if (query(mod)) {
            results.push(mod);
          }
        } else {
          throw new TypeError('findModule can only find via string and function, ' + (typeof query) + ' was passed');
        }
      }
    })

    return results;
  }

  return {
    modules: moduleRaid.mObj,
    constructors: moduleRaid.cArr,
    findModule: findModule,
    get: get
  }
}

if (typeof module === 'object' && module.exports) {
  module.exports = moduleRaid;
} else {
  window.mR = moduleRaid();
}


let watchedGroup = null, lastSortVote

const initInterval = setInterval(() => {
  if ((window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client)) {
    const momentModule = window.mR.findModule(m =>
      m.default && m.default.defineLocale && m.default.locale
    )[0];

    if (momentModule && momentModule.default) {
      // כפיית הלוקל הנכון
      const userLocale = navigator.language || 'en';
      momentModule.default.locale(userLocale);

      // מניעת החלפת לוקל
      const originalDefineLocale = momentModule.default.defineLocale;
      momentModule.default.defineLocale = function (locale, config) {
        if (locale === 'pt-br') return;
        return originalDefineLocale.call(this, locale, config);
      };
    }
    window.mR = moduleRaid();
    // window.Store = Object.assign({}, window.mR.findModule(m => m.default && m.default.Chat)[0].default);
    window.Store = Object.assign({}, (!window.mR.findModule((m) => (m.Call && m.Chat)).length ? window.mR.findModule((m) => (m.default && m.default.Chat))[0].default : window.mR.findModule((m) => (m.Call && m.Chat))[0]));
    clearInterval(initInterval);
  }
}, 1000);


window.addEventListener('message', (e) => {
  if (e.data.export) {
    const votes = Store.PollVote.getModelsArray().filter(x => e.data.export.includes(x.__x_parentMsgKey._serialized))
    const poll = Store.Msg.getModelsArray().filter(m => m.type == "poll_creation").find(m => e.data.export.includes(m.__x_id.id))
    console.log(votes);
    console.log(poll);

    // Add the poll name as a row header
    let csv = `"Poll Name: ${poll.__x_pollName}"\n`;

    // Add column headers
    csv += "Name, Phone," + poll.__x_pollOptions.map(x => `"${x.name}"`).join(",") + "\n";

    const voteAccumulator = votes.reduce((acc, x) => {
      x.__x_selectedOptionLocalIds.forEach(y => acc[y] = (acc[y] || 0) + 1)
      return acc
    }, {})

    // Add total votes row with "Total" in English
    csv += ",Total,";

    for (let i = 0; i < poll.__x__pollOptionsToLinks.size; i++) {
      csv += voteAccumulator[i] ? voteAccumulator[i] : 0;
      csv += ",";
    }
    csv += "\n";

    // Add vote data rows
    csv += votes.map(x => {
      const rawName = Store.Contact.getModelsArray().find(y => y.__x_id.user == x.__x_sender.user).__x_pushname ||
        Store.Contact.getModelsArray().find(y => y.__x_id.user == x.__x_sender.user).__x_name || "";
      const sanitizedName = rawName.replace(/[^\w\s]/gi, '').trim();

      let res = `"${sanitizedName}"` + "," + x.__x_sender.user;
      for (let i = 0; i < poll.__x__pollOptionsToLinks.size; i++) {
        res += x.votes && x.votes.includes(i) ? ",X" : ",";
      }
      return res;
    }).join("\n");

    // Download the CSV
    const a = document.createElement("a");
    a.href = 'data:text/csv; charset=utf-8,' + encodeURIComponent("\uFEFF" + csv);
    a.download = "votes.csv";
    a.click();
  }
})
