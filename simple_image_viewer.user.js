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
// const TRANSITION_DURATION_MS = 150

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

	function applyBasicImageStyle() {
		image.style.cursor = 'move'
		// image.style.transition += `, scale ${TRANSITION_DURATION_MS}ms, translate ${TRANSITION_DURATION_MS}ms`
	}
	applyBasicImageStyle()

	let scale = 1
	let deltaX = 0
	let deltaY = 0

	function updateImageStyle() {
		image.style.scale = String(scale)

		const deltaWidth = (image.width * scale - innerWidth) / 2
		const deltaHeight = (image.height * scale - innerHeight) / 2
		deltaX = deltaWidth > 0 ? Math.min(Math.max(deltaX, -deltaWidth), deltaWidth) : 0
		deltaY = deltaHeight > 0 ? Math.min(Math.max(deltaY, -deltaHeight), deltaHeight) : 0
		image.style.translate = `${deltaX}px ${deltaY}px`
	}

	// Prevent default zoom in / zoom out
	document.addEventListener('click', (ev) => ev.stopImmediatePropagation(), { capture: true })
	// Re-apply styles to image since Chrome will override them...
	// https://source.chromium.org/chromium/chromium/src/+/refs/heads/main:third_party/blink/renderer/core/html/image_document.cc;drc=89758767fb0fae96a59967eb47e7921ce49fafcb;l=296
	window.addEventListener('resize', () => {
		applyBasicImageStyle()
		updateImageStyle()
	})

	document.addEventListener('mousedown', (ev) => {
		/**
		 * @param {MouseEvent} ev
		 */
		function onMouseMove(ev) {
			if (scale === 1) {
				return
			}
			deltaX += ev.movementX
			deltaY += ev.movementY
			updateImageStyle()
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
		scale = Math.max(scale, 1)
		updateImageStyle()
	})
}

main()
