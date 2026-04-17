let _onLogin = null
let _onActivity = null
let _onLock = null

export const sessionManager = {
  setOnLogin: (fn) => { _onLogin = fn },
  setOnActivity: (fn) => { _onActivity = fn },
  setOnLock: (fn) => { _onLock = fn },
  notifyLogin: (role, token, company) => { if (_onLogin) _onLogin(role, token, company) },
  notifyActivity: () => { if (_onActivity) _onActivity() },
  lock: () => { if (_onLock) _onLock() }
}
