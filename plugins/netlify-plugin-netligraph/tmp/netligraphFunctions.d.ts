// GENERATED VIA `netlify-plugin-netligraph`, EDIT WITH CAUTION!
/**
 * Find out the downloads a given package had on npm last month
 */
export function fetchDownloadsLastMonth(
  variables: { name: string },
  accessToken: string
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    /**
     * The root for Npm queries
     */
    npm: {
      /**
       * Find a npm package member by its npm name, e.g. `"fela"`
       */
      package: {
        /**
         * The package name, used as an ID in CouchDB
         */
        id: string
        /**
         * The package name
         */
        name: string
        /**
         * Summary download stats for a package
         */
        downloads: {
          /**
           * The download status for this package over the last month
           */
          lastMonth: {
            /**
             * The download stats for the given package and range. Check out explanation of how [npm download counts work](http://blog.npmjs.org/post/92574016600/numeric-precision-matters-how-npm-download-counts), including "what counts as a download?"
             */
            count: number
          }
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}>

/**
 * Post a Tweet from the currently authenticated account
 */
export function executePostTweet(
  variables: {
    input: {
      /**
       * The text of the status update. [t.co link wrapping](https://developer.twitter.com/en/docs/basics/tco) will affect character counts.
       */
      status: string /**
* The ID of an existing status that the update is in reply to.

               **Note**: This parameter will be ignored unless the author of the Tweet this parameter references is mentioned within the status text. Therefore, you must include `@username`, where `username` is the author of the referenced Tweet, within the update.
*/
      inReplyToStatusId?: string
      /**
       * If set to `true` and used with `inReplyToStatusId`, leading `@mentions` will be looked up from the original Tweet, and added to the new Tweet from there. This wil append `@mentions` into the metadata of an extended Tweet as a reply chain grows, until the limit on `@mentions` is reached. In cases where the original Tweet has been deleted, the reply will fail.
       */
      autoPopulateReplyMetadata?: boolean
      /**
       * When used with `autoPopulateReplyMetadata`, a comma-separated list of user ids which will be removed from the server-generated `@mentions` prefix on an extended Tweet. Note that the leading `@mention` cannot be removed as it would break the `inReplyToStatusId` semantics. Attempting to remove it will be silently ignored.
       */
      excludeReplyUserIds?: Array<string>
      /**
       * In order for a URL to not be counted in the status body of an extended Tweet, provide a URL as a Tweet attachment. This URL must be a Tweet permalink, or Direct Message deep link. Arbitrary, non-Twitter URLs must remain in the status text. URLs passed to the `attachmentUrl` parameter not matching either a Tweet permalink or Direct Message deep link will fail at Tweet creation and cause an exception.
       */
      attachmentUrl?: string
      /**
       * A list of `mediaIds` to associate with the Tweet. You may include up to 4 photos or 1 animated GIF or 1 video in a Tweet. See [Uploading Media](https://developer.twitter.com/en/docs/media/upload-media/overview) for further details on uploading media.
       */
      mediaIds?: Array<string>
      /**
       * If you upload Tweet media that might be considered sensitive content such as nudity, or medical procedures, you must set this value to true. See [Media setting and best practices](https://support.twitter.com/articles/20169200) for more context.
       */
      possiblySensitive?: boolean
      /**
       * The latitude of the location this Tweet refers to. This parameter will be ignored unless it is inside the range `-90.0` to `+90.0` (North is positive) inclusive. It will also be ignored if there is no corresponding `long` parameter.
       */
      lat?: number
      /**
       * The longitude of the location this Tweet refers to. The valid ranges for longitude are `-180.0` to `+180.0` (East is positive) inclusive. This parameter will be ignored if outside that range, if it is not a number, if `geoEnabled` is disabled, or if there no corresponding `lat` parameter.
       */
      long?: number
      /**
       * A [place](https://developer.twitter.com/en/docs/geo/place-information/overview) in the world.
       */
      placeId?: string
      /**
       * Whether or not to put a pin on the exact coordinates a Tweet has been sent from.
       */
      displayCoordinates?: boolean
      /**
       * When set to `true`, enables shortcode commands for sending Direct Messages as part of the status text to send a Direct Message to a user. When set to `false`, disables this behavior and includes any leading characters in the status text that is posted
       */
      enableDmcommands?: boolean
      /**
       * When set to `true`, causes any status text that starts with shortcode commands to return an API error. When set to false, allows shortcode commands to be sent in the status text and acted on by the API.
       */
      failDmcommands?: boolean
      /**
       * Associate an ads card with the Tweet using the `cardUri` value from any ads card response.
       */
      cardUri?: string
    }
  },
  accessToken: string
): Promise<{
  /**
   * Any data retrieved by the function will be returned here
   */
  data: {
    /**
     * The root for Twitter mutations
     */
    twitter: {
      postStatus: {
        tweet: {
          /**
           * the text of a tweet
           */
          text: string
          /**
           * createdAt
           */
          createdAt: string
          /**
           * id
           */
          id: number
          /**
           * idStr
           */
          idStr: string
          /**
           * truncated
           */
          truncated: boolean
          /**
           * source
           */
          source: string
          /**
           * isQuoteStatus
           */
          isQuoteStatus: boolean
          /**
           * retweetCount
           */
          retweetCount: number
          /**
           * favoriteCount
           */
          favoriteCount: number
          /**
           * favorited
           */
          favorited: boolean
          /**
           * retweeted
           */
          retweeted: boolean
          /**
           * lang
           */
          lang: string
        }
      }
    }
  }
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}>

/**
 * Be notified every time a package is published on npm
 */
export function subscribeToNpmPackageActivity(
  /**
   * This will be available in your webhook handler as a query parameter.
   * Use this to keep track of which subscription you're receiving
   * events for.
   */
  netligraphWebhookId: string,
  variables: {},
  accessToken?: string | null
): void

/**
 * Verify the NpmPackageActivity event body is signed securely, and then parse the result.
 */
export function parseAndVerifyNpmPackageActivityEvent(
  /** A Netlify Handler Event */ event
): null | {
  /**
   * Any data retrieved by the function will be returned here
   */
  data: any
  /**
   * Any errors in the function will be returned here
   */
  errors: Array<any>
}
