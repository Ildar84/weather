const mongoose = require('mongoose');

const WeatherSchema = mongoose.Schema({
    when: String,
    data: Object,
    time: String,
  });

const Weather = mongoose.model('Weather', WeatherSchema);

const addWeatherToMongo = (newObject)=>{
    const item = new Weather(newObject);
    item.save();
}

module.exports = addWeatherToMongo;
