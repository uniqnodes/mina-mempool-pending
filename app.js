const fetch = require("node-fetch")
const express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')


var app = express()
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(stylus.middleware(
  {
    src: __dirname + '/public'
    , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))

app.get('/', async (req, res) => {
  res.render('index',
    { liste: await startFetchMyQuery() }
  )
})
app.listen(3743)

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    "http://95.111.236.24:8000/graphql",
    {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      }),
      headers: { "Content-Type": "application/json" }
    }
  );

  return await result.json();
}

const operationsDoc = `
  query MyQuery {
    pooledUserCommands {
      fee
    }
  }
`;

function fetchMyQuery() {
  return fetchGraphQL(
    operationsDoc,
    "MyQuery",
    {}
  );
}

async function startFetchMyQuery() {
  const { errors, data } = await fetchMyQuery();

  if (errors) {
    // handle those errors like a pro
    console.error(errors);
  }

  let rows = data.pooledUserCommands;
  var occurences = rows.reduce(function (r, rows) {
    r[rows.fee] = ++r[rows.fee] || 1;
    return r;
  }, {});

  var result = Object.keys(occurences).map(function (key) {
    return { fee: parseInt(key) / 1000000000, count: occurences[key] };
  });

  var sorted = result.sort(function (a, b) {
    return parseFloat(a.fee) - parseFloat(b.fee);
  }).reverse()

  return await sorted;
}

startFetchMyQuery();