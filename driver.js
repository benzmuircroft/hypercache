const fs = require('fs').promises;
// const Corestore = require('corestore');
const Hyperdrive = require('hyperdrive');
const copy = require(path.join(__dirname, '..', 'util', 'copy.js'))({ proto: true, circles: false });
const CODE = require(path.join(__dirname, '..', 'util', 'CODE.js'));
const fast = require(path.join(__dirname, '..', 'util', 'to-fast-properties.js'));
const dbUG = require(path.join(__dirname, '..', 'util', 'dbUG.js'));
const cc = require(path.join(__dirname, '..', 'util', 'cc.js'));
const SAFE = { stringify: require(path.join(__dirname, '..', 'node_modules', 'json-stringify-safe')) };
const EMPTY = { NET: 'live' };
const GUB = {
  PUSH: function (BUG, o) {
    if (BUG?.ACTIVE) {
      BUG.PUSH(o);
    }
    // return
  }
};

await fs.writeFile(path.join(__dirname, '..', 'SETTINGS', 'BUGS', 'test.json'), JSON.stringify({ location: 'correct!' }, null, 4), 'utf8');


function date(d) {
  if (!d) { d = new Date(); }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = d.getDay();
  const date = d.getDate();
  const month = d.getMonth();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  let seconds = d.getSeconds();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (!hours) hours = 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  const strTime = hours + ':' + minutes + ':' + seconds + ampm;
  return days[day] + ' ' + date + ' ' + months[month] + ' ' + strTime;
}
const db = module.exports = {
  name: undefined,
  previous: 'protect',
  current: 'running',
  manual_override_cb: undefined,
  streamFile: function(path, content) {
    return new Promise((resolve) => {
      const ws = db.drive.createWriteStream(path);
      ws.write(content);
      ws.end();
      ws.once('close', () => resolve());
    })
  },
  log: function (BUG, d) {
    if (typeof d == 'string' && d.indexOf('(Too Long To Log)') !== -1) {
      d = d.split(']=');
      d[1] = d[1].split('>#>')[1];
      d = d[0] + ']=(Too Long To Log) >#>' + d[1];
    }
    d = d.replace(/>#>/g, ' > ').replace(/<#</g, '');
    if (global.L) { global.L.log(d); }
    if (BUG?.AUDIT) { GUB.PUSH(BUG, d); }
    // return
  },
  mode: function (previous, current) {
    db.previous = previous;
    db.current = current;
    if (previous == 'protect' && current == 'running') {
      db.protect = false;
      db.log(EMPTY, 'db mode is ' + db.current);
      // return
    }
    else if (previous == 'running' && current == 'protect') {
      db.protect = true;
      db.log(EMPTY, 'db mode is ' + db.current);
      // return
    }
    else if (['running', 'protect'].indexOf(previous) !== -1 && current == 'shutdown') {
      db.protect = true;
      db.log(EMPTY, 'db mode is ' + db.current);
      db.mode = function (ignore) { };
      db.shutdown = [setInterval(function () {
        let exit = true;
        for (let c in db.que) {
          for (let o in db.que[c]) { if (db.que[c][o]?.length) { exit = false; break; } }
        }
        db.shutdown[1] += 1;
        if (exit || db.shutdown[1] > 30) {
          clearInterval(db.shutdown[0]);
          db.shutdown = function () {
            throw new Error('CRASH!');
          };
          setTimeout(function () { db.shutdown(); }, 20000);
        }
      }, 1000), 0];
      // return
    }
  },
  load: async function (name, store) {
    db.log(EMPTY, 'cache.db v 1.0.3');
    db.name = name;
    // const store = new Corestore(`./db/${name}`);
    // await store.ready();
    db.drive = new Hyperdrive(store); // need keypair or key ?
    await db.drive.ready();
    const trim = db.drive.db.core.length; // keep tiny on startup
    const view = db.drive.db.createReadStream();
    for await (const entry of view) {
      await db.drive.db.put(entry.key.toString(), entry.value.toString());
    }
    await db.drive.db.core.clear(1, trim);
    db['live'] = require(path.join(__dirname, '..', 'db', db.name + '_dbs.json'));
    db.prevent = copy(db['live']);
    db.saver = copy(db['live']);
    db.debug = copy(db['live']);
    db.que = copy(db['live']);
    db.block = copy(db['live']);
    for await (const F of db['live']) {
      for await (const _id of db.drive.list(`/${F}`, { recursive: false })) {
        db['live'][F][_id] = JSON.parse((await db.drive.get(`/${F}/${_id}`)).toString());
      }
    }
  },
  del: async function (BUG, F, _id, caller) {
    // verifying the type of the parameters passed in to the function. It is checking that F is a string, _id is a string and caller is a string. If any of these are not true, an error is thrown. 
    if (typeof F !== 'string' || typeof _id !== 'string' || typeof caller !== 'string') { throw new Error(['malformed params: ', 'F:', typeof F, '_id:', typeof _id, 'caller:', typeof caller, 'caller:', caller]); }
    else if (F == 'test') { db.change(BUG, F, _id); } // If F is equal to "test", the db.change function is called
    else if (!db[BUG.NET][F]) { // if the item does not exist, an error is logged and the db.mode function is called.
      db.log(BUG, `db.del[` + BUG.NET + `][` + F + `] F NO EXIST >#>` + caller + `<#< ` + (new Error().stack.replace('Error', ':')));
      db.mode(db.current, 'shutdown');
    }
    else if (db[BUG.NET][F][_id] == undefined) {
      db.log(BUG, `db.del[` + BUG.NET + `][` + F + `][` + _id + `] _id NO EXIST >#>` + caller + `<#< ` + (new Error().stack.replace('Error', ':')));
      db[BUG.NET][F][_id] = {};
      if (BUG.NET == 'live') {
        delete db.debug[F][_id];
        delete db.block[F][_id];
        delete db.prevent[F][_id];
        setTimeout(function (db, BUG, F, _id) {
          delete db[BUG.NET][F][_id];
        }, 4181, db, BUG, F, _id);
      }
    }
    else {
      const key = F + '/' + _id;
      if (BUG.BEFORE && Object.keys(BUG.BEFORE[BUG.NET]).indexOf(key) == -1) { // not seen (need to snapshot)
        BUG.INDEX[BUG.NET][key] = 'G.db[' + BUG.NET + '][' + F + '][' + _id + ']';
        BUG.BEFORE[BUG.NET][key] = copy(db['live'][F][_id]); // temp uses live
        if (BUG.NET !== 'live') { db[BUG.NET][F][_id] = copy(BUG.BEFORE[BUG.NET][key]); } // the actual snapshot!
        BUG.LOCKED(BUG, F, _id);
      }
      if (BUG.NET == 'live') { db.prevent[F][_id] = 'Deleted by: ' + caller + ' and should stay deleted!'; }
      try {
        for (let k in db[BUG.NET][F][_id]) {
          if (k == _id) { db[BUG.NET][F][_id][k] = null; }
          else if (typeof db[BUG.NET][F][_id][k] == 'string') {
            if (isNaN(db[BUG.NET][F][_id][k])) { db[BUG.NET][F][_id][k] = ''; }
            else { db[BUG.NET][F][_id][k] = "0" }
          }
          else if (typeof db[BUG.NET][F][_id][k] == 'number') {
            db[BUG.NET][F][_id][k] = 0;
          }
          else if (Array.isArray(db[BUG.NET][F][_id][k])) {
            db[BUG.NET][F][_id][k] = [];
          }
          else if (typeof db[BUG.NET][F][_id][k] == 'object') {
            db[BUG.NET][F][_id][k] = {};
          }
        }
      }
      catch (e) { }
      if (BUG.NET == 'live') {
        db[BUG.NET][F][_id].DELETED = 'Deleted by: ' + caller + ' and should stay deleted!';
        db.unsort(BUG, F, _id);
        await db.drive.del(`/${F}/${_id}`);
        clearTimeout(db.saver[F][_id]);
        db.saver[F][_id] = null;
        delete db.saver[F][_id];
        db.log(BUG, `db.del[` + BUG.NET + `][` + F + `][` + _id + `] OK >#>` + caller + `<#<`);
        delete db[BUG.NET][F][_id];
        clearTimeout(db.debug[F][_id]);
        db.debug[F][_id] = null;
        G.shell.exec('sleep 0.610;');
        delete db.debug[F][_id];
        delete db.block[F][_id];
        delete db.prevent[F][_id];
        db.change(BUG, F, _id);
      }
    }
  },
  rec: function (BUG, F, _id, caller) {
    if (typeof F !== 'string' || typeof _id !== 'string' || typeof caller !== 'string') { throw new Error(['malformed params: ', 'F:', typeof F, '_id:', typeof _id, 'caller:', typeof caller, 'caller:', caller]); }
    else if (BUG.NET !== 'live') {
      db.change(BUG, F, _id);
    }
    else if (!db[BUG.NET][F]) {
      db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `] F NO EXIST >#>` + caller + `<#< ` + (new Error().stack.replace('Error', ':')));
      db.mode(db.current, 'shutdown');
    }
    else if (!db[BUG.NET][F][_id]) {
      db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `][` + _id + `] _id NO EXIST >#>` + caller + `<#< ` + (new Error().stack.replace('Error', ':')));
      db.mode(db.current, 'shutdown');
    }
    else {
      if (typeof db.prevent[F][_id] !== 'string') { delete db.prevent[F][_id]; } // stops an odd bug (last seen after adding divi or logging in after)
      let e;
      try { JSON.parse(SAFE.stringify(db[BUG.NET][F][_id])); } catch (error) { e = error.stack; }
      if ([undefined, 'undefined'].indexOf(db[BUG.NET][F][_id]) !== -1) { e = e ? (e + '\nJSON.parse result is also undefined') : (new Error('JSON.parse result is undefined').stack); }
      if (e) {
        db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `][` + _id + `] JSON ERROR >#>` + caller + `<#< ` + (e.replace('Error', ':')));
        //db.streamFile(path.join(__dirname, '..', 'SETTINGS', 'BUGS', F + '.' + _id + '.db'), new Error('NON-JSON').stack, 'utf-8', function () {});
      }
      else if (!db.prevent[F][_id]) {
        if (db.que[F][_id] && db.que[F][_id].length > 4) {
          db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `][` + _id + `] SAVE AT THE END OF THE QUEUE ... >#>` + caller + `<#<`);
        }
        else {
          clearTimeout(db.saver[F][_id]);
          db.saver[F][_id] = setTimeout(function (F, _id) { db.save(F, _id); }, 377, F, _id);
          db.saver[F][_id].for = 'db[' + BUG.NET + ']' + F + '.' + _id;
        }
        db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `][` + _id + `] OK >#>` + caller + `<#<`);
        db.change(BUG, F, _id);
        return 'saving';
      }
      else {
        db.log(BUG, `db.rec[` + BUG.NET + `][` + F + `][` + _id + `] BOUNCE >#>` + caller + `<#<\n` + db.prevent[F][_id]);
        db.change(BUG, F, _id);
        return 'bounce';
      }
    }
  },
  save: async function (F, _id) {
    delete db.saver[F][_id];
    await db.streamFile(`/${F}/${_id}`, SAFE.stringify(db['live'][F][_id], undefined, '\t'), 'utf8');
    await db.drive.get(`/${F}/${_id}`); // needed ?
  },
  protect: undefined, // if this is on db.wait will not let anything new pass through
  prevent: undefined, // cant add files during/after delete
  block: undefined, // tell users to join que
  saver: undefined, // don't save straight away (used only for saving)
  debug: undefined, // print caller if wait gets stuck
  que: undefined, // cb queue
  wait: function (BUG, F, _id, caller, cb) {
    if (db[BUG.NET][F][_id] == undefined) {
      cb(BUG);
    }
    else if (db[BUG.NET][F][_id].DELETED) {
      db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] ERR ALREADY DELETED!!! >#>` + caller + `<#<`);
      cb(BUG); //should cb be alowed here?
    }
    else if (!db.protect) {
      db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] ... >#>` + caller + `<#<`);
      if (typeof F !== 'string' || typeof _id !== 'string' || typeof caller !== 'string' || typeof cb !== 'function') {
        throw new Error('malformed params: F=' + (typeof F) + ' _id=' + (typeof _id) + ' caller=' + (typeof caller) + ' cb=' + (typeof cb) + ' caller=' + caller);
      }
      const key = F + '/' + _id;
      if (BUG.BEFORE && Object.keys(BUG.BEFORE[BUG.NET]).indexOf(key) == -1) { // not seen (need to snapshot)
        BUG.INDEX[BUG.NET][key] = 'G.db[' + BUG.NET + '][' + F + '][' + _id + ']';
        BUG.BEFORE[BUG.NET][key] = copy(db['live'][F][_id]); // temp uses live
        if (BUG.NET !== 'live') { db[BUG.NET][F][_id] = copy(BUG.BEFORE[BUG.NET][key]); } // the actual snapshot!
        BUG.LOCKED(BUG, F, _id);
      }
      if (!db.block[F][_id] || ((BUG.STEPS || ['live'])[0] !== 'live' && BUG.NET == 'live' && db.block[F][_id] && db.block[F][_id].indexOf((BUG.STEPS || ['NoCoNfLiCt'])[0]) == 8)) { // can do now (if not blocked OR test was started but is live now and blocked but blocked by the test)
        db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] GO! >#>` + caller + `<#<`);
        db.block[F][_id] = 'db.wait[' + BUG.NET + '][' + F + '][' + _id + '] at ' + caller + ' ' + date() + (new Error().stack.replace('Error', 'Stack'));
        clearTimeout(db.debug[F][_id]);
        db.debug[F][_id] = setTimeout(function (BUG, F, _id, caller) {
          db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] NEVER UNBLOCKED, DID THE JOB LAST TOO LONG? >#>` + caller + `<#< (Blocked by self ` + db.block[F][_id] + `?)`);
        }, 46368, BUG, F, _id, caller);
        cb(BUG);
      }
      else { // add to que
        if (BUG.OPTS && typeof BUG.OPTS.call == 'string' && typeof db.moretime == 'function') {
          let ms = 2000;
          for (let i in (db.que[F][_id] || [])) {
            ms += 2000;
          }
          db.moretime(BUG, ms);
        }
        if (!db.que[F][_id] || !Array.isArray(db.que[F][_id])) { db.que[F][_id] = []; }
        db.que[F][_id] = db.que[F][_id].concat([[cb, caller, BUG, new Error().stack.replace('Error', 'Stack')]]);
        db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] ... QUEUED [` + db.que[F][_id].length + `] >#>` + (new Error().stack.replace('Error', caller)) + `<#< (Blocked by ` + db.block[F][_id] + `?)`);
      }
    }
  },
  change: function (BUG, F, _id) {
    if (typeof F !== 'string' || typeof _id !== 'string') { throw new Error('malformed params: F=' + (typeof F) + ' _id=' + (typeof _id)); }
    clearTimeout(db.debug[F][_id]);
    db.debug[F][_id] = undefined; // quick
    delete db.debug[F][_id];
    db.block[F][_id] = undefined; // quick
    delete db.block[F][_id];
    if (db.que[F][_id]?.length) {
      setTimeout(function (BUG, F, _id) { db.shift(BUG, F, _id); }, 13, BUG, F, _id);
      if (BUG?.AUDIT) {
        BUG.AUDIT.push('db.change[' + BUG.NET + '][' + F + '][' + _id + '] EXIT <#<');
      }
    }
    else if (BUG?.AUDIT) {
      delete db.que[F][_id];
      BUG.AUDIT.push('db.change[' + BUG.NET + '][' + F + '][' + _id + '] EXIT <#< (end of queue for this db item)');
    }
  },
  shift: function (BUG, F, _id) {
    if (db.que[F][_id]?.length) {
      const next = db.que[F][_id].splice(0, 1)[0]; // same as shift
      const test = (Array.isArray(next) && typeof next[0] == 'function');
      db.log(BUG, 'db.shift[' + BUG.NET + '][' + F + '][' + _id + '] Can do next task? ' + test);
      if (test) {
        db.block[F][_id] = next[1] + ' ' + next[3]; // original caller + stack
        db.debug[F][_id] = setTimeout(function (BUG, F, _id, caller) {
          db.log(BUG, `db.wait[` + BUG.NET + `][` + F + `][` + _id + `] (QUEUED) THIS IS STILL BLOCKED, DID THE JOB LAST TOO LONG? >#>` + caller + `<#< (Blocked by ` + db.block[F][_id] + `?)`);
        }, 46368, BUG, F, _id, next[1]);
        next[0](next[2]); // return the next bug object
        if ((db.que[F][_id] || []).length == 0) { delete db.que[F][_id]; }
      }
      else if (db.que[F][_id]?.length) { db.shift(BUG, F, _id, undefined); }
    }
  },
  sorts: {},
  sort: function (BUG, F, cat, _id, val) {
    if (BUG.NET == 'live') {
      db.unsort(BUG, F, cat, _id);
      if (!db.sorts[F]) { db.sorts[F] = {}; }
      if (!db.sorts[F][cat]) { db.sorts[F][cat] = {}; }
      db.sorts[F][cat][_id] = val;
    }
    // return
  },
  unsort: function (BUG, F, _id) {
    if (BUG.NET == 'live') {
      const k = Object.keys((db.sorts[F] || {}));
      for (let i = 0, l = k.length; i < l; i += 1) {
        delete db.sorts[F]?.[k[i]]?.[_id];
      }
    }
    // return
  },
  calc: function (BUG, F, _id, x, operator, input, note) { // note is '( + name val )'
    const key = F + '/' + _id;
    if (BUG.BEFORE && Object.keys(BUG.BEFORE[BUG.NET]).indexOf(key) == -1) { // not seen (need to snapshot)
      BUG.INDEX[BUG.NET][key] = 'G.db[' + BUG.NET + '][' + F + '][' + _id + ']';
      BUG.BEFORE[BUG.NET][key] = copy(db['live'][F][_id]); // temp uses live
      if (BUG.NET !== 'live') { db[BUG.NET][F][_id] = copy(BUG.BEFORE[BUG.NET][key]); } // the actual snapshot!
    }
    let before, after;
    if (x[4] !== undefined) {
      before = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]]);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]] = cc[operator](db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]], input);
      after = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `][` + x[4] + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    else if (x[3] !== undefined) {
      before = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]]);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]] = cc[operator](db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]], input);
      after = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    else if (x[2] !== undefined) {
      before = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]]);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]] = cc[operator](db[BUG.NET][F][_id][x[0]][x[1]][x[2]], input);
      after = copy(db[BUG.NET][F][_id][x[0]][x[1]][x[2]]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    else if (x[1] !== undefined) {
      before = copy(db[BUG.NET][F][_id][x[0]][x[1]]);
      db[BUG.NET][F][_id][x[0]][x[1]] = cc[operator](db[BUG.NET][F][_id][x[0]][x[1]], input);
      after = copy(db[BUG.NET][F][_id][x[0]][x[1]]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    else if (x[0] !== undefined) {
      before = copy(db[BUG.NET][F][_id][x[0]]);
      db[BUG.NET][F][_id][x[0]] = cc[operator](db[BUG.NET][F][_id][x[0]], input);
      after = copy(db[BUG.NET][F][_id][x[0]]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    else {
      before = copy(db[BUG.NET][F][_id]);
      db[BUG.NET][F][_id] = cc[operator](db[BUG.NET][F][_id], input);
      after = copy(db[BUG.NET][F][_id]);
      db.log(BUG, `db.calc[` + BUG.NET + `][` + F + `][` + _id + `] ` + before + ` ` + (operator == 'add' ? `+` : `-`) + ` ` + input + ` = ` + after + ` >#>` + note + `<#<`);
    }
    dbUG(F, x, after);
    // return
  },
  mod: function (BUG, F, _id, x, answer, note) { // note is '( + name val )'
    const key = F + '/' + _id;
    if (BUG.BEFORE && Object.keys(BUG.BEFORE[BUG.NET]).indexOf(key) == -1) { // not seen (need to snapshot)
      BUG.INDEX[BUG.NET][key] = 'G.db[' + BUG.NET + '][' + F + '][' + _id + ']';
      BUG.BEFORE[BUG.NET][key] = copy(db['live'][F][_id]); // temp uses live
      if (BUG.NET !== 'live') { db[BUG.NET][F][_id] = copy(BUG.BEFORE[BUG.NET][key]); } // the actual snapshot!
    }
    dbUG(F, x, answer);
    if (x[4] !== undefined) {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `][` + x[4] + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]] = answer;
    }
    else if (x[3] !== undefined) {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]] = answer;
    }
    else if (x[2] !== undefined) {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id][x[0]][x[1]][x[2]] = answer;
    }
    else if (x[1] !== undefined) {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id][x[0]][x[1]] = answer;
    }
    else if (x[0] !== undefined) {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id][x[0]] = answer;
    }
    else {
      db.log(BUG, `db.mod[` + BUG.NET + `][` + F + `][` + _id + `]=` + answer + ` >#>` + note + `<#<`);
      db[BUG.NET][F][_id] = answer;
    }
    // return
  },
  cut: function (BUG, F, _id, x) {
    const key = F + '/' + _id;
    if (BUG.BEFORE && Object.keys(BUG.BEFORE[BUG.NET]).indexOf(key) == -1) { // not seen (need to snapshot)
      BUG.INDEX[BUG.NET][key] = 'G.db[' + BUG.NET + '][' + F + '][' + _id + ']';
      BUG.BEFORE[BUG.NET][key] = copy(db['live'][F][_id]); // temp uses live
      if (BUG.NET !== 'live') { db[BUG.NET][F][_id] = copy(BUG.BEFORE[BUG.NET][key]); } // the actual snapshot!
    }
    if (x[4] !== undefined) {
      db.log(BUG, `db.cut[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `][` + x[4] + `]`);
      delete db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]][x[4]];
    }
    else if (x[3] !== undefined) {
      db.log(BUG, `db.cut[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `][` + x[3] + `]`);
      delete db[BUG.NET][F][_id][x[0]][x[1]][x[2]][x[3]];
    }
    else if (x[2] !== undefined) {
      db.log(BUG, `db.cut[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `][` + x[2] + `]`);
      delete db[BUG.NET][F][_id][x[0]][x[1]][x[2]];
    }
    else if (x[1] !== undefined) {
      db.log(BUG, `db.cut[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `][` + x[1] + `]`);
      delete db[BUG.NET][F][_id][x[0]][x[1]];
    }
    else if (x[0] !== undefined) {
      db.log(BUG, `db.cut[` + BUG.NET + `][` + F + `][` + _id + `][` + x[0] + `]`);
      delete db[BUG.NET][F][_id][x[0]];
    }
    // return
  }
};
