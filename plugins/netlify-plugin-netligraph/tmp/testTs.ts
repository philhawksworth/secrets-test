import Lib from './netligraphFunctions'

export const r = async () => {
  const result = await Lib.fetchDownloadsLastMonth({ name: 'react' }, null)
  const r2 = await Lib.executePostTweet(
    {
      input: {
        status: 'test',
      },
    },
    null,
  )

  r2.data.twitter.postStatus.tweet.lang
  const event = 10
  Lib.parseAndVerifyNpmPackageActivityEvent(event)
}
