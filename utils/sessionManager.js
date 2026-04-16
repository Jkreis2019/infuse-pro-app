let _onLogin = null
let _onActivity = null

export const sessionManager = {
  setOnLogin: (fn) => { _onLogin = fn },
  setOnActivity: (fn) => { _onActivity = fn },
  notifyLogin: (role) => { if (_onLogin) _onLogin(role) },
  notifyActivity: () => { if (_onActivity) _onActivity() }
}
