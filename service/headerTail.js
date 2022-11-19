const connection = require('../db/main');
const logger = require('../config/logger');


/**
 * Get header and tail List
 * @param {id: job.id}
 */
async function getHeadTailList (params) {
  return await connection.selectQuery(`
  SELECT *
  FROM EDI_FILE_HEADNTAIL WHERE CFG_ID=:id
  `,params)
}

    module.exports = {getHeadTailList};