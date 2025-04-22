import { Client } from "@gradio/client"

// Cache the client instance
let clientInstance: any = null

export async function getGradioClient() {
  const appId = process.env.GRADIO_APP_ID || "pb01/healthlink-beta"

  if (!clientInstance) {
    clientInstance = await Client.connect(appId)
  }

  return clientInstance
}

export async function processImages(imageBlob: Blob) {
  try {
    const client = await getGradioClient()

    const result = await client.predict("/process_images", {
      image_list: imageBlob,
    })

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error("Error processing images with Gradio:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
