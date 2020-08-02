methods = [ 'E-Mail', 'SMS', 'Call', 'Card', 'Token', 'Yubikey', 
            'TOTP', 'HOTP', 'Mobile', 'Duo', 'Authy', 'Rublon' ];

function getTwoFactorMethods(site) {
  var results = [];
  $.each(methods, function(idx, method) {
    if (site[method] == 'X') {
      results.push(method);
    }
  });

  return results;
}

function scoreImage(score) { 
  if (score >= 85) {
    return 'best.png';
  } else if (score >= 70) {
    return 'better.png';
  } else if (score >= 50) {
    return 'meh.png';
  } else if (score >= 40) {
    return 'bad.png';
  } else {
    return 'worst.png';
  }
}

chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
  var tabURL = $.url(tabArray[0].url);

  if (tabURL.attr('host') != '') {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "massacre.json", true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var resp = JSON.parse(xhr.responseText);
        var match = null;

        $.each(resp, function(idx, obj) {
          var siteURL = $.url(obj["Web Site"]);
          var loginURL = $.url(obj["Login Page"]);
          var siteMatch = tabURL.attr('host').indexOf(siteURL.attr('host'));
          var loginMatch = tabURL.attr('host').indexOf(loginURL.attr('host'));

          if ((siteMatch >= 0) || (loginMatch >= 0)) {
            match = obj;
            return false;
          }
        });

        if (match == null) {
          $('#details').append('Site has not been scored.');
        } else {
          $('body').on('click', 'a', function(){
            chrome.tabs.create({url: $(this).attr('href')});
            return false;
          });

          $('#details').append('<h1>' + match.Company + '</h1>');
          
          $('#details').append('<strong><u>Two-Factor Authentication</u></strong>');
          $('#details').append('<br /><strong>Methods: </strong>' + getTwoFactorMethods(match).join(', '));
          $('#details').append('<br /><strong>Deployed: </strong>' + match['Deployed']);

          $('#details').append('<br /><br /><strong><u>HTTP Headers</u></strong><br />');
          $('#details').append('<strong>HSTS: </strong>' + (match['HSTS'] == 'Yes' ? 'Enabled' : 'Disabled'));
          $('#details').append('<br /><strong>CSP: </strong>' + (match['CSP'] == 'Enforce' ? 'Enabled' : 'Disabled'));
          $('#details').append('<br /><strong>X-Frame-Options: </strong>' + (match['X-FRAME'] != 'No' ? match['X-FRAME'] : 'Disabled'));
          $('#details').append('<br /><strong>X-XSS-Protection: </strong>' + (match['X-XSS'] != 'No' ? match['X-XSS'] : 'Disabled'));
          $('#details').append('<br /><strong>X-Content-Type-Options: </strong>' + (match['X-Content'] != 'No' ? match['X-Content'] : 'Disabled'));

          $('#details').append('<br /><br /><strong><u>Cookie Flags</u></strong><br />');
          $('#details').append('<strong>Secure: </strong>' + (match['Secure'] == 'Yes' ? 'Enabled' : 'Disabled'));
          $('#details').append('<br /><strong>HttpOnly: </strong>' + (match['HttpOnly'] == 'Yes' ? 'Enabled' : 'Disabled'));

          $('#details').append('<br /><br /><strong><u>SSL/TLS Deployment</u></strong><br />');
          $('#details').append('<strong>Score: </strong>' + match['SSL Login']);

          $('#score').append('<br /><img src="/icons/' + scoreImage(match.MASSACRE) + '" />');
          $('#score').append('<br /><strong>Score:</strong> ' + match.MASSACRE);

          $('#links').append('<br /><br /><strong><u>Related Links</u></strong>');
          $('#links').append('<br /><a href="' + match.Instructions + '">2FA Instructions</a> | <a href="' + match['Security Page'] + '">Company Security</a>');
        }
      }      
    }
    
    xhr.send(); 
  } else {
    $('#details').append('Invalid URL.');
  }
});
