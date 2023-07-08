// @ts-check
// ==UserScript==
// @name           Simple Image Viewer
// @namespace      https://github.com/Legend-Master
// @version        0.1
// @author         Tony
// @description    A simple image viewer
// @icon           https://api.iconify.design/mdi/cursor-move.svg
// @homepage       https://github.com/Legend-Master/simple-image-viewer
// @downloadURL    https://github.com/Legend-Master/simple-image-viewer/raw/main/simple_image_viewer.user.js
// @updateURL      https://github.com/Legend-Master/simple-image-viewer/raw/main/simple_image_viewer.user.js
// @supportURL     https://github.com/Legend-Master/simple-image-viewer/issues
// @match          <all_urls>
// @run-at         document-start
// @grant          none
// ==/UserScript==

const SCALE_FACTOR = 1.2
// const TRANSITION_DURATION_MS = 150

function main() {
	/**
	 * @type {HTMLImageElement | SVGElement}
	 */
	let image
	if (document.documentElement instanceof SVGElement) {
		image = document.documentElement

		image.style.overflow = 'hidden'
		image.style.cursor = 'move'
		image.style.height = '100%'
		image.style.maxWidth = '100%'
		image.style.margin = 'auto'

		if (!image.getAttribute('viewBox')) {
			image.setAttribute(
				'viewBox',
				`0 0 ${image.getAttribute('width')} ${image.getAttribute('height')}`
			)
		}
	} else if (
		document.body.childElementCount === 1 &&
		document.body.firstChild instanceof HTMLImageElement
	) {
		image = document.body.firstChild

		document.body.style.overflow = 'hidden'
		document.body.style.cursor = 'move'

		// Prevent default zoom in / zoom out
		document.addEventListener('click', (ev) => ev.stopImmediatePropagation(), { capture: true })
	} else {
		return
	}

	let scale = 1
	let deltaX = 0
	let deltaY = 0

	function applyBasicImageStyle() {
		image.style.cursor = 'move'
		// image.style.transition += `, scale ${TRANSITION_DURATION_MS}ms, translate ${TRANSITION_DURATION_MS}ms`
	}

	function updateImageStyle() {
		image.style.scale = String(scale)

		let width
		let height
		if (image instanceof SVGElement) {
			width = Number(image.getAttribute('width'))
			height = Number(image.getAttribute('height'))
			const aspectRatio = width / height
			const widthFitScale = width / innerWidth
			const heightFitScale = height / innerHeight
			if (widthFitScale > heightFitScale) {
				width = innerWidth
				height = width / aspectRatio
			} else {
				height = innerHeight
				width = height * aspectRatio
			}
		} else {
			width = image.width
			height = image.height
		}
		const deltaWidth = (width * scale - innerWidth) / 2
		const deltaHeight = (height * scale - innerHeight) / 2
		deltaX = deltaWidth > 0 ? Math.min(Math.max(deltaX, -deltaWidth), deltaWidth) : 0
		deltaY = deltaHeight > 0 ? Math.min(Math.max(deltaY, -deltaHeight), deltaHeight) : 0
		image.style.translate = `${deltaX}px ${deltaY}px`
	}

	function updateAllImageStyles() {
		applyBasicImageStyle()
		updateImageStyle()
	}

	applyBasicImageStyle()
	// Do it again on loaded since Chrome will override it on image finishes loading
	// https://source.chromium.org/chromium/chromium/src/+/refs/heads/main:third_party/blink/renderer/core/html/image_document.cc;drc=255b4e7036f1326f2219bd547d3d6dcf76064870;l=404
	image.addEventListener('load', updateAllImageStyles)

	window.addEventListener('resize', updateAllImageStyles)

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

	document.addEventListener(
		'wheel',
		(ev) => {
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
			ev.preventDefault()
		},
		{ passive: false }
	)
}

main()
