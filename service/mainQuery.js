const connection = require('../db/main');
const logger = require('../config/logger');

/**
 * Get Main Query
 * @param {id: job.id}
 */
async function getMainQuery (params) {
    return await connection.selectQuery(`
    SELECT *
    FROM (
        SELECT ROWNUM,A.*
            FROM EDI_QUERY_SETTING A
            WHERE SETTING_ID = :id
            AND TYPE='Main'
            ORDER BY ID DESC
        ) 
    WHERE ROWNUM='1'
    `,params)
}

module.exports = {getMainQuery};