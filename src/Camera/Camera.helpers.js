import _filter from 'lodash/filter'
import _isEqual from 'lodash/isEqual'
import _size from 'lodash/size'
import _forEach from 'lodash/forEach'

import {
  CAMERA_DEFAULT_WIDTH,
  CAMERA_DEFAULT_HEIGHT,
} from './Camera.constants'

const cv = require('opencv.js')

export const initCameraStream = async ({
  currentFacingMode,
  width,
  height,
  setStream,
  setNumberOfCameras,
  setNotSupported,
  setPermissionDenied,
}) => {

  const constraints = {
    audio: false,
    video: {
      facingMode: currentFacingMode,
      width: { ideal: width },
      height: { ideal: height },
    },
  }

  const mediaDevices = navigator.mediaDevices
  if (mediaDevices && mediaDevices.getUserMedia) {
    try {
      const stream = await mediaDevices.getUserMedia(constraints)
      applyCameraSettings(stream)
      handleSuccess(stream, setStream, setNumberOfCameras)
    }
    catch (err) {
      handleError(err, setNotSupported, setPermissionDenied)
    }
    return
  }

  const getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia

  if (getUserMedia) {
    getUserMedia(
      constraints,
      stream => {
        handleSuccess(stream, setStream, setNumberOfCameras)
      },
      err => {
        handleError(err, setNotSupported, setPermissionDenied)
      },
    )
  } else {
    setNotSupported(true)
  }
}

export const stopCameraStream = (stream) => {
  if (!stream) return

  const tracks = stream.getTracks()
  _forEach(tracks, track => {
    track.stop()
  })
}

export const handleTakePhoto = ({
  player,
  container,
  canvas,
  format,
  quality
}) => {
  if (!player || !container || !canvas) return

  const playerWidth = player.videoWidth || CAMERA_DEFAULT_WIDTH
  const playerHeight = player.videoHeight || CAMERA_DEFAULT_HEIGHT
  const playerAR = playerWidth / playerHeight

  const canvasWidth = container.offsetWidth || CAMERA_DEFAULT_WIDTH
  const canvasHeight = container.offsetHeight || CAMERA_DEFAULT_HEIGHT
  const canvasAR = canvasWidth / canvasHeight

  let sX, sY, sW, sH

  if (playerAR > canvasAR) {
    sH = playerHeight
    sW = playerHeight * canvasAR
    sX = (playerWidth - sW) / 2
    sY = 0
  } else {
    sW = playerWidth
    sH = playerWidth / canvasAR
    sX = 0
    sY = (playerHeight - sH) / 2
  }

  canvas.width = sW
  canvas.height = sH

  const context = canvas.getContext('2d')
  context.drawImage(player, sX, sY, sW, sH, 0, 0, sW, sH)
  // applyImageFilters(context, sX, sY, sW, sH)
  const imgData = canvas.toDataURL(format, quality)
  return imgData
}

const applyImageFilters = (context, sX, sY, sW, sH) => {
  const imageData = context.getImageData(sX, sY, sW, sH)
  const imageSrc = cv.matFromImageData(imageData)
  const kdata = [-1, -1, -1, -1, 9, -1, -1, -1, -1]
  const m = cv.matFromArray(3, 3, cv.CV_32FC1, kdata)
  const anchor = new cv.Point(-1, -1)
  const imageDst = new cv.Mat()
  cv.filter2D(imageSrc, imageDst, cv.CV_8U, m, anchor, 0, cv.BORDER_DEFAULT)
  cv.imshow('canvas', imageDst)
}

const applyCameraSettings = (stream) => {
  if (!stream) return
  const [track] = stream.getTracks()
  if (!track) return

  // track.applyConstraints({
  //   advanced: [{
  //     focusMode: "manual",
  //     focusDistance: 0.1,
  //   }]
  // });

  const capabilities = track.getCapabilities()
  const constraints = track.getConstraints()
  const settings = track.getSettings()

  console.log('capabilities:')
  console.log(capabilities)
  console.log('constraints:')
  console.log(constraints)
  console.log('settings:')
  console.log(settings)
}

const handleSuccess = async (stream, setStream, setNumberOfCameras) => {
  const allDevices = await navigator.mediaDevices.enumerateDevices()
  const videoDevices = _filter(allDevices, device => _isEqual(device.kind, 'videoinput'))

  setNumberOfCameras(_size(videoDevices))
  setStream(stream)
}

const handleError = (error, setNotSupported, setPermissionDenied) => {
  console.error(error)

  //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  if (error.name === 'PermissionDeniedError') {
    setPermissionDenied(true)
  } else {
    setNotSupported(true)
  }
}