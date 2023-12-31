/**
	Johannes Mainusch
	20141130
	read the globals from url:port/smartMeter/globals.json
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getGlobals(eventName) {
  console.log('\n\n\n\n\n\n\nin getGlobals()...', eventName)

  // get the global object from the server
  // it it we'll find things like the name of the energy meter and some specs
  // concerning the number of red flashed per Kw/h and so on...
  $.ajax({
    url: '/smartMeter/getglobals',
    cache: false,
    dataType: 'json',
    crossDomain: true,
    success(data) {
      console.log('success callback in getGlobals()...')
      // this little closure will preserve the object reference of this (energyObject)
      console.log('got called back with globalData ...', data)
      global = data // talking about side effects...
      //      let global = data
      $(document).trigger(eventName)
      return data
    },
  })
}
