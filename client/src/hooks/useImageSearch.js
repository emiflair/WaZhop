import { useCallback, useState } from 'react'

let modelPromise = null

const loadMobilenetModel = async () => {
  if (!modelPromise) {
    modelPromise = (async () => {
      // Dynamically import TensorFlow and Mobilenet to avoid inflating initial bundle
      const tf = await import('@tensorflow/tfjs')
      // Prefer WebGL backend when available for better performance
      try {
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl')
        }
      } catch (error) {
        console.warn('Falling back to TensorFlow CPU backend for image search', error?.message || error)
        try {
          await tf.setBackend('cpu')
        } catch (fallbackError) {
          console.warn('TensorFlow backend fallback failed', fallbackError?.message || fallbackError)
        }
      }

      await tf.ready()

      const mobilenetModule = await import('@tensorflow-models/mobilenet')
      const model = await mobilenetModule.load({ version: 2, alpha: 1.0 })
      return model
    })().catch((error) => {
      modelPromise = null
      throw error
    })
  }

  return modelPromise
}

const loadImageElement = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectUrl
  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    resolve(image)
  }
  image.onerror = (error) => {
    URL.revokeObjectURL(objectUrl)
    reject(error)
  }
})

export function useImageSearch() {
  const [isClassifying, setIsClassifying] = useState(false)

  const classifyImage = useCallback(async (file, { maxResults = 5 } = {}) => {
    setIsClassifying(true)
    try {
      const model = await loadMobilenetModel()
      const imageElement = await loadImageElement(file)
      const predictions = await model.classify(imageElement, maxResults)
      return predictions || []
    } finally {
      setIsClassifying(false)
    }
  }, [])

  return {
    classifyImage,
    isClassifying
  }
}
