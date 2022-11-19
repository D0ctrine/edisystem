const connection = require('../db/main');
const logger = require('../config/logger');


/**
 * Get FTP&SFTP List
 * @param {id: job.id}
 */
async function getFtpList (params) {
    return await connection.selectQuery(`
    SELECT * 
    FROM EDI_FTP_SETTING WHERE ID=:id  AND ROWNUM=1
    `,params)
}
  
    module.exports = {getFtpList};