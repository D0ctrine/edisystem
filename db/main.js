var oracledb = require('oracledb');
var dotenv = require('dotenv');
const logger = require('../config/logger');
dotenv.config(); //LOAD CONFIG

// Oracle DB Return Data Type JSON
oracledb.outFormat = oracledb.OBJECT;

async function getDBConnection() {
  let connection = await oracledb.getConnection({
      user: process.env.MAIN_DB_USER,
      password: process.env.MAIN_DB_PASSWORD,
      connectString: process.env.MAIN_DB_COMS
  });
  return connection;
}

async function selectQuery(query, params, noLogFlag) {
  noLogFlag ? '':logger.info(query,params);
  let connection = await getDBConnection();
  let contentsData = await '';
  //clob 테이블 있을시에 String Fetch
  if(query.toUpperCase().indexOf('QUERY_SETTING')>0) {
    oracledb.fetchAsString = [ oracledb.CLOB ];
  }
  try {
    const sql = await connection.execute(query,params === undefined?{}:params);
    contentsData = await sql.rows;
    noLogFlag ? '':logger.info(JSON.stringify(contentsData));
  } catch (err) {
    logger.error(`Select SQL Failed = SQL : ${query} / Params : ${params} ` + JSON.stringify(err));
    // throw new Error(err);
  }
  await connection.close();
  return await contentsData;
}

async function insertSQL(query, params, noLogFlag){
  noLogFlag ? '':logger.info(query,params);
  let connection = await getDBConnection();
    try {
        await connection.execute(query,params?params:{},function(error, result){
          if (error) {
            logger.error(`Insert SQL Failed = ${error.message} SQL : ${query} / Params : ${JSON.stringify(params)}`);
          }else {
            noLogFlag ? '':logger.info("Insert successful = SQL: " + query + ' | Params: ' + JSON.stringify(params) + ' / ' + result.rowsAffected);
          }
        })
    } catch (err) {
      logger.error(`Insert SQL Failed = connections :` + err.message);
      // throw new Error(err);
    } finally {
      await connection.commit();
    }
    await connection.close();
}

async function updateSQL(query, params, noLogFlag) {
  noLogFlag ? '':logger.info(query,params);
  let connection = await getDBConnection();
  try {
    await connection.execute(query,params).then(()=>{
      noLogFlag ? '':logger.info("Update successful = SQL: " + query + ' | Params: ' + JSON.stringify(params));
    })
  } catch (err) {
    logger.error(`Update SQL Failed = SQL : ${query} / Params : ${JSON.stringify(params)} ` + JSON.stringify(err));
    // throw new Error(err);
  } finally {
    await connection.commit();
  }
  await connection.close();
}

module.exports = { selectQuery, getDBConnection, insertSQL, updateSQL }