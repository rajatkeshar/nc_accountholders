const mongoose = require('mongoose');

mongoose.model("AcHolders", {
  address: {
    type: String,
    require: true
  },
  data: {
    type: Array,
    require: true
  }
});
