(function(e, a) {
  if (!a.__SV) {
    let b = window; try {
      var c; let l; let i; const j = b.location; const g = j.hash; c = function(a, b) {
        return (l = a.match(RegExp(`${b}=([^&]*)`))) ? l[1] : null;
      }; g && c(g, 'state') && (i = JSON.parse(decodeURIComponent(c(g, 'state'))), i.action === 'mpeditor' && (b.sessionStorage.setItem('_mpcehash', g), history.replaceState(i.desiredHash || '', e.title, j.pathname + j.search)));
    } catch (m) {} let k; let h; window.mixpanel = a; a._i = []; a.init = function(b, c, f) {
      function e(b, a) {
        const c = a.split('.'); c.length == 2 && (b = b[c[0]], a = c[1]); b[a] = function() {
          b.push([a].concat(Array.prototype.slice.call(arguments, 0)));
        };
      } let d = a; typeof f !== 'undefined' ? d = a[f] = [] : f = 'mixpanel'; d.people = d.people || []; d.toString = function(b) {
        let a = 'mixpanel'; f !== 'mixpanel' && (a += `.${f}`); b || (a += ' (stub)'); return a;
      }; d.people.toString = function() {
        return `${d.toString(1)}.people (stub)`;
      }; k = 'disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.increment people.append people.union people.track_charge people.clear_charges people.delete_user'.split(' '); for (h = 0; h < k.length; h++)e(d, k[h]); a._i.push([b, c, f]);
    }; a.__SV = 1.2; b = e.createElement('script'); b.type = 'text/javascript'; b.async = !0; b.src = typeof MIXPANEL_CUSTOM_LIB_URL !== 'undefined' ? MIXPANEL_CUSTOM_LIB_URL : e.location.protocol === 'file:' && '//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'.match(/^\/\//) ? 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js' : '//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'; c = e.getElementsByTagName('script')[0]; c.parentNode.insertBefore(b, c);
  }
}(document, window.mixpanel || [])); mixpanel.init('9b3116182b3abbb878d993de071d1810');
