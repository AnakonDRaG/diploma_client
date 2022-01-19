import {
    screen,
    BrowserWindow,
    BrowserWindowConstructorOptions,
} from 'electron'
import Store from 'electron-store'
import ElectronStore from 'electron-store'

export default (
    windowName: string,
    options: BrowserWindowConstructorOptions,
): BrowserWindow => {
    const key = 'window-state';
    const name = `window-state-${windowName}`
    const store = new Store({name})
    const defaultSize = {
        width: options.width,
        height: options.height,
    }
    let state = {}
    let window: BrowserWindow

    const restore = () => store.get(key, defaultSize)

    const getCurrentPosition = () => {
        const position = window.getPosition()
        const size = window.getSize()
        return {
            x: position[0],
            y: position[1],
            width: size[0],
            height: size[1],
        }
    }

    const windowWithinBounds = (windowState: any, bounds: any) => {
        return (
            windowState.x >= bounds.x &&
            windowState.y >= bounds.y &&
            windowState.x + windowState.width <= bounds.x + bounds.width &&
            windowState.y + windowState.height <= bounds.y + bounds.height
        )
    }

    const resetToDefaults = () => {
        const bounds = screen.getPrimaryDisplay().bounds
        return Object.assign({}, defaultSize, {
            x: (bounds.width - defaultSize.width!) / 2,
            y: (bounds.height - defaultSize.height!) / 2,
        })
    }

    const ensureVisibleOnSomeDisplay = (windowState: any) => {
        const visible = screen.getAllDisplays().some(display => {
            return windowWithinBounds(windowState, display.bounds)
        })
        if (!visible) {
            return resetToDefaults()
        }
        return windowState
    }

    const saveState = () => {
        if (!window.isMinimized() && !window.isMaximized()) {
            Object.assign(state, getCurrentPosition())
        }
        store.set(key, state)
    }

    state = ensureVisibleOnSomeDisplay(restore())

    const browserOptions: BrowserWindowConstructorOptions = {
        ...options,
        ...state,
        autoHideMenuBar: true,
        webPreferences: {
            devTools: false,
            nodeIntegration: true,
            contextIsolation: false,
            ...options.webPreferences,
        },
    }
    window = new BrowserWindow(browserOptions)

    window.on('close', saveState)

    return window
}