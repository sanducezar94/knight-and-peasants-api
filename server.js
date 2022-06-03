const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

require('./routes/knights')(app);
require('./routes/peasants')(app);
require('./routes/bags')(app);
require('./routes/collection')(app);

app.listen(8000, async function () {
  console.log('API running on port 8000');
});