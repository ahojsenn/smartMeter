/**
	Johannes Mainusch
	20141227
*/

function renderDataSelector() {
  console.log('in renderDataSelector...')
  const myhtml = $('<select>')
    .appendTo('#dataSelectorId')
    .change(handleSelectBoxChange)
  let selectedValue = getQueryVariable('filter')

  if (!(typeof selectedValue === 'string')) selectedValue = 'all'

  console.log(
    'inrenderDataSelector  selectedValue=',
    selectedValue,
    ' global = ',
    global
  )
  $.ajax({
    url: global.url + '/getXref?' + 'nolines=' + 1000 + '&column=term',
    cache: false,
    dataType: 'json',
    crossDomain: true,
    success(data) {
      // this little closure will preserve the object reference of this (energyObject)
      console.log('  got called back with data=', data)
      myhtml.append($('<option>').attr('value', 'all').text('all'))
      for (const i in data) {
        myhtml.append($('<option>').attr('value', data[i]).text(data[i]))
      }
      myhtml.val(selectedValue)
    },
  })
}

function handleSelectBoxChange() {
  const dataSelector = $('select option:selected').text()
  let newUrl

  newUrl =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname +
    '?filter=' +
    dataSelector

  if (dataSelector != 'all') localStorage.setItem('dataFilter', dataSelector)
  else localStorage.setItem('dataFilter', '')

  window.location.href = newUrl
}

/**
	Found on the internet
	http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
*/
function getQueryVariable(variable) {
  const query = window.location.search.substring(1)
  const vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=')
    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1])
    }
  }
  console.log('Query variable %s not found', variable)
}
