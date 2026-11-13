// Runs in <head> before paint: applies a saved theme and flags that JS is on.
(function () {
  var d = document.documentElement
  d.classList.add('js')
  try {
    var t = localStorage.getItem('muhr-theme')
    if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t)
  } catch (e) { /* storage blocked: follow the system theme */ }
})()
