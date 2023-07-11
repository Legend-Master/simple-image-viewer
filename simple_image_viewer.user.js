// @ts-check
// ==UserScript==
// @name           Simple Image Viewer
// @namespace      https://github.com/Legend-Master
// @version        0.2
// @author         Tony
// @description    A simple image viewer that allows you to zoom and pan images on the default browser image page with mouse
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

/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 */
function clamp(num, min, max) {
	// if (min > max) {
	// 	const temp = min
	// 	min = max
	// 	max = temp
	// }
	return Math.min(max, Math.max(min, num))
}

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

	function getImageSize() {
		let width
		let height
		if (image instanceof SVGElement) {
			width = Number(image.getAttribute('width'))
			height = Number(image.getAttribute('height'))
			const aspectRatio = width / height
			const widthFitScale = width / innerWidth
			const heightFitScale = height / innerHeight
			if (widthFitScale > heightFitScale) {
				if (widthFitScale > 1) {
					width = innerWidth
					height = width / aspectRatio
				}
			} else {
				if (heightFitScale > 1) {
					height = innerHeight
					width = height * aspectRatio
				}
			}
		} else {
			width = image.width
			height = image.height
		}
		return { width, height }
	}

	function updateImageStyle() {
		image.style.scale = String(scale)
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
			const { width, height } = getImageSize()
			const deltaWidth = Math.max((width * scale - innerWidth) / 2, 0)
			const deltaHeight = Math.max((height * scale - innerHeight) / 2, 0)
			const maxDeltaX = Math.max(deltaWidth, deltaX)
			const minDeltaX = Math.min(-deltaWidth, deltaX)
			const maxDeltaY = Math.max(deltaHeight, deltaY)
			const minDeltaY = Math.min(-deltaHeight, deltaY)
			deltaX += ev.movementX
			deltaY += ev.movementY
			deltaX = clamp(deltaX, minDeltaX, maxDeltaX)
			deltaY = clamp(deltaY, minDeltaY, maxDeltaY)
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
			const isZoomIn = delta < 0
			let targetScale = scale
			if (isZoomIn) {
				targetScale *= SCALE_FACTOR
			} else {
				targetScale /= SCALE_FACTOR
			}
			if (targetScale <= 1) {
				scale = 1
				deltaX = 0
				deltaY = 0
			} else {
				const initialSize = getImageSize()
				const width = initialSize.width * scale
				const height = initialSize.height * scale
				const left = (innerWidth - width) / 2 + deltaX
				const right = (innerWidth + width) / 2 + deltaX
				const top = (innerHeight - height) / 2 + deltaY
				const bottom = (innerHeight + height) / 2 + deltaY
				const centerX = left + width / 2
				const centerY = top + height / 2
				const deltaScale = targetScale - scale
				const dx = ((centerX - clamp(ev.clientX, left, right)) / scale) * deltaScale
				const dy = ((centerY - clamp(ev.clientY, top, bottom)) / scale) * deltaScale
				if (isZoomIn) {
					deltaX += dx
					deltaY += dy
				} else {
					// Interpolate delta = 0 on scale = 1 to delta = current delta on scale = current scale
					const minDeltaX = deltaX * ((targetScale - 1) / (scale - 1))
					const minDeltaY = deltaY * ((targetScale - 1) / (scale - 1))
					deltaX += dx
					deltaY += dy
					if (deltaX > 0) {
						deltaX = Math.min(deltaX, minDeltaX)
					} else {
						deltaX = Math.max(deltaX, minDeltaX)
					}
					if (deltaY > 0) {
						deltaY = Math.min(deltaY, minDeltaY)
					} else {
						deltaY = Math.max(deltaY, minDeltaY)
					}
				}
				scale = targetScale
			}
			updateImageStyle()
			ev.preventDefault()
		},
		{ passive: false }
	)
}

main()
