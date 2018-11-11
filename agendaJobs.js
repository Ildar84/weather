const Agenda = require('agenda');
const addWeatherToMongo = require('./weatherModel');

const db_connection_string = process.env.DB_STRING;
const weather_key = process.env.APP_ID;

let agenda = new Agenda();
agenda.database(db_connection_string);

function getWeather(job, done){
  try {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Rovenki,ua&units=metric&APPID=${weather_key}`)
    .then(res=>res.json())
    .then(res=>{
      if(res.cod!==200) {
        job.schedule('5 minutes');
        done();
      };
      const attrs = job.attrs;
      const newModel = {
        data: res,
        test: 78,
        time: attrs.lastRunAt,
        when: attrs.data.when
      };
      addWeatherToMongo(newModel)
    })
    .then(()=>{
      done()
    })
   } catch (err) {
     console.log(err);
   }
}

const createAgendaJob = (when)=>{
  return agenda.create('getWeather', {when: when});
}
agenda.define('getWeather', getWeather);

const setJobs = async function(){
  const queryStr = /getWe*/;
  try {
    await agenda.start();
    await agenda.cancel({name: queryStr}, (err,num)=>{console.log(num)});
    const morningJob = await createAgendaJob('morning').repeatEvery('7:00am', {skipImmediate: true}).save();
    const dayJob = await createAgendaJob('day').repeatEvery('1:00pm',{skipImmediate: true}).save();
    const eveningJob = await createAgendaJob('evening').repeatEvery('7:00pm',{skipImmediate: true}).save();
  } catch (err) {
    console.log(err);
  }
};

module.exports = setJobs;
