import {scheduleJobs} from "./jobs";
require('dotenv').config()

scheduleJobs()
    .catch(e => console.log(e))
