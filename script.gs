function doPost(e) {                                                                                                                                                                                                                                                                                                                                                    
    var lock = LockService.getScriptLock();                                                                                                                                                                                                                                                                                                                             
    lock.waitLock(10000);

    try {
      var data = JSON.parse(e.postData.contents);
      var name = sanitize(data.name);

      // Rate limit: max 3 submissions per name per hour
      var cache = CacheService.getScriptCache();
      var key = 'rsvp_' + name.toLowerCase().replace(/\s+/g, '_');
      var count = parseInt(cache.get(key) || '0');
      if (count >= 3) {
        return ContentService.createTextOutput('RATE_LIMITED');
      }
      cache.put(key, String(count + 1), 3600); // expires in 1 hour

      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([
        sanitize(data.timestamp),
        name,
        sanitize(data.attending),
        sanitize(data.guests),
        sanitize(data.side),
        sanitize(data.message)
      ]);
      return ContentService.createTextOutput('OK');
    } finally {
      lock.releaseLock();
    }
  }

  function sanitize(value) {
    if (!value) return '';
    var str = String(value);
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    str = str.replace(/<[^>]*>/g, '');
    return str.substring(0, 1000);
  }