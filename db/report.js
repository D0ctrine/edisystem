var oracledb = require('oracledb');
var dotenv = require('dotenv');
dotenv.config(); //LOAD CONFIG

oracledb.autoCommit = true;

async function getDBConnection() {
  let connection = await oracledb.getConnection({
      user: process.env.REPORT_DB_USER,
      password: process.env.REPORT_DB_PASSWORD,
      connectString: process.env.REPORT_DB_HOST
  });
  return connection;
}

async function selectQuery(query, params) {
  let connection = await getDBConnection(DB_TYPE);
  let contentsData = await '';

  //clob 테이블 있을시에 String Fetch
  if(query.toUpperCase().indexOf('QUERY_SETTING')>0) {
    oracledb.fetchAsString = [ oracledb.CLOB ];
  }

  try {
    const sql = await connection.execute(query,params);
    contentsData = await sql.rows;
  } catch (err) {
    console.log(await err);
  }
  // console.log(await 'selectQuery return Data')
  // console.log(await contentsData)
  await connection.close();
  return await contentsData;
}
async function deleteSQL(sqlQuery){
  let connection = await getDBConnection();
    
    let del = req.params.cust_name;
    try {
        const query = await connection.execute(
            sqlQuery +
        `delete from customer 
        where cust_name = :del`,
        [del]
        );
        connection.commit();
        console.log("Deletion successful ", query.rowsAffected);
    } catch (err) {
        console.error(err);
    }
    await connection.close();
}

module.exports = { selectQuery, getDBConnection }