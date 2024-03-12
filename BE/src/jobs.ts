import {authority, mint} from "./vars";
import collectFees from "./solFunctions/collectFees";
import cron from "node-cron"
import { connection } from "./client";

export const scheduleJobs = async () => {
    console.log("start")
    collectFees(connection, mint, authority)
        .catch(e => console.error(e.message))
    // cron.schedule('*/2 * * * *', async () => {
    //     console.log('Running collect fees and refund job')
    //     collectFees(connection, mint, authority)
    //         .catch(e => console.error(e.message))
    // })
}
