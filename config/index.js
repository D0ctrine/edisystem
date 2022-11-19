var oracledb = require('oracledb');
var dotenv = require('dotenv');
const logger = require('../config/logger');
var ip = require("ip");

//LOAD CONFIG
dotenv.config();

// Oracle Auto Commit 설정
oracledb.autoCommit = true;

// Oracle DB Return Data Type JSON
oracledb.outFormat = oracledb.OBJECT;

// Oracle Connection 설정 ( COMS DB )
async function SchedulerSetting() {
    let connection = await oracledb.getConnection({
        user: process.env.MAIN_DB_USER,
        password: process.env.MAIN_DB_PASSWORD,
        connectString: process.env.MAIN_DB_COMS
    });
    var resultList= '';
    try {
        const sql = await connection.execute(`SELECT * FROM EDI_FILE_DEFINE WHERE SEND_FLAG='Y'`);
        resultList = await sql.rows
    } catch (err) {
        logger.error(JSON.stringify(err));
        throw new Error(err);
    }
    await connection.close();
    let returnCronDefineList = [];
    
    for (let i=0; i<resultList.length; i++) {
        returnCronDefineList.push(resultList[i])
        // test data
        // returnCronDefineList[i].frequency = '49 * * * * *'
        returnCronDefineList[i].frequency = resultList[i].SCHEDULE_MIN + ' ' + resultList[i].SCHEDULE_HOUR + ' ' + resultList[i].SCHEDULE_DAY + ' ' + resultList[i].SCHEDULE_MONTH + ' ' + resultList[i].SCHEDULE_WEEK
    }
    return returnCronDefineList;
}

async function getOneJob(jobId) {
    let connection = await oracledb.getConnection({
        user: process.env.MAIN_DB_USER,
        password: process.env.MAIN_DB_PASSWORD,
        connectString: process.env.MAIN_DB_COMS
    });
    var resultList= '';
    try {
        const sql = await connection.execute(`SELECT * FROM EDI_FILE_DEFINE WHERE SEND_FLAG='Y' AND CFG_ID=:id`,{id: jobId});
        resultList = sql.rows
    } catch (err) {
        logger.error(JSON.stringify(err));
        throw new Error(err);
    }
    await connection.close();
    return resultList;
}

async function saveAllLogger({id, name, process_id, result, description}) {
    logger.info('========>saveAllLogger Function Start! > '+`id: ${id}, name: ${name}, process_id: ${process_id}, result:${result}, description: ${description}`);
    let connection = await oracledb.getConnection({
        user: process.env.MAIN_DB_USER,
        password: process.env.MAIN_DB_PASSWORD,
        connectString: process.env.MAIN_DB_COMS
    });
    id = (id === 'seq'?`EDI_LOG_SEQ`:id);
    let stepId = id;
    let seqid = '';
    try {
      let seq_query = `SELECT (CASE WHEN :ID LIKE 'EDI%' THEN TO_CHAR(EDI_GET_SEQ(:id)) ELSE :ID END) AS ID FROM DUAL`;
      const query = await connection.execute(seq_query,{ID: id});
      seqid = query.rows[0].ID;
      let saveQuery = `INSERT INTO 
      EDI_LOG(ID, STEP, NAME, PROCESS_ID, RESULT, DESCRIPTION, CREATE_USER, CREATE_DATE)
      VALUES(:id, EDI_GET_STEP(:stepId), :name, :process_id, :result, :description, 'DAEMON-${ip.address()}', TO_CHAR(SYSDATE,'YYYYMMDDHH24MISS'))`;
      await connection.execute(saveQuery,[id=seqid, stepId=seqid, name, process_id, result, description]);
      await connection.commit();  
    } catch (err) {
        logger.error(JSON.stringify(err));
        throw new Error(err);
    }
    await connection.close();
    return await id;
  }
module.exports = {
    SchedulerSetting,saveAllLogger,getOneJob
}

// SchedulerSetting List Format Example
// {
//     xmlFile: {
//         frequency: "* * * * *",
//         handler: "handlers/makeFileXml"
//     },
//     textFile: {
//         frequency: "* * * * *",
//         handler: "handlers/makeFileText"
//     },
//     EDIFactFile: {
//         frequency: "* * * * *",
//         handler: "handlers/makeFileEDIFact"
//     }
// };