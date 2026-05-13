'use strict'

const blockedKeys = new Set(['__proto__', 'prototype', 'constructor'])

function isObjectLike(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

function isIndex(value) {
  return typeof value === 'number' || /^\d+$/.test(value)
}

function toPath(path) {
  if (Array.isArray(path)) {
    return path.map(String)
  }

  return String(path)
    .replace(/\[(.*?)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
}

function assertSafePath(parts) {
  for (const part of parts) {
    if (blockedKeys.has(part)) {
      throw new Error(`Unsafe object path segment: ${part}`)
    }
  }
}

function set(object, path, value) {
  if (!isObjectLike(object)) {
    return object
  }

  const parts = toPath(path)
  assertSafePath(parts)

  let cursor = object
  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index]
    const last = index === parts.length - 1

    if (last) {
      cursor[key] = value
      return object
    }

    const nextKey = parts[index + 1]
    if (!isObjectLike(cursor[key])) {
      cursor[key] = isIndex(nextKey) ? [] : {}
    }
    cursor = cursor[key]
  }

  return object
}

module.exports = set
