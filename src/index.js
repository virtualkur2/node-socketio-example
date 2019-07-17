const express = require('express');

const onConnection = (client) => {
  console.info('Client connected');
  client.on('event', onEvent);
  client.on('disconnect', onDisconnect);
}

const onEvent = (data) => {
  console.info('Data received:');
  console.log(data);
}

const onDisconnect = () => {
  console.info('Client disconnected');
}

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', onConnection);


const template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Socket example</title>
  </head>
  <body>
    <button type="button" value="connect" id="connect">Conectar</button>
    <br>
    <button type="button" id="getdata" disabled>Obtener datos</button>
    <br>
    <br>
    <div id="datacontainer">
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io({
          autoConnect: false
        });
        const connectBtn = document.getElementById('connect');
        const getDataBtn = document.getElementById('getdata');
        const dataContainer = document.getElementById('datacontainer');

        connectBtn.addEventListener('click', (event) => {
          if(connectBtn.value === 'connect') {
            socket.open();
            connectBtn.value = 'disconnect';
            connectBtn.innerText = 'Desconectar';
            getDataBtn.removeAttribute('disabled');
          } else {
            socket.close();
            connectBtn.value = 'connect';
            connectBtn.innerText = 'Conectar';
            getDataBtn.setAttribute('disabled', '');
          }
        });

        getDataBtn.addEventListener('click', (event) => {
          event.preventDefault();
          fetch('http://localhost:3000/feeds')
            .then((response) => {
              return response.json();
            })
            .then((response) => {
              console.log(response);
            });
        });

        const onData = (data) => {
          dataContainer.innerHTML += '<span>' + data + '</span><br><br>';
        }

        socket.on('data', onData);

    </script>
  </body>
  </html>
`

app.io = io;
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

//app.use(express.static('public'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'localhost'); // <- Habilitado localhost para desarrollo
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/feeds', (req, res) => {
  const date = new Date(Date.now());
  const data = 'On: ' + date.toString() + ', you\'ve requested some data';
  req.io.emit('data', data);
  return res.status(200).json({ data });
});

app.get('/', (req, res) => {
  return res.status(200).send(template);
});

server.listen(3000, () => {
  console.info('App listen on port 3000');
})
