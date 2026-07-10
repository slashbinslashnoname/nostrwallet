import { registerLifecycle } from './lifecycle'
import { handleBackgroundRequest, handleNip07Message } from './router'
import { touchActivity, isUnlocked } from './vault/vault'
import { isNip07ContentMessage, type BackgroundRequest } from '../shared/messages'

registerLifecycle()

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handle = isNip07ContentMessage(message)
    ? handleNip07Message(message)
    : handleBackgroundRequest(message as BackgroundRequest)

  handle
    .then(async (result) => {
      if (await isUnlocked()) await touchActivity()
      sendResponse(result)
    })
    .catch((error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
    })
  return true // keep the message channel open for the async sendResponse
})
