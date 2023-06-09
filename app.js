
const express = require("express");

const app = express();

const sqlite3 = require("sqlite3");

app.use(express.json());

const { open } = require("sqlite");

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Hi User, Server is running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error Message:'${e.message}'`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictToResponseObject = (dbObject) => {
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

const convertDistrictToResponseObject2 = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachPlayer) => convertStateToResponseObject(eachPlayer))
  );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateToResponseObject(state));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postStateQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName},'${stateId}','${cases}',${cured},'${active}','${deaths}');`;
  const addDistrict = await db.run(postStateQuery);
  const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district
    WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictToResponseObject(district));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE  FROM district
    WHERE district_id = ${districtId};`;
  const deletedDistrict = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE district SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateResultQuery = `SELECT SUM(cases) AS cases,
   SUM(cured) AS cured,
   SUM(active) AS active,
   SUM(deaths) AS deaths
   FROM district 
  WHERE state_id : ${stateId};`;
  const resultQuery = await db.get(getStateResultQuery);
  response.send(convertDistrictToResponseObject2(resultQuery));
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM state JOIN district ON state.state_id = district.state_id
    WHERE district.district_id = ${districtIs};`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
