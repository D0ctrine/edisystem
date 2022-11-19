const connection = require('../db/main');
const logger = require('../config/logger');

async function getLogKey (id) {
    if (id === 'seq') {
        let seq_query = `SELECT EDI_LOG_SEQ.NEXTVAL AS ID FROM DUAL`;
        logger.info(seq_query);
        const query = await connection.selectQuery(seq_query,{});
        logger.info(`${id} : return Key ${JSON.stringify(query)}`);
        return await query[0].ID;
    } else {
        return id;
    }
}

/**
 * save log in Log table that has all logs in.
 * @param {id, name, process_id, description}
 */
async function saveAllLogger ({id, stepId, name, process_id, description}) {
    id = await getLogKey(id);
    logger.info(`saveAllLogger => ID:${id}, NAME:${name}, ProcessID:${process_id}, Description: ${description}`);
    await connection.insertSQL(`INSERT INTO EDI_LOG(ID, STEP, NAME, PROCESS_ID, DESCRIPTION, CREATE_USER, CREATE_DATE)
    VALUES(:id, :stepId, :name, :process_id, :description, 'DAEMON', TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS'))`
    ,{id, stepId, name, process_id, description});
    return await id;
}
async function FinishAllLogger(id, name, result, process_id, description) {
    await connection.updateSQL(`UPDATE EDI_LOG SET RESULT = :result, LOG_TIME=TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS') WHERE ID=:id`,[result,id]).then(()=>{
        connection.insertSQL(`INSERT INTO EDI_LOG(ID, STEP, NAME, PROCESS_ID, RESULT, LOG_TIME, DESCRIPTION, CREATE_USER)
        VALUES(:id, EDI_GET_STEP(:step_id), :name, :process_id, :result, TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS'), :description, 'DAEMON')`
        ,{id, step_id: id, name, process_id, result, description});
    });
}
async function startQueryLogger({id, name, process_id, sql}) {
    await connection.insertSQL(`INSERT INTO EDI_LOG_QUERY(ID, NAME, PROCESS_ID, START_TIME, QUERY, CREATE_USER)
    VALUES(:id, :name, :process_id, TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS'), :sql, 'DAEMON')`, [id, name, process_id, sql], 'No Log')
    logger.info(`id: ${id}, name: ${name}, query: '본문', process_id: ${process_id}`);
}
async function FinishQueryLogger({id, row_count, result}) {
    const query = `UPDATE EDI_LOG_QUERY 
    SET END_TIME=TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS'), ROW_COUNT=:row_count, RESULT=:result
    WHERE id=:id`;
    await connection.updateSQL(query,{id, row_count, result});
    logger.info(query.replace(':id',id).replace(':row_count',row_count).replace(':result',result));
}

  module.exports = { saveAllLogger, FinishAllLogger, startQueryLogger, FinishQueryLogger };