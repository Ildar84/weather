const Agenda = require('agenda');
const List = require('circular-list');
const addWeatherToMongo = require('./weatherModel');
var fetch = require('node-fetch');

const db_connection_string = process.env.DB_STRING;
const weather_key = process.env.APP_ID;

let agenda = new Agenda();
agenda.database(db_connection_string);

const times = [
  {when: 'morning', time: '8:00'},
  {when: 'day', time: '13:00'},
  {when: 'evening', time: '20:00'}
]

const circularList = new List;

times.forEach((data, index)=>{
  const node = new List.Node(data);
  if(index === times.length -1){
    node.next = circularList.first;
  }
  circularList.append(node);
})

circularList.each(findNextNode)
function getWeather(job, done){
  try {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Rovenki,ua&units=metric&APPID=${weather_key}`)
    .then(res=>res.json())
    .then(res=>{
      if(res.cod!==200) {
        job.schedule('10 minutes');
        console.log('API OpenWeather: server responded with error (code =', res.code, ')');
        done();
      };
      const attrs = job.attrs;
      const newModel = {
        data: res,
        test: 78,
        time: attrs.lastRunAt,
        when: attrs.data.when
      };
      addWeatherToMongo(newModel);
      console.log('The weather data was successfuly added to DB at: ', attrs.data.when, ':', attrs.lastRunAt);
    })
    .then(()=>{
      let nextNode;
      let currNode = circularList.first;

      const findNextNode = (data)=>{
        let step = currNode.next;
        if(data.when === job.attrs.data.when) {
          nextNode = step;
          return;
        } else currNode = step;
      }
      circularList.each(findNextNode)
      job.attrs.data.when = nextNode.data.when;
      job.schedule(nextNode.data.time);
    })
    .then(()=>{
      done()
    })
   } catch (err) {
     console.log('Error while fetching data: ', err);
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
    await agenda.cancel({name: queryStr}, (err,num)=>{
      if(err) console.log('Error canceling ald jobs from DB: ', err)
      console.log('Old jobs were deleted : ',num, ' counts');
    });
    await createAgendaJob(circularList.first.data.when)
      .schedule(circularList.first.data.time, {
        skipImmediate: true,
        timezone: 'Europe/Kiev'
      }).save();
  } catch (err) {
    console.log('Error while setting initial job: ', err);
  }
};

module.exports = setJobs;
