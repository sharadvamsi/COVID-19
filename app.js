const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const stateCon = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const disCon = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const query = `
    SELECT * FROM state;`;
  const dbresponse = await db.all(query);
  response.send(dbresponse.map((each) => stateCon(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const dbresponse = await db.get(query);
  response.send(stateCon(dbresponse));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbresponse = await db.run(query);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const dbresponse = await db.get(query);
  response.send(disCon(dbresponse));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  const dbresponse = await db.get(query);
  response.send("District Removed");
});

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `
    UPDATE district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;
  const dbresponse = await db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE
    state_id = ${stateId};`;
  const dbresponse = await db.get(query);
  response.send({
    totalCases: dbresponse["SUM(cases)"],
    totalCured: dbresponse["SUM(cured)"],
    totalActive: dbresponse["SUM(active)"],
    totalDeaths: dbresponse["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
