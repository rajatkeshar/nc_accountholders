const mongoose = require('mongoose');

mongoose.model("AcHolders", {
  address: {
    type: String,
    require: true
  },
  balance: {
    type: Number,
    require: true
  },
  share: {
    type: Number,
    require: true
  }
});
