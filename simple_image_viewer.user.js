// @ts-check
// ==UserScript==
// @name           Simple Image Viewer
// @namespace      https://github.com/Legend-Master
// @version        0.1
// @author         Tony
// @description    A simple image viewer
// @match          <all_urls>
// @grant          none
// ==/UserScript==

const SCALE_FACTOR = 1.2

function isImagePage() {
	return (
		document.body.childElementCount === 1 && document.body.firstChild instanceof HTMLImageElement
	)
}

function main() {
	if (!isImagePage()) {
		return
	}

	const image = /** @type {HTMLImageElement} */ (document.body.firstChild)

	document.body.style.overflow = 'hidden'
	document.body.style.cursor = 'move'
	image.style.cursor = 'move'

	let scale = 1
	let deltaX = 0
	let deltaY = 0

	function updateImageStyle() {
		image.style.cursor = 'move'
		image.style.translate = `${deltaX}px ${deltaY}px`
		image.style.scale = String(scale)
	}

	// Prevent default zoom in / zoom out
	document.addEventListener('click', (ev) => ev.stopImmediatePropagation(), { capture: true })
	// Re-apply styles to image since Chrome will override them...
	// https://source.chromium.org/chromium/chromium/src/+/refs/heads/main:third_party/blink/renderer/core/html/image_document.cc;drc=89758767fb0fae96a59967eb47e7921ce49fafcb;l=296
	window.addEventListener('resize', updateImageStyle)

	document.addEventListener('mousedown', (ev) => {
		/**
		 * @param {MouseEvent} ev
		 */
		function onMouseMove(ev) {
			deltaX += ev.movementX
			deltaY += ev.movementY
			image.style.translate = `${deltaX}px ${deltaY}px`
		}
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener(
			'mouseup',
			() => document.removeEventListener('mousemove', onMouseMove),
			{ once: true }
		)
		ev.preventDefault()
	})

	document.addEventListener('wheel', (ev) => {
		// scale -= (ev.deltaX || ev.deltaY || ev.deltaZ) / 100
		const delta = ev.deltaX || ev.deltaY || ev.deltaZ
		if (delta === 0) {
			return
		}
		if (delta > 0) {
			scale /= SCALE_FACTOR
		} else {
			scale *= SCALE_FACTOR
		}
		// scale = Math.max(scale, 1)
		if (scale < 1) {
			scale = 1
			deltaX = 0
			deltaY = 0
			updateImageStyle()
		} else {
			image.style.scale = String(scale)
		}
	})
}

main()
