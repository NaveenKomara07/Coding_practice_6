
const express = require("express");

const app = express();

const sqlite3 = require("sqlite3");

app.use(express.json());
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch initial message from the server
    axios.get('http://localhost:3001/initialize-database')
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error(error));

    // Fetch transactions for the selected month
    fetchTransactions();
  }, [selectedMonth, currentPage, searchText]);

  const fetchTransactions = () => {
    axios.get(`http://localhost:3001/list-transactions?month=${selectedMonth}&page=${currentPage}&search=${searchText}`)
      .then((response) => setTransactions(response.data.transactions))
      .catch((error) => console.error(error));
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="App">
      <h1>{message}</h1>

      <label>Select Month:</label>
      <select value={selectedMonth} onChange={handleMonthChange}>
        {/* Populate months dynamically */}
        <option value="January">January</option>
        <option value="February">February</option>
        <option value="March">March</option>
        {/* Add other months as needed */}
      </select>

      <h2>Transactions for {selectedMonth}</h2>

      <input type="text" placeholder="Search transactions" value={searchText} onChange={handleSearchChange} />
      <button onClick={() => setSearchText('')}>Clear Search</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Date of Sale</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>{transaction.price}</td>
              <td>{transaction.date_of_sale}</td>
              <td>{transaction.category}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handlePrevPage}>Previous</button>
      <button onClick={handleNextPage}>Next</button>
    </div>
  );
}

export default App;

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
