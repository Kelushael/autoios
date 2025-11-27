import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  requestCameraPermission: () => ipcRenderer.invoke('request-camera-permission'),
  requestMicrophonePermission: () => ipcRenderer.invoke('request-microphone-permission'),
})
