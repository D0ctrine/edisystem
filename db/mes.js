var oracledb = require('oracledb');
var dotenv = require('dotenv');
dotenv.config(); //LOAD CONFIG

oracledb.autoCommit = true;

async function getDBConnection() {
  let connection = await oracledb.getConnection({
      user: process.env.MES_DB_USER,
      password: process.env.MES_DB_PASSWORD,
      connectString: process.env.MES_DB_HOST
  });
  return connection;
}

async function selectQuery(query, params) {
  let connection = await getDBConnection(DB_TYPE);
  let contentsData = await '';

  //clob 테이블 있을시에 String Fetch
  if(query.toUpperCase().indexOf('EDI_QUERY_SETTING')>0) {
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

async function updateSQL() {
  let connection = await getDBConnection();
  const updated_name = req.body.updated_cust_name;
  const name = req.body.cust_name;
  console.log(" Updated name : ", updated_name);
  console.log("Previous name : ", name);
  try {
    const query = await connection.execute(
      `update customer 
    set cust_name =:updated_name
    where cust_name=:name`,
      [updated_name, name]
    );
    connection.commit();
    console.log("Update successful ", query.rowsAffected);
  } catch (err) {
    console.error("There are some error ");
  }
  await connection.close();
}

module.exports = { selectQuery, getDBConnection }