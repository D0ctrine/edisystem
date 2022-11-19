const connection = require('../db/main');
const logger = require('../config/logger');


/**
 * Get Env List like start,between,end ....etc
 * @param {id: job.id}
 */
async function getEnvList (params) {
    return await connection.selectQuery(`
    SELECT *
    FROM EDI_ENV_SETTING WHERE CFG_ID=:id
    `,params)
}
  
    module.exports = {getEnvList};