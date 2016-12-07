var test = require('tap').test
var tnock = require('./util/tnock')

var manifest = require('../manifest')

var PKG = {
  name: 'foo',
  version: '1.2.3'
}
var SCOPEDPKG = {
  name: '@usr/foo',
  version: '1.2.3'
}

var OPTS = {
  registry: 'https://mock.reg'
}

test('fetches version or tag from registry', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
  })

  srv.get('/foo/latest').reply(200, PKG)
  manifest('foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from tag')
  })
})

test('fetches version or tag from scoped registry', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/@usr%2ffoo/1.2.3').reply(200, SCOPEDPKG)
  manifest('@usr/foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from version')
  })

  srv.get('/@usr%2ffoo/latest').reply(200, SCOPEDPKG)
  manifest('@usr/foo@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, SCOPEDPKG, 'got scoped manifest from tag')
  })
})

test('fetches version or tag from registry', function (t) {
  var TOKEN = 'deadbeef'
  var opts = {
    registry: OPTS.registry,
    auth: {
      '//mock.reg/': {
        token: TOKEN
      }
    }
  }

  var srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got manifest from version')
    t.end()
  })
})

test('uses scope from spec for registry lookup', function (t) {
  var opts = {
    '@myscope:registry': OPTS.registry,
    // package scope takes priority
    scope: '@otherscope'
  }
  var srv = tnock(t, OPTS.registry)
  srv.get('/@myscope%2ffoo/1.2.3').reply(200, PKG)
  manifest('@myscope/foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
    t.end()
  })
})

test('uses scope opt for registry lookup', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', {
    '@myscope:registry': OPTS.registry,
    scope: '@myscope',
    // scope option takes priority
    registry: 'nope'
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry')
  })

  srv.get('/foo/latest').reply(200, PKG)
  manifest('foo@latest', {
    '@myscope:registry': OPTS.registry,
    scope: 'myscope' // @ auto-inserted
  }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'scope @ was auto-inserted')
  })
})

test('defaults to registry.npmjs.org if no option given', function (t) {
  var srv = tnock(t, 'https://registry.npmjs.org')

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', { registry: undefined }, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used npm registry')
    t.end()
  })
})

test('supports scoped auth', function (t) {
  var TOKEN = 'deadbeef'
  var opts = {
    scope: 'myscope',
    '@myscope:registry': OPTS.registry,
    auth: {
      '//mock.reg/': {
        token: TOKEN
      }
    }
  }
  var srv = tnock(t, OPTS.registry)
  srv.get(
    '/foo/1.2.3'
  ).matchHeader(
    'authorization', 'Bearer ' + TOKEN
  ).reply(200, PKG)
  manifest('foo@1.2.3', opts, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'used scope to pick registry and auth')
    t.end()
  })
})

test('package requests are case-sensitive', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  var CASEDPKG = {
    name: 'Foo',
    version: '1.2.3'
  }
  srv.get('/Foo/1.2.3').reply(200, CASEDPKG)
  manifest('Foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, CASEDPKG, 'got Cased package')
  })

  srv.get('/foo/1.2.3').reply(200, PKG)
  manifest('foo@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('handles server-side case-normalization', function (t) {
  t.plan(2)
  var srv = tnock(t, OPTS.registry)

  srv.get('/Cased/1.2.3').reply(200, PKG)
  manifest('Cased@1.2.3', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got Cased package')
  })

  srv.get('/cased/latest').reply(200, PKG)
  manifest('cased@latest', OPTS, function (err, pkg) {
    if (err) { throw err }
    t.deepEqual(pkg, PKG, 'got lowercased package')
  })
})

test('supports fetching from an optional cache')
test('uses proxy settings')
test('recovers from request errors')
