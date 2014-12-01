var http = require('https')
   ,jquery = require( 'jquery')
   ,jquery_help = require('./jquery_help')
   ,querystring = require('querystring')

var HOST_NAME = 'golantelecom.co.il';

function getFollowMeDetails ( follow_me_status, p_jquery )
{
  var $ = p_jquery;

  follow_me_status.isdn = $("#follow_me_isdn").val()
  follow_me_status.ndc = $("#follow_me_ndc :selected")
                                    .text()
                                    .replace("===","")
  follow_me_status.timeout = $("#follow_me-timeout :selected").text()
  follow_me_status.when_busy = jquery_help.is_checked($("#follow_me-when_busy"))
  follow_me_status.when_unavailable = jquery_help.is_checked($("#follow_me-when_unavailable"))
}

function getVoiceMailDetails ( follow_me_status, p_jquery )
{
  var $ = p_jquery

  follow_me_status.voicemail_lang = {}
  follow_me_status.voicemail_lang.val = $("#voicemail_lang :selected").val()
  follow_me_status.voicemail_lang.text = $("#voicemail_lang :selected").text()

  follow_me_status.timeout = $("#voicemail_timeout :selected").val()
  follow_me_status.when_busy = jquery_help.is_checked($("#voicemail_when_busy"))
  follow_me_status.when_unavailable = jquery_help.is_checked($("#voicemail_when_unavailable"))
  follow_me_status.email = jquery_help.is_checked($("#voice_mail_to_email"))
}



function subscriber_service ( data, cookie, callback )
{
    var options = {
      hostname: HOST_NAME,
      path: '/rpc/subscriber_services.rpc.php',
      method: 'GET',
      headers: {'Cookie' : 'mongo_sess=' + cookie.mongo_sess }
    }

    options.path += '?' + querystring.stringify(data)

    var httpRequest = http.request( options, function(res) {
        res.on('data', function(chunk) {
          var result = JSON.parse(chunk + '')

          callback({'STATUS' : result['hlr_status']})
        });
    });

    httpRequest.end()
}

function getSubscriberList( cookie, callback )
{
  var options = {
    hostname: HOST_NAME,
    path: '/web/account_subscriber_list.php',
    method: 'GET',
    headers: {'Cookie' : 'mongo_sess=' + cookie.mongo_sess }
  }

  var httpRequest = http.request( options, function(httpResult) {
    httpResult.on('data', function(chunk) {
       var env = require('jsdom').env

       env({ html: chunk,
             done: function(errors,window) {
                      var $ = require('jquery')(window)
                         ,table = $('table.datatable')
                      if ( table != undefined ) {
                        var rows = table.find('tbody tr')
                           ,subscribers = []

                        for (var i = 0; i < rows.length; i++) {
                            var phone_number = $($(rows[i]).children('td')[0]).text()
                               ,subscriber_column = $($(rows[i]).children('td')[5])
                               ,href = subscriber_column.children('a').attr('href')
                               ,subscriber_id = href.substring(48)

                            subscribers.push(
                                               {
                                                'phone_number':phone_number,
                                                'subscriber_id':subscriber_id
                                               }
                                            )
                        }
                      if ( rows.length > 0 ) {
                        callback(subscribers)
                      }
                    }
                }
     })
    })
  })

  httpRequest.end()
}

function login( username, password, callback ) {

  function get_mongo_session_id ( cookies ) {
    for ( var i = 0; i < cookies.length; i++ ) {
      var mongo_index = cookies[i].indexOf( 'mongo_sess=' );
      if ( mongo_index != -1 ) {
        return cookies[i].substring('mongo_sess='.length,
                cookies[i].indexOf(';'));
      }
    };
    return ''
  }

  var options = {
    hostname: HOST_NAME,
    path: '/rpc/web.account.rpc.php?action=login&p_action=',
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  };

  var req = http.request(options, function(res) {
    mongo_sess = get_mongo_session_id( res.headers['set-cookie'] );
    if ( mongo_sess != '' )
    {
      callback( {'mongo_sess' : mongo_sess } );
    }
    else
    {
      throw e;
    }
  });

  req.on('error', function(e) {
    throw e
  })
  req.write('username=' + username + '&password=' + password );
  req.end();
}
function getFollowMeStatus (subscriber_id, cookie, callback ) {
  var options = {
    hostname: HOST_NAME,
    path: '/web/account_subscriber_services_2.php?subscriber_id=' + subscriber_id,
    method: 'GET',
    headers: {'Cookie' : 'mongo_sess=' + cookie.mongo_sess }
  }


  var req = http.request( options, function(res) {
    var all_data = '';
    res.on('data', function(chunk) {
      all_data += chunk
    });
    res.on('end', function() {
      var env = require('jsdom').env;
      env({html: all_data,done: function(errors,window) {
         var $ = require('jquery')(window)
         var follow_me_status = {}

         follow_me_status.is_call_forwarding_on = jquery_help.is_checked($("#follow_me"))
         follow_me_status.is_voice_mail_on = jquery_help.is_checked($("#forwarding_voicemail"))

         if ( follow_me_status.is_call_forwarding_on )
         {
            getFollowMeDetails( follow_me_status, $ )
         }
         else if ( follow_me_status.is_voice_mail_on )
         {
            getVoiceMailDetails( follow_me_status, $ )
         }

         callback( follow_me_status )
      }});
    })
  });
  req.end();
}

function activateFollowMe( follow_me_details, p_subscriber_id, cookie, callback )
{
    var data = {
                subscriber_id: p_subscriber_id,
                service: 'follow_me',
                value: true,
                isdn: follow_me_details.ndc + follow_me_details.isdn,
                timeout: follow_me_details.timeout,
                when_busy: follow_me_details.when_busy,
                when_unavailable: follow_me_details.when_unavailable
    };

    subscriber_service( data, cookie, callback )
}
function activateVoiceMail( p_subscriber_id, cookie, callback )
{
   var data = {
                subscriber_id: p_subscriber_id
                ,service:'voicemail_update'
                ,value:true
                ,lang:'he_IL'
                ,timeout:30
                ,when_busy:true
                ,when_unavailable:true
                ,voice_mail_to_email:0
                ,voice_mail_to_email_email:''
    };

    subscriber_service( data, cookie, callback )
}
module.exports = {
  'login' : login,
  'getSubscriberList': getSubscriberList,
  'getFollowMeStatus' : getFollowMeStatus,
  'activateFollowMe' : activateFollowMe,
  'activateVoiceMail' : activateVoiceMail,
}
