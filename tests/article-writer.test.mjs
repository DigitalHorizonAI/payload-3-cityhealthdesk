// The GetRanked writer lookup, with fetch stubbed. Run: pnpm test:writer
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { makeArticleWriter } from '../src/utilities/articleWriter.ts'

// GetRanked keeps the full path; the CMS slug is its last part.
const INSOMNIA = 'sleep-disorders-conditions/insomnia-types-causes/insomnia'
const env = { GETRANKED_URL: 'https://gr.test', GETRANKED_ANON_KEY: 'k', GETRANKED_DOMAIN_ID: 'd' }

const answering = (rows) => {
  const calls = []
  const fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(rows), { status: 200 })
  }
  return { fetch, calls }
}

test('names the writer GetRanked holds for the slug', async () => {
  const { fetch, calls } = answering([
    { slug: INSOMNIA, author: 'Claire Whitfield' },
    { slug: 'diet-patterns-approaches/other-diet-approaches/paleo-diet', author: 'Someone Else' },
  ])
  const writer = makeArticleWriter({ env, fetch })
  assert.equal(await writer('insomnia'), 'Claire Whitfield')
  assert.equal(await writer('paleo-diet'), 'Someone Else')
  // One read serves every page.
  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /domain_id=eq\.d&status=eq\.published/)
  assert.equal(calls[0].init.headers.apikey, 'k')
})

test('no row for the slug: no writer', async () => {
  const { fetch } = answering([
    { slug: INSOMNIA, author: 'Claire Whitfield' },
    { slug: 'sleep/insomnia/insomnia-remedies', author: 'Someone Else' },
  ])
  const writer = makeArticleWriter({ env, fetch })
  assert.equal(await writer('not-in-getranked'), undefined)
  // A folder named like the slug is not the article.
  assert.equal(await writer('insomnia-types-causes'), undefined)
})

test('two rows that disagree: no writer, not a guess', async () => {
  const { fetch } = answering([
    { slug: INSOMNIA, author: 'Claire Whitfield' },
    { slug: INSOMNIA, author: 'Someone Else' },
  ])
  assert.equal(await makeArticleWriter({ env, fetch })('insomnia'), undefined)
})

test('two rows that agree: the writer', async () => {
  const { fetch } = answering([
    { slug: INSOMNIA, author: 'Claire Whitfield' },
    { slug: INSOMNIA, author: 'Claire Whitfield' },
  ])
  assert.equal(await makeArticleWriter({ env, fetch })('insomnia'), 'Claire Whitfield')
})

test('GetRanked down: no writer, no throw', async () => {
  const fetch = async () => {
    throw new TypeError('fetch failed')
  }
  assert.equal(await makeArticleWriter({ env, fetch })('insomnia'), undefined)
})

test('GetRanked answers an error: no writer', async () => {
  const fetch = async () => new Response('nope', { status: 503 })
  assert.equal(await makeArticleWriter({ env, fetch })('insomnia'), undefined)
})

test('GetRanked slow: gives up at the timeout, no writer', async () => {
  // Honours the abort signal the way the real fetch does.
  const fetch = (url, { signal }) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => resolve(new Response('[]')), 10_000)
      signal.addEventListener('abort', () => {
        clearTimeout(t)
        reject(signal.reason)
      })
    })
  const started = Date.now()
  assert.equal(await makeArticleWriter({ env, fetch, timeoutMs: 200 })('insomnia'), undefined)
  assert.ok(Date.now() - started < 2_000, `took ${Date.now() - started} ms`)
})

test('a failed read is retried after the retry window, not cached for long', async () => {
  let up = false
  const fetch = async () => {
    if (!up) throw new TypeError('fetch failed')
    return new Response(JSON.stringify([{ slug: INSOMNIA, author: 'Claire Whitfield' }]))
  }
  const writer = makeArticleWriter({ env, fetch, retryMs: 0 })
  assert.equal(await writer('insomnia'), undefined)
  up = true
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(await writer('insomnia'), 'Claire Whitfield')
})

test('a failed read after a good one keeps the last good writers', async () => {
  let up = true
  const fetch = async () => {
    if (!up) throw new TypeError('fetch failed')
    return new Response(JSON.stringify([{ slug: INSOMNIA, author: 'Claire Whitfield' }]))
  }
  // cacheMs 0: every call after the first goes back to GetRanked.
  const writer = makeArticleWriter({ env, fetch, cacheMs: 0 })
  assert.equal(await writer('insomnia'), 'Claire Whitfield')
  up = false
  await new Promise((r) => setTimeout(r, 5))
  assert.equal(await writer('insomnia'), 'Claire Whitfield')
})

test('env not set: no writer and no request', async () => {
  const { fetch, calls } = answering([{ slug: INSOMNIA, author: 'Claire Whitfield' }])
  assert.equal(await makeArticleWriter({ env: {}, fetch })('insomnia'), undefined)
  assert.equal(calls.length, 0)
})
