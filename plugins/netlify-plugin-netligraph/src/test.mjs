/* eslint-disable no-unused-vars */
import { fetchLiveQueries, fetchEnabledServices, fetchOneGraphSchema, generateFunctionsFile, getAuthToken, getAppId } from "./netligraph.mjs"

const run = async () => {
    const appId = getAppId()
    const enabledServices = fetchEnabledServices()

    const resultPromise = fetchLiveQueries(getAuthToken(), appId, null)
    const schemaPromise = fetchOneGraphSchema(appId, enabledServices)

    const result = await resultPromise
    const schema = await schemaPromise


    console.log("Writing...")

    generateFunctionsFile(schema, result)

    console.log("Finished")
    console.log("------------------------------------------------------")
}

run()

