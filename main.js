var golan = require('./golan');

golan.login('3226702', 'proWba6b', function(cookie) {
  golan.getSubscriberList( cookie, function(data) {
    for (var i = 0; i < data.length; i++) {
      subscriber = data[i]
      console.log('Phone Number: ' + subscriber.phone_number)
      console.log('Subscriber ID: ' + subscriber.subscriber_id)
      golan.getFollowMeStatus( subscriber.subscriber_id, cookie, function( status ) {
        console.log( status )
        if ( status.is_voice_mail_on ) {
            console.log('Activating followMe.')
            golan.activateFollowMe( {
              'ndc' : '03',
              'isdn' : '7129493',
              'timeout' : '10',
              'when_busy' : true,
              'when_unavailable' : true
            }, subscriber.subscriber_id, cookie, function( data ) {
              console.log( data )
            })
        } else {
          console.log('Activating voiceMail.')
          golan.activateVoiceMail(
            subscriber.subscriber_id, cookie, function ( data ) {
              console.log(data)
            })
        }
      })
    };
  })

})
