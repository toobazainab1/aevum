// Custom cursor (moved out of index.html so a strict Content-Security-Policy can forbid inline scripts)
(function () {
  var dot = document.createElement('div')
  var outline = document.createElement('div')
  dot.classList.add('cursor-dot')
  outline.classList.add('cursor-outline')
  document.body.appendChild(dot)
  document.body.appendChild(outline)

  var mouseX = 0, mouseY = 0, outlineX = 0, outlineY = 0

  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX
    mouseY = e.clientY
    dot.style.left = mouseX + 'px'
    dot.style.top = mouseY + 'px'
  })

  function animate() {
    outlineX += (mouseX - outlineX) * 0.15
    outlineY += (mouseY - outlineY) * 0.15
    outline.style.left = outlineX + 'px'
    outline.style.top = outlineY + 'px'
    requestAnimationFrame(animate)
  }
  animate()

  // Event delegation so hover works for elements React renders later
  var HOVER = 'a, button, .btn-primary, .btn-outline, .btn-dark'
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(HOVER)) document.body.classList.add('cursor-hover')
  })
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest(HOVER)) document.body.classList.remove('cursor-hover')
  })
})()
