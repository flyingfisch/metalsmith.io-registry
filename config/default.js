// don't put your credentials in ./config/default.js, copy that file to
// ./config/local.js which is .gitignored, and edit it there.
//
// if you have 2 factor auth on github then user & pass won't work for you, use
// the token instead.
//
// to create a token go to https://github.com/settings/tokens and generate one
// you don't need to enable any scopes
module.exports = {
  // uncomment below if you're using 2 factor
  // 'github-auth': {
  //   token: 'mytoken'
  // }

  // uncomment this and set user & pass if you're not using 2 factor
  // 'github-auth': {
  //   username: 'myusername',
  //   password: 'mypassword'
  // }
}
