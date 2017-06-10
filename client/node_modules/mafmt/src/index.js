'use strict'

const multiaddr = require('multiaddr')

/*
 * Valid combinations
 */
const DNS4 = base('dns4')
const DNS6 = base('dns6')
const _DNS = or(
  base('dns'),
  DNS4,
  DNS6
)

const IP = or(base('ip4'), base('ip6'))
const TCP = and(IP, base('tcp'))
const UDP = and(IP, base('udp'))
const UTP = and(UDP, base('utp'))

const DNS = or(
  and(_DNS, base('tcp')),
  _DNS
)

const WebSockets = or(
  and(TCP, base('ws')),
  and(DNS, base('ws'))
)

const WebSocketsSecure = or(
  and(TCP, base('wss')),
  and(DNS, base('wss'))
)

const HTTP = or(
  and(TCP, base('http')),
  and(DNS),
  and(DNS, base('http'))
)

const WebRTCStar = or(
  and(base('libp2p-webrtc-star'), WebSockets, base('ipfs')),
  and(base('libp2p-webrtc-star'), WebSocketsSecure, base('ipfs'))
)

const WebRTCDirect = and(base('libp2p-webrtc-direct'), HTTP)

const Reliable = or(
  WebSockets,
  WebSocketsSecure,
  HTTP,
  WebRTCStar,
  WebRTCDirect,
  TCP,
  UTP
)

let _IPFS = or(
  and(Reliable, base('ipfs')),
  WebRTCStar,
  base('ipfs')
)

const _Circuit = or(
  and(_IPFS, base('p2p-circuit'), _IPFS),
  and(_IPFS, base('p2p-circuit')),
  and(base('p2p-circuit'), _IPFS),
  and(Reliable, base('p2p-circuit')),
  and(base('p2p-circuit'), Reliable),
  base('p2p-circuit')
)

const CircuitRecursive = () => or(
  and(_Circuit, CircuitRecursive),
  _Circuit
)

const Circuit = CircuitRecursive()

const IPFS = or(
  and(Circuit, _IPFS, Circuit),
  and(_IPFS, Circuit),
  and(Circuit, _IPFS),
  Circuit,
  _IPFS
)

exports.DNS = DNS
exports.DNS4 = DNS4
exports.DNS6 = DNS6
exports.IP = IP
exports.TCP = TCP
exports.UDP = UDP
exports.UTP = UTP
exports.HTTP = HTTP
exports.WebSockets = WebSockets
exports.WebSocketsSecure = WebSocketsSecure
exports.WebRTCStar = WebRTCStar
exports.WebRTCDirect = WebRTCDirect
exports.Reliable = Reliable
exports.Circuit = Circuit
exports.IPFS = IPFS

/*
 * Validation funcs
 */

function and () {
  const args = Array.from(arguments)

  function matches (a) {
    if (typeof a === 'string') {
      a = multiaddr(a)
    }
    let out = partialMatch(a.protoNames())
    if (out === null) {
      return false
    }
    return out.length === 0
  }

  function partialMatch (a) {
    if (a.length < args.length) {
      return null
    }
    args.some(function (arg) {
      a = typeof arg === 'function' ? arg().partialMatch(a) : arg.partialMatch(a)
      if (a === null) {
        return true
      }
    })

    return a
  }

  return {
    input: args,
    matches: matches,
    partialMatch: partialMatch
  }
}

function or () {
  const args = Array.from(arguments)

  function matches (a) {
    if (typeof a === 'string') {
      a = multiaddr(a)
    }
    const out = partialMatch(a.protoNames())
    if (out === null) {
      return false
    }
    return out.length === 0
  }

  function partialMatch (a) {
    let out = null
    args.some(function (arg) {
      const res = typeof arg === 'function' ? arg().partialMatch(a) : arg.partialMatch(a)
      if (res) {
        out = res
        return true
      }
    })

    return out
  }

  const result = {
    toString: function () { return '{ ' + args.join(' ') + ' }' },
    input: args,
    matches: matches,
    partialMatch: partialMatch
  }

  return result
}

function base (n) {
  const name = n

  function matches (a) {
    if (typeof a === 'string') {
      a = multiaddr(a)
    }

    const pnames = a.protoNames()
    if (pnames.length === 1 && pnames[0] === name) {
      return true
    }
    return false
  }

  function partialMatch (protos) {
    if (protos.length === 0) {
      return null
    }

    if (protos[0] === name) {
      return protos.slice(1)
    }
    return null
  }

  return {
    toString: function () { return name },
    matches: matches,
    partialMatch: partialMatch
  }
}
